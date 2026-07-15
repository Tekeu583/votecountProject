<?php

namespace App\Services;

use App\Events\ResultsCalculated;
use App\Models\Candidate;
use App\Models\Election;
use App\Models\Result;
use Illuminate\Support\Facades\DB;

class ResultService
{
    public function __construct(protected IrvTabulationService $irvTabulationService) {}

    public function calculateResults(Election $election): void
    {
        DB::transaction(function () use ($election) {
            // Clear previous results
            Result::where('election_id', $election->id)->delete();

            $candidates = $election->candidates()->approved()->get();
            $irv = null;

            if ($election->vote_type->value === 'ranked') {
                $irv = $this->irvTabulationService->tabulate($election, $candidates);
                $results = $this->buildRankedResults($irv, $candidates);
            } else {
                $results = [];
                foreach ($candidates as $candidate) {
                    $results[] = $this->calculateCandidateResult($election, $candidate);
                }

                // Calculate rankings
                usort($results, function ($a, $b) {
                    return $b['final_score'] <=> $a['final_score'];
                });
            }

            foreach ($results as $index => $resultData) {
                Result::create([
                    'election_id' => $election->id,
                    'candidate_id' => $resultData['candidate_id'],
                    'total_votes' => $resultData['total_votes'],
                    'public_votes' => $resultData['public_votes'],
                    'jury_votes' => $resultData['jury_votes'],
                    'ranking_points' => $resultData['ranking_points'],
                    'final_score' => $resultData['final_score'],
                    'percentage' => $resultData['percentage'],
                    'rank' => $index + 1,
                    'calculated_at' => now(),
                ]);
            }

            // Update candidate final scores
            foreach ($results as $resultData) {
                Candidate::where('id', $resultData['candidate_id'])->update([
                    'final_score' => $resultData['final_score'],
                ]);
            }

            // Create snapshot - pour ranked, on enveloppe avec la trace d'audit
            // IRV (rounds, départages) sans changer le format des autres types.
            $snapshotPayload = $irv !== null
                ? [
                    'results' => $results,
                    'irv' => [
                        'rounds' => $irv['rounds'],
                        'final_tie_break' => $irv['final_tie_break'],
                        'first_choice_counts' => $irv['first_choice_counts'],
                        'total_ballots' => $irv['total_ballots'],
                        'winner_candidate_id' => $irv['winner_candidate_id'],
                    ],
                ]
                : $results;

            $election->resultSnapshots()->create([
                'snapshot' => $snapshotPayload,
                'created_at' => now(),
            ]);

            event(new ResultsCalculated($election));
        });
    }

    protected function calculateCandidateResult(Election $election, Candidate $candidate): array
    {
        // Get votes for this candidate
        $voteItems = DB::table('vote_items')
            ->join('votes', 'vote_items.vote_id', '=', 'votes.id')
            ->where('vote_items.candidate_id', $candidate->id)
            ->where('votes.election_id', $election->id)
            ->where('votes.status', 'completed')
            ->get();

        $totalVotes = $voteItems->sum('quantity');

        // Calculate based on vote type (ranked elections never reach this method - see calculateResults())
        switch ($election->vote_type->value) {
            case 'score':
                $averageScore = $voteItems->avg('score') ?? 0;
                $finalScore = $averageScore;
                break;

            default:
                $finalScore = $totalVotes;
        }

        // Calculate percentage
        $totalValidVotes = DB::table('vote_items')
            ->join('votes', 'vote_items.vote_id', '=', 'votes.id')
            ->where('votes.election_id', $election->id)
            ->where('votes.status', 'completed')
            ->sum('vote_items.quantity');

        $percentage = $totalValidVotes > 0 ? ($totalVotes / $totalValidVotes) * 100 : 0;

        $juryNote = 0;
        // Gate strict sur "weighted" : les autres vote_type ne doivent plus
        // être affectés par jury_weight (bug latent corrigé - avant, ce bloc
        // se déclenchait pour n'importe quel vote_type dès que jury_weight > 0).
        if ($election->vote_type->value === 'weighted') {
            $juryNote = $this->calculateJuryNote($election, $candidate);
            // La part de voix publique (0-100%) est ramenée sur 0-10 pour être
            // sur la même échelle que la note jury (déjà normalisée sur 10 par
            // calculateJuryNote - pas de seconde division ici).
            $finalScore = ($percentage / 10) * $election->public_weight
                + $juryNote * $election->jury_weight;
        }

        return [
            'candidate_id' => $candidate->id,
            'candidate_uuid' => $candidate->uuid,
            'total_votes' => $totalVotes,
            'public_votes' => $totalVotes,
            // Colonne bigInteger — la note jury (0-10, décimale) n'y tient pas
            // exactement ; c'est un champ informatif, la précision réelle
            // reste dans final_score (decimal).
            'jury_votes' => (int) round($juryNote),
            'ranking_points' => 0,
            'final_score' => round($finalScore, 2),
            'percentage' => round($percentage, 2),
        ];
    }

    /**
     * Note jury pondérée d'un candidat (échelle 0-10) : chaque critère est
     * d'abord normalisé sur 10 (avg_score/max_score × 10) puis pondéré par
     * criteria.weight, avant moyenne - un critère noté sur 5 ne doit pas être
     * écrasé par un critère noté sur 20.
     */
    protected function calculateJuryNote(Election $election, Candidate $candidate): float
    {
        $criteria = $election->juryCriteria()->get(['id', 'weight', 'max_score']);
        if ($criteria->isEmpty()) {
            return 0;
        }

        $weightedSum = 0;
        $weightTotal = 0;
        foreach ($criteria as $criterion) {
            $avgScore = DB::table('jury_scores')
                ->where('candidate_id', $candidate->id)
                ->where('criteria_id', $criterion->id)
                ->avg('score') ?? 0;

            $normalized = $criterion->max_score > 0 ? ($avgScore / $criterion->max_score) * 10 : 0;
            $weightedSum += $normalized * $criterion->weight;
            $weightTotal += $criterion->weight;
        }

        return $weightTotal > 0 ? $weightedSum / $weightTotal : 0;
    }

    /**
     * Transforme le classement IRV final (déjà vainqueur-en-premier) au format
     * attendu par calculateResults() - pas de tri supplémentaire à appliquer.
     */
    protected function buildRankedResults(array $irv, $candidates): array
    {
        $candidatesById = $candidates->keyBy('id');
        $results = [];

        foreach ($irv['final_order'] as $candidateId) {
            $lastRound = null;
            foreach ($irv['rounds'] as $roundRecord) {
                if (array_key_exists($candidateId, $roundRecord['counts'])) {
                    $lastRound = $roundRecord;
                }
            }

            $lastRoundCount = $lastRound['counts'][$candidateId] ?? 0;
            $lastRoundTotal = $lastRound['total_active'] ?? 0;
            $firstChoice = $irv['first_choice_counts'][$candidateId] ?? 0;

            $results[] = [
                'candidate_id' => $candidateId,
                'candidate_uuid' => $candidatesById[$candidateId]->uuid,
                'total_votes' => $firstChoice,
                'public_votes' => $firstChoice,
                'jury_votes' => 0,
                'ranking_points' => $lastRoundCount,
                'final_score' => round($lastRoundTotal > 0 ? ($lastRoundCount / $lastRoundTotal) * 100 : 0, 2),
                'percentage' => round($irv['total_ballots'] > 0 ? ($firstChoice / $irv['total_ballots']) * 100 : 0, 2),
            ];
        }

        return $results;
    }

    public function getLiveResults(Election $election): array
    {
        // Cache results for 1 minute
        return cache()->remember("live_results_{$election->id}", 60, function () use ($election) {
            $results = Result::where('election_id', $election->id)
                ->with('candidate')
                ->orderBy('rank')
                ->get();

            return [
                'election_id' => $election->uuid,
                'title' => $election->title,
                'status' => $election->status->value,
                'total_votes' => $election->total_votes,
                'participation_rate' => $election->getParticipationRate(),
                'results' => $results->map(function ($result) {
                    return [
                        'candidate_id' => $result->candidate->uuid,
                        'candidate_name' => $result->candidate->full_name,
                        'votes' => $result->total_votes,
                        'percentage' => $result->percentage,
                        'final_score' => $result->final_score,
                        'rank' => $result->rank,
                    ];
                }),
                'last_updated' => now()->toIso8601String(),
            ];
        });
    }
}

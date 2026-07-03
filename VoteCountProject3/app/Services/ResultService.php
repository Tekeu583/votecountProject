<?php

namespace App\Services;

use App\Events\ResultsCalculated;
use App\Models\Candidate;
use App\Models\Election;
use App\Models\Result;
use Illuminate\Support\Facades\DB;

class ResultService
{
    public function calculateResults(Election $election): void
    {
        DB::transaction(function () use ($election) {
            // Clear previous results
            Result::where('election_id', $election->id)->delete();

            $candidates = $election->candidates()->approved()->get();
            $results = [];

            foreach ($candidates as $candidate) {
                $result = $this->calculateCandidateResult($election, $candidate);
                $results[] = $result;
            }

            // Calculate rankings
            usort($results, function ($a, $b) {
                return $b['final_score'] <=> $a['final_score'];
            });

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

            // Create snapshot
            $election->resultSnapshots()->create([
                'snapshot' => $results,
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

        // Calculate based on vote type
        switch ($election->vote_type->value) {
            case 'ranked':
                $rankingPoints = $this->calculateRankingPoints($voteItems, $election->candidates()->count());
                $finalScore = $rankingPoints;
                break;

            case 'score':
                $averageScore = $voteItems->avg('score') ?? 0;
                $finalScore = $averageScore;
                break;

            default:
                $finalScore = $totalVotes;
        }

        // Add jury scores if enabled
        $juryScore = 0;
        if ($election->jury_weight > 0) {
            $juryScores = $candidate->juryScores()->avg('score') ?? 0;
            $juryScore = $juryScores * $election->jury_weight;
            $finalScore = ($finalScore * $election->public_weight) + $juryScore;
        }

        // Calculate percentage
        $totalValidVotes = DB::table('vote_items')
            ->join('votes', 'vote_items.vote_id', '=', 'votes.id')
            ->where('votes.election_id', $election->id)
            ->where('votes.status', 'completed')
            ->sum('vote_items.quantity');

        $percentage = $totalValidVotes > 0 ? ($totalVotes / $totalValidVotes) * 100 : 0;

        return [
            'candidate_id' => $candidate->id,
            'total_votes' => $totalVotes,
            'public_votes' => $totalVotes,
            'jury_votes' => 0,
            'ranking_points' => $rankingPoints ?? 0,
            'final_score' => round($finalScore, 2),
            'percentage' => round($percentage, 2),
        ];
    }

    protected function calculateRankingPoints($voteItems, int $totalCandidates): float
    {
        $points = 0;
        $weights = $this->getRankingWeights($totalCandidates);

        foreach ($voteItems as $item) {
            if ($item->rank_position && isset($weights[$item->rank_position])) {
                $points += $weights[$item->rank_position];
            }
        }

        return $points;
    }

    protected function getRankingWeights(int $totalCandidates): array
    {
        $weights = [];
        for ($i = 1; $i <= $totalCandidates; $i++) {
            $weights[$i] = $totalCandidates - $i + 1;
        }

        return $weights;
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

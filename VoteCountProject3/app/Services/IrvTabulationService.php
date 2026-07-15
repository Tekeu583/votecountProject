<?php

namespace App\Services;

use App\Models\Election;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

/**
 * Instant Runoff Voting (IRV) - dépouillement complet à la clôture.
 *
 * L'algorithme élimine les candidats un par un jusqu'à n'en laisser qu'un
 * seul, plutôt que de s'arrêter dès qu'une majorité est atteinte : une fois
 * qu'un candidat détient la majorité active, ses voix ne peuvent que croître
 * en proportion (elles ne diminuent jamais, seul le total actif peut baisser
 * par épuisement), donc le vainqueur final est identique à un IRV à arrêt
 * anticipé - et cette approche fournit gratuitement un classement complet
 * des N candidats, nécessaire pour remplir une ligne Result par candidat.
 */
class IrvTabulationService
{
    public function tabulate(Election $election, Collection $candidates): array
    {
        $candidateIds = $candidates->pluck('id')->all();

        $ballots = $this->loadBallots($election, $candidateIds);

        if (count($candidateIds) <= 1) {
            return $this->trivialResult($candidateIds, $ballots);
        }

        [$firstChoiceFrozen, $frozenRankCounts, $maxRankObserved] = $this->freezeRankData($ballots, $candidateIds);

        $totalBallots = $ballots->sum('quantity');

        $remaining = collect($candidateIds)->values();
        $eliminationOrder = [];
        $rounds = [];
        $previousRoundCounts = null;
        $finalTieBreak = null;
        $round = 1;

        while (true) {
            $counts = array_fill_keys($remaining->all(), 0);
            $exhaustedQty = 0;

            foreach ($ballots as $ballot) {
                $choice = null;
                foreach ($ballot['ranking'] as $candidateId) {
                    if ($remaining->contains($candidateId)) {
                        $choice = $candidateId;
                        break;
                    }
                }

                if ($choice === null) {
                    $exhaustedQty += $ballot['quantity'];
                } else {
                    $counts[$choice] += $ballot['quantity'];
                }
            }

            $totalActive = array_sum($counts);
            $majorityThreshold = intdiv($totalActive, 2) + 1;
            $leader = $totalActive > 0 ? array_search(max($counts), $counts) : null;
            $majorityReachedBy = ($leader !== null && $counts[$leader] >= $majorityThreshold) ? $leader : null;

            $roundRecord = [
                'round' => $round,
                'counts' => $counts,
                'total_active' => $totalActive,
                'exhausted_this_round' => $exhaustedQty,
                'majority_threshold' => $majorityThreshold,
                'majority_reached_by' => $majorityReachedBy,
                'eliminated' => null,
                'tie_break' => null,
            ];

            if ($remaining->count() === 2) {
                [$c1, $c2] = $remaining->all();

                if ($counts[$c1] !== $counts[$c2]) {
                    $loser = $counts[$c1] < $counts[$c2] ? $c1 : $c2;
                    $tieBreak = null;
                } else {
                    [$winner, $loser, $tieBreak] = $this->resolveFinalTie(
                        [$c1, $c2],
                        $firstChoiceFrozen,
                        $frozenRankCounts,
                        $maxRankObserved
                    );
                }

                $roundRecord['eliminated'] = $loser;
                $roundRecord['tie_break'] = $tieBreak;
                $finalTieBreak = $tieBreak;

                $eliminationOrder[] = ['candidate_id' => $loser, 'round' => $round, 'reason' => 'final_round', 'tie_break' => $tieBreak];
                $remaining = $remaining->reject(fn ($id) => $id === $loser)->values();
                $rounds[] = $roundRecord;
                break;
            }

            $minCount = min($counts);
            $tiedForLast = collect($counts)->filter(fn ($c) => $c === $minCount)->keys()->all();

            if (count($tiedForLast) === 1) {
                $eliminated = $tiedForLast[0];
                $tieBreak = null;
            } else {
                [$eliminated, $tieBreak] = $this->resolveEliminationTie(
                    $tiedForLast,
                    $previousRoundCounts,
                    $firstChoiceFrozen,
                    $frozenRankCounts,
                    $maxRankObserved
                );
            }

            $roundRecord['eliminated'] = $eliminated;
            $roundRecord['tie_break'] = $tieBreak;

            $eliminationOrder[] = ['candidate_id' => $eliminated, 'round' => $round, 'reason' => 'lowest_count', 'tie_break' => $tieBreak];
            $previousRoundCounts = $counts;
            $remaining = $remaining->reject(fn ($id) => $id === $eliminated)->values();
            $rounds[] = $roundRecord;
            $round++;
        }

        $winner = $remaining->first();
        $finalOrder = array_merge(
            [$winner],
            array_reverse(array_column($eliminationOrder, 'candidate_id'))
        );

        return [
            'winner_candidate_id' => $winner,
            'final_order' => $finalOrder,
            'rounds' => $rounds,
            'first_choice_counts' => $firstChoiceFrozen,
            'total_ballots' => $totalBallots,
            'final_tie_break' => $finalTieBreak,
        ];
    }

    private function loadBallots(Election $election, array $candidateIds): Collection
    {
        $rows = DB::table('vote_items')
            ->join('votes', 'vote_items.vote_id', '=', 'votes.id')
            ->where('votes.election_id', $election->id)
            ->where('votes.status', 'completed')
            ->whereIn('vote_items.candidate_id', $candidateIds)
            ->orderBy('vote_items.vote_id')
            ->orderBy('vote_items.rank_position')
            ->get(['vote_items.vote_id', 'vote_items.candidate_id', 'vote_items.rank_position', 'vote_items.quantity']);

        return $rows->groupBy('vote_id')->map(function (Collection $items) {
            return [
                'ranking' => $items->sortBy('rank_position')->pluck('candidate_id')->all(),
                'quantity' => (int) $items->first()->quantity,
            ];
        })->values();
    }

    private function freezeRankData(Collection $ballots, array $candidateIds): array
    {
        $firstChoice = array_fill_keys($candidateIds, 0);
        $rankCounts = array_fill_keys($candidateIds, []);
        $maxRankObserved = 0;

        foreach ($ballots as $ballot) {
            foreach ($ballot['ranking'] as $index => $candidateId) {
                $rank = $index + 1;
                $maxRankObserved = max($maxRankObserved, $rank);
                $rankCounts[$candidateId][$rank] = ($rankCounts[$candidateId][$rank] ?? 0) + $ballot['quantity'];

                if ($rank === 1) {
                    $firstChoice[$candidateId] += $ballot['quantity'];
                }
            }
        }

        return [$firstChoice, $rankCounts, $maxRankObserved];
    }

    /**
     * Départage d'élimination - désigne qui ÉLIMINER parmi les candidats à
     * égalité (rétrécit à chaque étape en gardant le(s) minimum(s)).
     */
    private function resolveEliminationTie(
        array $tied,
        ?array $previousRoundCounts,
        array $firstChoiceFrozen,
        array $frozenRankCounts,
        int $maxRankObserved
    ): array {
        if ($previousRoundCounts !== null) {
            $narrowed = $this->narrowBy($tied, fn ($c) => $previousRoundCounts[$c] ?? 0, min: true);
            if (count($narrowed) === 1) {
                return [$narrowed[0], ['method' => 'previous_round_count', 'candidates_considered' => $tied, 'chosen' => $narrowed[0]]];
            }
            $tied = $narrowed;
        }

        $narrowed = $this->narrowBy($tied, fn ($c) => $firstChoiceFrozen[$c] ?? 0, min: true);
        if (count($narrowed) === 1) {
            return [$narrowed[0], ['method' => 'first_choice_count', 'candidates_considered' => $tied, 'chosen' => $narrowed[0]]];
        }
        $tied = $narrowed;

        for ($rank = 2; $rank <= $maxRankObserved; $rank++) {
            $narrowed = $this->narrowBy($tied, fn ($c) => $frozenRankCounts[$c][$rank] ?? 0, min: true);
            if (count($narrowed) === 1) {
                return [$narrowed[0], ['method' => "rank_{$rank}_choice_count", 'candidates_considered' => $tied, 'chosen' => $narrowed[0]]];
            }
            $tied = $narrowed;
        }

        $chosen = $tied[random_int(0, count($tied) - 1)];

        return [$chosen, ['method' => 'random_draw', 'candidates_considered' => $tied, 'chosen' => $chosen]];
    }

    /**
     * Départage du tour final (2 candidats) - désigne le VAINQUEUR (rétrécit
     * en gardant le(s) maximum(s)), et ne compare JAMAIS le round précédent.
     */
    private function resolveFinalTie(
        array $tied,
        array $firstChoiceFrozen,
        array $frozenRankCounts,
        int $maxRankObserved
    ): array {
        $candidates = $this->narrowBy($tied, fn ($c) => $firstChoiceFrozen[$c] ?? 0, min: false);

        if (count($candidates) === 1) {
            $winner = $candidates[0];
            $loser = $this->other($tied, $winner);

            return [$winner, $loser, ['method' => 'first_choice_count', 'candidates_considered' => $tied, 'chosen' => $winner]];
        }

        for ($rank = 2; $rank <= $maxRankObserved; $rank++) {
            $narrowed = $this->narrowBy($candidates, fn ($c) => $frozenRankCounts[$c][$rank] ?? 0, min: false);
            if (count($narrowed) === 1) {
                $winner = $narrowed[0];
                $loser = $this->other($tied, $winner);

                return [$winner, $loser, ['method' => "rank_{$rank}_choice_count", 'candidates_considered' => $tied, 'chosen' => $winner]];
            }
            $candidates = $narrowed;
        }

        $winner = $tied[random_int(0, 1)];
        $loser = $this->other($tied, $winner);

        return [$winner, $loser, ['method' => 'random_draw', 'candidates_considered' => $tied, 'chosen' => $winner]];
    }

    private function narrowBy(array $candidates, callable $valueOf, bool $min): array
    {
        $values = array_map($valueOf, $candidates);
        $target = $min ? min($values) : max($values);

        return array_values(array_filter(
            $candidates,
            fn ($c) => $valueOf($c) === $target
        ));
    }

    private function other(array $pair, mixed $chosen): mixed
    {
        return $pair[0] === $chosen ? $pair[1] : $pair[0];
    }

    private function trivialResult(array $candidateIds, Collection $ballots): array
    {
        $winner = $candidateIds[0] ?? null;
        $totalBallots = $ballots->sum('quantity');

        return [
            'winner_candidate_id' => $winner,
            'final_order' => $candidateIds,
            'rounds' => [[
                'round' => 1,
                'counts' => $winner !== null ? [$winner => $totalBallots] : [],
                'total_active' => $totalBallots,
                'exhausted_this_round' => 0,
                'majority_threshold' => intdiv($totalBallots, 2) + 1,
                'majority_reached_by' => $winner,
                'eliminated' => null,
                'tie_break' => null,
            ]],
            'first_choice_counts' => $winner !== null ? [$winner => $totalBallots] : [],
            'total_ballots' => $totalBallots,
            'final_tie_break' => null,
        ];
    }
}

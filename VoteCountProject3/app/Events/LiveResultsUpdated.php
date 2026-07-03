<?php

namespace App\Events;

use App\Models\Election;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;

/**
 * Broadcasté après chaque vote dans une élection avec real_time_results = true.
 *
 * Canal public : election.{id}.live
 * → reçu par tous les visiteurs de la page de vote en temps réel
 *
 * Payload : scores par candidat recalculés à chaud (sans passer par ResultService
 * complet qui est lourd — on fait une agrégation légère directement en SQL).
 */
class LiveResultsUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public Election $election) {}

    public function broadcastOn(): array
    {
        return [
            // Canal public — tous les votants voient les résultats live
            new Channel("election.{$this->election->id}.live"),
        ];
    }

    public function broadcastWith(): array
    {
        $totalVotes = $this->sumTotalQuantity();

        // Agrégation légère par candidat selon le vote_type
        $scores = $this->computeLiveScores($totalVotes);

        return [
            'election_uuid' => $this->election->uuid,
            'total_votes'   => $totalVotes,
            'scores'        => $scores,
            'updated_at'    => now()->toIso8601String(),
        ];
    }

    public function broadcastAs(): string
    {
        return 'results.live';
    }

    private function sumTotalQuantity(): int
    {
        return (int) DB::table('vote_items')
            ->join('votes', 'vote_items.vote_id', '=', 'votes.id')
            ->where('votes.election_id', $this->election->id)
            ->where('votes.status', 'completed')
            ->sum('vote_items.quantity');
    }
    /**
     * Calcul léger des scores en temps réel.
     * Intentionnellement simplifié — pas de pondération jury (trop lourd à chaque vote).
     * Le jury_weight est appliqué lors du calcul final des résultats.
     */
    private function computeLiveScores(int $totalVotes): array
    {
        $voteType = $this->election->vote_type->value;

        $rows = DB::table('vote_items')
            ->join('votes', 'vote_items.vote_id', '=', 'votes.id')
            ->join('candidates', 'vote_items.candidate_id', '=', 'candidates.id')
            ->where('votes.election_id', $this->election->id)
            ->where('votes.status', 'completed')
            ->select(
                'candidates.uuid as candidate_uuid',
                'candidates.full_name',
                'candidates.photo',
                DB::raw('SUM(vote_items.quantity) as vote_count'),
                DB::raw('AVG(vote_items.score) as avg_score'),
                DB::raw('SUM(vote_items.weight) as total_weight'),
                DB::raw('AVG(vote_items.rank_position) as avg_rank'),
            )
            ->groupBy(
                'candidates.uuid',
                'candidates.full_name',
                'candidates.photo',
            )
            ->orderByDesc('vote_count')
            ->get();

        return $rows->values()->map(function ($row, $index) use ($totalVotes, $voteType) {
            $score = match ($voteType) {
                'score'    => round((float) $row->avg_score, 2),
                'weighted' => round((float) $row->total_weight, 2),
                'ranked'   => round(10 - (float) $row->avg_rank, 2),
                default    => (int) $row->vote_count,
            };

            $percentage = $totalVotes > 0
                ? round(($row->vote_count / $totalVotes) * 100, 1)
                : 0;

            // rank = position dans la liste déjà triée par vote_count DESC
            $rank = $index + 1;
            $rankLabel = match ($rank) {
                1       => '1er',
                2       => '2ème',
                3       => '3ème',
                default => $rank . 'ème',
            };

            return [
                'candidate_uuid' => $row->candidate_uuid,
                'full_name'      => $row->full_name,
                'photo'          => $row->photo,
                'vote_count'     => (int) $row->vote_count,
                'score'          => $score,
                'percentage'     => $percentage,
                'rank'           => $rank,
                'rank_label'     => $rankLabel,
            ];
        })->toArray();
    }

    public static function computeScores(Election $election): array
    {
        $totalVotes = DB::table('votes')
            ->where('election_id', $election->id)
            ->where('status', 'completed')
            ->count();
        return [
            'total_votes' => $totalVotes,
            'scores' => (new self($election))->computeLiveScores($totalVotes),
        ];
    }
}

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
        $query = DB::table('vote_items')
            ->join('votes', 'vote_items.vote_id', '=', 'votes.id')
            ->where('votes.election_id', $this->election->id)
            ->where('votes.status', 'completed');

        // Pour ranked, chaque bulletin a une ligne vote_items par candidat classé
        // (donc N lignes pour un bulletin classant N candidats) — sommer quantity
        // sur toutes ces lignes surcompterait. Le nombre de bulletins réel est le
        // nombre de 1ers choix (chaque bulletin a exactement un rang 1).
        if ($this->election->vote_type->value === 'ranked') {
            $query->where('vote_items.rank_position', 1);
        }

        return (int) $query->sum('vote_items.quantity');
    }

    /**
     * Calcul léger des scores en temps réel.
     * Intentionnellement simplifié — pas de pondération jury (trop lourd à chaque vote).
     * Le jury_weight est appliqué lors du calcul final des résultats.
     */
    private function computeLiveScores(int $totalVotes): array
    {
        $voteType = $this->election->vote_type->value;

        if ($voteType === 'ranked') {
            return $this->computeLiveRankedScores($totalVotes);
        }

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
            )
            ->groupBy(
                'candidates.uuid',
                'candidates.full_name',
                'candidates.photo',
            )
            ->orderByDesc('vote_count')
            ->get();

        return $rows->values()->map(function ($row, $index) use ($totalVotes, $voteType) {
            // "weighted" n'a pas de score dédié en live : la pondération jury
            // n'est appliquée qu'au calcul final (ResultService) — en live,
            // seul le nombre de voix publiques compte, comme pour "single".
            $score = match ($voteType) {
                'score'    => round((float) $row->avg_score, 2),
                default    => (int) $row->vote_count,
            };

            $percentage = $totalVotes > 0
                ? round(($row->vote_count / $totalVotes) * 100, 1)
                : 0;

            // rank = position dans la liste déjà triée par vote_count DESC
            $rank = $index + 1;

            return [
                'candidate_uuid' => $row->candidate_uuid,
                'full_name'      => $row->full_name,
                'photo'          => $row->photo,
                'vote_count'     => (int) $row->vote_count,
                'score'          => $score,
                'percentage'     => $percentage,
                'rank'           => $rank,
                'rank_label'     => $this->rankLabel($rank),
            ];
        })->toArray();
    }

    /**
     * Approximation live pour ranked : classement par nombre de 1ers choix
     * uniquement (PAS un IRV complet — les transferts de voix ne sont
     * calculés qu'à la clôture par IrvTabulationService). Le frontend doit
     * afficher un badge "classement provisoire" pour ce vote_type.
     */
    private function computeLiveRankedScores(int $totalVotes): array
    {
        $rows = DB::table('vote_items')
            ->join('votes', 'vote_items.vote_id', '=', 'votes.id')
            ->join('candidates', 'vote_items.candidate_id', '=', 'candidates.id')
            ->where('votes.election_id', $this->election->id)
            ->where('votes.status', 'completed')
            ->where('vote_items.rank_position', 1)
            ->select(
                'candidates.uuid as candidate_uuid',
                'candidates.full_name',
                'candidates.photo',
                DB::raw('SUM(vote_items.quantity) as vote_count'),
            )
            ->groupBy('candidates.uuid', 'candidates.full_name', 'candidates.photo')
            ->orderByDesc('vote_count')
            ->get();

        return $rows->values()->map(function ($row, $index) use ($totalVotes) {
            $percentage = $totalVotes > 0
                ? round(($row->vote_count / $totalVotes) * 100, 1)
                : 0;
            $rank = $index + 1;

            return [
                'candidate_uuid' => $row->candidate_uuid,
                'full_name'      => $row->full_name,
                'photo'          => $row->photo,
                'vote_count'     => (int) $row->vote_count,
                'score'          => $percentage,
                'percentage'     => $percentage,
                'rank'           => $rank,
                'rank_label'     => $this->rankLabel($rank),
            ];
        })->toArray();
    }

    private function rankLabel(int $rank): string
    {
        return match ($rank) {
            1       => '1er',
            2       => '2ème',
            3       => '3ème',
            default => $rank . 'ème',
        };
    }

    public static function computeScores(Election $election): array
    {
        // Doit utiliser la même définition de "total" que broadcastWith()
        // (somme de quantity, pas un COUNT de lignes votes) — sinon les votes
        // payants achetés en bloc (quantity > 1) faussent le pourcentage
        // (candidat à quantity=5 sur un total de 1 "vote" = 500%).
        $instance = new self($election);
        $totalVotes = $instance->sumTotalQuantity();
        return [
            'total_votes' => $totalVotes,
            'scores' => $instance->computeLiveScores($totalVotes),
        ];
    }
}

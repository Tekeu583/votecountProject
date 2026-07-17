<?php

namespace App\Http\Controllers\Api\V1\Analytics;

use App\Http\Controllers\Api\V1\BaseApiController;
use App\Models\Election;
use App\Models\Elector;
use App\Models\Organization;
use App\Models\PaymentTransaction;
use App\Services\AnalyticsService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AnalyticsController extends BaseApiController
{
    protected AnalyticsService $analyticsService;

    public function __construct(AnalyticsService $analyticsService)
    {
        $this->analyticsService = $analyticsService;
    }

    public function dashboard(Request $request): JsonResponse
    {
        $this->authorize('view analytics');

        // Scoping explicite par organization_uuid en query param — le
        // TenantMiddleware (current_organization) n'est branché sur aucune
        // route de l'app, $request->get('current_organization') était donc
        // toujours null ici et total_elections/active_elections comptaient
        // silencieusement 0 (ou des lignes orphelines) au lieu de scoper.
        $organization = $request->filled('organization_uuid')
            ? Organization::where('uuid', $request->query('organization_uuid'))->first()
            : null;

        $electionsQuery = Election::query();
        if ($organization) {
            $electionsQuery->where('organization_id', $organization->id);
        }

        $stats = [
            'total_elections' => (clone $electionsQuery)->count(),
            'total_votes' => (clone $electionsQuery)->sum('total_votes'),
            'active_elections' => (clone $electionsQuery)->ongoing()->count(),
            'total_revenue' => $this->totalRevenue($organization),
            'participation_rate' => $this->averageParticipationRate($electionsQuery),
            'recent_activity' => $this->analyticsService->getRecentActivity($organization),
            'elections_by_status' => $this->analyticsService->getElectionsByStatus($organization),
            'votes_over_time' => $this->analyticsService->getVotesOverTime($organization, 30),
        ];

        return $this->success($stats);
    }

    private function totalRevenue(?Organization $organization): float
    {
        $query = PaymentTransaction::where('status', 'completed');
        if ($organization) {
            $query->forOrganization($organization->id);
        }

        return (float) $query->sum('net_amount');
    }

    /**
     * Moyenne des taux de participation des élections avec un dénominateur
     * fiable (privées/restreintes — une élection publique n'a pas de liste
     * d'électeurs fixe, même logique que ElectionResultats.jsx côté front).
     */
    private function averageParticipationRate(Builder $electionsQuery): float
    {
        // Election::getParticipationRate() lance electors()->count() par
        // élection — appelée ici sur la page d'accueil du dashboard (trafic
        // élevé), ça revenait à un count() par élection privée/restreinte
        // de l'organisation. Un seul GROUP BY remplace ces N requêtes.
        $elections = (clone $electionsQuery)
            ->where('election_mode', '!=', 'public')
            ->get(['id', 'total_votes']);

        if ($elections->isEmpty()) {
            return 0;
        }

        $eligibleCounts = Elector::whereIn('election_id', $elections->pluck('id'))
            ->where('status', 'active')
            ->selectRaw('election_id, count(*) as total')
            ->groupBy('election_id')
            ->pluck('total', 'election_id');

        $rates = $elections
            ->map(function (Election $election) use ($eligibleCounts) {
                $total = $eligibleCounts[$election->id] ?? 0;

                return $total > 0 ? ($election->total_votes / $total) * 100 : 0;
            })
            ->filter(fn ($rate) => $rate > 0);

        return $rates->isEmpty() ? 0 : round($rates->avg(), 2);
    }

    public function electionStats(Election $election): JsonResponse
    {
        $this->authorize('viewResults', $election);

        $stats = [
            'basic_stats' => [
                'total_electors' => $election->electors()->count(),
                'total_votes' => $election->total_votes,
                'participation_rate' => $election->getParticipationRate(),
                'unique_voters' => $election->votes()->distinct('elector_id')->count(),
            ],
            'voting_patterns' => $this->analyticsService->getVotingPatterns($election),
            'hourly_distribution' => $this->analyticsService->getHourlyVoteDistribution($election),
            'device_stats' => $this->analyticsService->getDeviceStatistics($election),
            'geo_distribution' => $this->analyticsService->getGeographicDistribution($election),
        ];

        return $this->success($stats);
    }
}

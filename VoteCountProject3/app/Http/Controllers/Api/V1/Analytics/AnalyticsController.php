<?php

namespace App\Http\Controllers\Api\V1\Analytics;

use App\Http\Controllers\Api\V1\BaseApiController;
use App\Models\Election;
use App\Services\AnalyticsService;
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

        $organization = $request->get('current_organization');

        $stats = [
            'total_elections' => Election::where('organization_id', $organization?->id)->count(),
            'total_votes' => 0,
            'active_elections' => Election::where('organization_id', $organization?->id)
                ->ongoing()
                ->count(),
            'total_revenue' => 0,
            'participation_rate' => 0,
            'recent_activity' => $this->analyticsService->getRecentActivity($organization),
            'elections_by_status' => $this->analyticsService->getElectionsByStatus($organization),
            'votes_over_time' => $this->analyticsService->getVotesOverTime($organization, 30),
        ];

        return $this->success($stats);
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

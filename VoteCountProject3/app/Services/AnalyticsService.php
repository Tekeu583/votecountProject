<?php

namespace App\Services;

use App\Models\Election;
use App\Models\Organization;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class AnalyticsService
{
    public function getRecentActivity(?Organization $organization, int $limit = 10): array
    {
        $query = DB::table('votes')
            ->join('elections', 'votes.election_id', '=', 'elections.id')
            ->where('votes.status', 'completed')
            ->orderBy('votes.created_at', 'desc')
            ->limit($limit);

        if ($organization) {
            $query->where('elections.organization_id', $organization->id);
        }

        return $query->get(['votes.uuid', 'votes.created_at', 'elections.title'])
            ->map(function ($item) {
                return [
                    'vote_uuid' => $item->uuid,
                    'election_title' => $item->title,
                    'timestamp' => $item->created_at->toIso8601String(),
                ];
            })->toArray();
    }

    public function getElectionsByStatus(?Organization $organization): array
    {
        $query = DB::table('elections');

        if ($organization) {
            $query->where('organization_id', $organization->id);
        }

        return $query->select('status', DB::raw('count(*) as count'))
            ->groupBy('status')
            ->get()
            ->pluck('count', 'status')
            ->toArray();
    }

    public function getVotesOverTime(?Organization $organization, int $days): array
    {
        $query = DB::table('votes')
            ->join('elections', 'votes.election_id', '=', 'elections.id')
            ->where('votes.status', 'completed')
            ->where('votes.created_at', '>=', now()->subDays($days));

        if ($organization) {
            $query->where('elections.organization_id', $organization->id);
        }

        return $query->select(
            DB::raw('DATE(votes.created_at) as date'),
            DB::raw('count(*) as total')
        )
            ->groupBy('date')
            ->orderBy('date')
            ->get()
            ->toArray();
    }

    public function getVotingPatterns(Election $election): array
    {
        return Cache::remember("voting_patterns_{$election->id}", 300, function () use ($election) {
            return [
                'average_votes_per_hour' => $this->getAverageVotesPerHour($election),
                'peak_voting_hours' => $this->getPeakVotingHours($election),
                'average_vote_duration' => $this->getAverageVoteDuration($election),
            ];
        });
    }

    public function getHourlyVoteDistribution(Election $election): array
    {
        return DB::table('votes')
            ->where('election_id', $election->id)
            ->where('status', 'completed')
            ->select(DB::raw('EXTRACT(HOUR FROM created_at) as hour'), DB::raw('count(*) as total'))
            ->groupBy('hour')
            ->orderBy('hour')
            ->get()
            ->toArray();
    }

    public function getDeviceStatistics(Election $election): array
    {
        return DB::table('votes')
            ->where('election_id', $election->id)
            ->where('status', 'completed')
            ->select('browser', 'operating_system', DB::raw('count(*) as total'))
            ->groupBy('browser', 'operating_system')
            ->get()
            ->toArray();
    }

    public function getGeographicDistribution(Election $election): array
    {
        return DB::table('votes')
            ->where('election_id', $election->id)
            ->where('status', 'completed')
            ->whereNotNull('country')
            ->select('country', DB::raw('count(*) as total'))
            ->groupBy('country')
            ->orderBy('total', 'desc')
            ->limit(10)
            ->get()
            ->toArray();
    }

    protected function getAverageVotesPerHour(Election $election): float
    {
        $hoursSinceStart = max(1, now()->diffInHours($election->start_at));
        $totalVotes = $election->total_votes;

        return $hoursSinceStart > 0 ? $totalVotes / $hoursSinceStart : 0;
    }

    protected function getPeakVotingHours(Election $election): array
    {
        return DB::table('votes')
            ->where('election_id', $election->id)
            ->where('status', 'completed')
            ->select(DB::raw('EXTRACT(HOUR FROM created_at) as hour'), DB::raw('count(*) as total'))
            ->groupBy('hour')
            ->orderBy('total', 'desc')
            ->limit(3)
            ->get()
            ->toArray();
    }

    protected function getAverageVoteDuration(Election $election): float
    {
        return DB::table('votes')
            ->where('election_id', $election->id)
            ->where('status', 'completed')
            ->whereNotNull('voter_session_id')
            ->select(DB::raw('AVG(EXTRACT(EPOCH FROM (votes.created_at - voter_sessions.started_at))) as avg_seconds'))
            ->join('voter_sessions', 'votes.voter_session_id', '=', 'voter_sessions.id')
            ->value('avg_seconds') ?? 0;
    }
}

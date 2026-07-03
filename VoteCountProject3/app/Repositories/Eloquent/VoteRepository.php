<?php

namespace App\Repositories\Eloquent;

use App\Models\Vote;
use App\Repositories\Contracts\VoteRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class VoteRepository extends BaseRepository implements VoteRepositoryInterface
{
    public function __construct(Vote $model)
    {
        parent::__construct($model);
    }

    public function getByElection(int $electionId, int $perPage = 15): LengthAwarePaginator
    {
        return $this->model->where('election_id', $electionId)
            ->with(['elector', 'items.candidate'])
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);
    }

    public function getByElector(int $electorId, int $perPage = 15): LengthAwarePaginator
    {
        return $this->model->where('elector_id', $electorId)
            ->with('election')
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);
    }

    public function hasElectorVoted(int $electionId, int $electorId): bool
    {
        return $this->model->where('election_id', $electionId)
            ->where('elector_id', $electorId)
            ->where('status', 'completed')
            ->exists();
    }

    public function getFraudulentVotes(int $electionId, float $threshold = 0.7): Collection
    {
        return $this->model->where('election_id', $electionId)
            ->where('fraud_score', '>', $threshold)
            ->where('status', 'fraud_suspected')
            ->with('elector')
            ->get();
    }

    public function getVoteCountByCandidate(int $electionId): array
    {
        return DB::table('vote_items')
            ->join('votes', 'vote_items.vote_id', '=', 'votes.id')
            ->where('votes.election_id', $electionId)
            ->where('votes.status', 'completed')
            ->select('vote_items.candidate_id', DB::raw('count(*) as total'))
            ->groupBy('vote_items.candidate_id')
            ->get()
            ->pluck('total', 'candidate_id')
            ->toArray();
    }
}

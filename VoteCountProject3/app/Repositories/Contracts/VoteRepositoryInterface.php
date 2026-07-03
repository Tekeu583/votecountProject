<?php

namespace App\Repositories\Contracts;

use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;

interface VoteRepositoryInterface extends BaseRepositoryInterface
{
    public function getByElection(int $electionId, int $perPage = 15): LengthAwarePaginator;

    public function getByElector(int $electorId, int $perPage = 15): LengthAwarePaginator;

    public function hasElectorVoted(int $electionId, int $electorId): bool;

    public function getFraudulentVotes(int $electionId, float $threshold = 0.7): Collection;

    public function getVoteCountByCandidate(int $electionId): array;
}

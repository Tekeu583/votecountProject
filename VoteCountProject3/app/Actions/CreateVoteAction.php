<?php

namespace App\Actions;

use App\DTOs\VoteDTO;
use App\Exceptions\VoteException;
use App\Models\Election;
use App\Models\Elector;
use App\Models\Vote;
use App\Services\FraudDetectionService;
use App\Services\VotingService;

class CreateVoteAction
{
    protected VotingService $votingService;

    protected FraudDetectionService $fraudDetectionService;

    public function __construct(
        VotingService $votingService,
        FraudDetectionService $fraudDetectionService
    ) {
        $this->votingService = $votingService;
        $this->fraudDetectionService = $fraudDetectionService;
    }

    public function execute(Elector $elector, Election $election, VoteDTO $dto): Vote
    {
        if (! $elector->is_active) {
            throw VoteException::electorBlocked();
        }

        if (! $elector->is_verified) {
            throw VoteException::electorNotVerified();
        }

        // Check election status
        if (! $election->is_votable) {
            throw $election->end_at < now()
                ? VoteException::electionClosed()
                : VoteException::electionNotStarted();
        }
        // Start voting session
        $session = $this->votingService->startSession(
            $election,
            $elector,
            $dto->ipAddress,
            $dto->deviceInfo
        );

        // Submit vote
        $vote = $this->votingService->submitVote($elector, $election, $session, $dto);


        // Fraud detection
        $fraudScore = $this->fraudDetectionService->analyzeVote($vote, $elector, $election, $dto);

        if ($fraudScore > 0.5) {
            $vote->updateFraudScore([], $fraudScore);
        }

        return $vote;
    }
}

<?php

namespace App\Services;

use App\DTOs\VoteDTO;
use App\Events\LiveResultsUpdated;
use App\Events\VoteCast;
use App\Exceptions\VoteException;
use App\Jobs\ProcessFraudDetection;
use App\Jobs\ProcessVotePayment;
use App\Models\Candidate;
use App\Models\Election;
use App\Models\Elector;
use App\Models\Vote;
use App\Models\VoteItem;
use App\Models\VoteReceipt;
use App\Models\VoterSession;
use App\Repositories\Contracts\VoteRepositoryInterface;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class VotingService
{
    protected VoteRepositoryInterface $voteRepository;

    public function __construct(VoteRepositoryInterface $voteRepository)
    {
        $this->voteRepository = $voteRepository;
    }

    public function startSession(Election $election, Elector $elector, string $ip, array $deviceInfo): VoterSession
    {
        // Check if elector can vote

        if (! $elector->canVote()) {
            throw VoteException::maxVotesExceeded($elector->election->max_votes_per_user);
        }

        // Check election status
        if (! $election->is_votable) {
            if ($election->end_at < now()) {
                throw VoteException::electionClosed();
            }
            throw VoteException::electionNotStarted();
        }

        // Create session
        return VoterSession::create([
            'election_id' => $election->id,
            'elector_id' => $elector->id,
            'ip_address' => $ip,
            'device' => $deviceInfo['device'] ?? null,
            'browser' => $deviceInfo['browser'] ?? null,
            'os' => $deviceInfo['os'] ?? null,
            'location' => $deviceInfo['location'] ?? null,
            'session_token' => bin2hex(random_bytes(32)),
            'started_at' => now(),
            'status' => 'active',
        ]);
    }

    // You have already voted in this election
    public function submitVote(Elector $elector, Election $election, VoterSession $session, VoteDTO $dto): Vote
    {
        return DB::transaction(function () use ($elector, $election, $session, $dto) {

            // Check max votes per user
            $userVotes = $elector->votes()
                ->where('election_id', $election->id)
                ->where('status', 'completed')
                ->count();

            if ($userVotes >= $election->max_votes_per_user) {
                throw VoteException::maxVotesExceeded($election->max_votes_per_user);
            }

            $lastSequence = $elector->votes()
                ->where('election_id', $election->id)
                ->max('vote_sequence') ?? 0;
            $nextSequence = $lastSequence + 1;

            // Validate vote items based on vote type
            $this->validateVoteItems($election, $dto->items);


            $isPaid = $election->payment_type === 'paid' && $election->vote_price > 0;
            $totalAmount = 0;
            $itemQuantities = [];

            if ($isPaid) {
                $priceCents = (int) round(((float) $election->vote_price) * 100);

                foreach ($dto->items as $index => $item) {
                    $amount = $item['amount'] ?? null;

                    if ($amount === null) {
                        // Rétrocompatibilité : pas de montant fourni → 1 voix au prix plein.
                        $itemQuantities[$index] = 1;
                        $totalAmount += $election->vote_price;
                        continue;
                    }

                    $amountCents = (int) round(((float) $amount) * 100);

                    if ($amountCents <= 0 || $amountCents % $priceCents !== 0) {
                        throw VoteException::invalidVoteAmount((float) $election->vote_price);
                    }

                    $quantity = intdiv($amountCents, $priceCents);
                    $itemQuantities[$index] = $quantity;
                    $totalAmount += $amount;
                }
            } else {
                foreach ($dto->items as $index => $item) {
                    $itemQuantities[$index] = 1;
                }
            }
            // Create vote
            $vote = $this->voteRepository->create([
                'election_id' => $election->id,
                'elector_id' => $elector->id,
                'voter_session_id' => $session->id,
                'ip_address' => $dto->ipAddress,
                'device_id' => $dto->deviceId,
                'browser' => $dto->browser,
                'operating_system' => $dto->operatingSystem,
                'country' => $dto->country,
                'city' => $dto->city,
                'vote_type' => $dto->voteType ?? 'standard',
                'is_paid' => $isPaid,
                'total_amount' => $totalAmount,
                'vote_sequence' => $nextSequence,
                'idempotency_key' => $dto->idempotencyKey,
            ]);

            // Create vote items
            foreach ($dto->items as $index => $item) {
                $candidate = Candidate::where('uuid', $item['candidate_uuid'] ?? $item['candidate_id'])
                    ->where('election_id', $election->id)
                    ->firstOrFail();

                VoteItem::create([
                    'vote_id' => $vote->id,
                    'candidate_id' => $candidate->id,
                    'rank_position' => $item['rank_position'] ?? null,
                    'score' => $item['score'] ?? null,
                    'weight' => $item['weight'] ?? 1,
                    'quantity' => $itemQuantities[$index],
                ]);
            }

            // Process payment if needed
            if ($isPaid) {
                return $vote;
            }

            // Complete vote
            $vote->markAsCompleted();

            // Créer le reçu de vote (preuve vérifiable par l'électeur)
            VoteReceipt::firstOrCreate([
                'uuid'         => Str::uuid()->toString(),
                'vote_id'      => $vote->id,
                'receipt_code' => strtoupper(Str::random(12)),
                'issued_at'    => now(),
            ]);

            // Complete session
            $session->complete();

            // Dispatch fraud detection job
            dispatch(new ProcessFraudDetection($vote));

            // Dispatch event
            event(new VoteCast($vote));

            // Résultats en temps réel — seulement si activé sur cette élection
            if ($election->real_time_results) {
                event(new LiveResultsUpdated($election));
            }
            // Clear cache
            Cache::tags(['election_' . $election->id])->flush();

            return $vote;
        });
    }

    protected function validateVoteItems(Election $election, array $items): void
    {
        $candidateIds = array_column($items, 'candidate_uuid') ?: array_column($items, 'candidate_id');
        // Check for duplicates
        if (count($candidateIds) !== count(array_unique($candidateIds))) {
            throw new \Exception('Duplicate candidates not allowed');
        }

        // Check max choices
        if ($election->max_choices && count($items) > $election->max_choices) {
            throw new \Exception('Maximum choices exceeded');
        }

        // Validate based on vote type
        switch ($election->vote_type->value) {
            case 'single':
                if (count($items) !== 1) {
                    throw new \Exception('Single vote allows only one candidate');
                }
                break;

            case 'ranked':
                foreach ($items as $item) {
                    if (! isset($item['rank_position'])) {
                        throw new \Exception('Rank position required for ranked voting');
                    }
                }
                break;

            case 'score':
                foreach ($items as $item) {
                    if (! isset($item['score']) || $item['score'] < 0 || $item['score'] > 10) {
                        throw new \Exception('Score must be between 0 and 10');
                    }
                }
                break;
        }
    }

    public function verifyVoteReceipt(string $receiptCode): ?Vote
    {
        $receipt = VoteReceipt::where('receipt_code', $receiptCode)->first();

        return $receipt ? $receipt->vote : null;
    }
}

<?php

namespace App\Services;

use App\Enums\WithdrawalStatus;
use App\Exceptions\PaymentException;
use App\Models\Organization;
use App\Models\User;
use App\Models\WithdrawalRequest;
use Illuminate\Support\Facades\DB;

class WithdrawalService
{
    public function __construct(protected RevenueService $revenueService) {}

    /**
     * Crée une demande de retrait.
     *
     * lockForUpdate() sur la ligne organisation : pas de table wallet dédiée,
     * donc l'organisation elle-même sert d'ancre de verrou pour empêcher deux
     * demandes concurrentes de dépasser ensemble le solde réel — même
     * philosophie que CandidateNumberService::next() (verrou pessimiste dans
     * une transaction, cf. sa documentation pour le scénario de course
     * évité).
     */
    public function createRequest(Organization $organization, User $user, array $data): WithdrawalRequest
    {
        return DB::transaction(function () use ($organization, $user, $data) {
            $locked = Organization::where('id', $organization->id)->lockForUpdate()->firstOrFail();

            if (! $locked->isKycVerified()) {
                throw PaymentException::kycNotVerified();
            }

            $hasOutstanding = WithdrawalRequest::forOrganization($locked->id)
                ->whereIn('status', [WithdrawalStatus::PENDING->value, WithdrawalStatus::APPROVED->value])
                ->exists();

            if ($hasOutstanding) {
                throw PaymentException::withdrawalRequestPending();
            }

            $available = $this->revenueService->availableBalance($locked);

            if ((float) $data['amount'] > $available) {
                throw PaymentException::insufficientAvailableBalance();
            }

            return WithdrawalRequest::create([
                'organization_id' => $locked->id,
                'requested_by' => $user->id,
                'amount' => $data['amount'],
                'phone_number' => $data['phone_number'],
                'payout_provider' => $data['payout_provider'] ?? null,
            ]);
        });
    }

    public function approve(WithdrawalRequest $withdrawal, User $reviewer): WithdrawalRequest
    {
        return DB::transaction(function () use ($withdrawal, $reviewer) {
            $locked = WithdrawalRequest::where('id', $withdrawal->id)->lockForUpdate()->firstOrFail();

            if ($locked->status !== WithdrawalStatus::PENDING) {
                throw PaymentException::withdrawalNotPending();
            }

            $locked->update([
                'status' => WithdrawalStatus::APPROVED,
                'reviewed_by' => $reviewer->id,
                'reviewed_at' => now(),
            ]);

            return $locked;
        });
    }

    public function reject(WithdrawalRequest $withdrawal, User $reviewer, string $reason): WithdrawalRequest
    {
        return DB::transaction(function () use ($withdrawal, $reviewer, $reason) {
            $locked = WithdrawalRequest::where('id', $withdrawal->id)->lockForUpdate()->firstOrFail();

            if ($locked->status !== WithdrawalStatus::PENDING) {
                throw PaymentException::withdrawalNotPending();
            }

            $locked->update([
                'status' => WithdrawalStatus::REJECTED,
                'reviewed_by' => $reviewer->id,
                'reviewed_at' => now(),
                'rejection_reason' => $reason,
            ]);

            return $locked;
        });
    }

    public function markPaid(WithdrawalRequest $withdrawal, User $reviewer, string $reference, ?string $notes): WithdrawalRequest
    {
        return DB::transaction(function () use ($withdrawal, $reviewer, $reference, $notes) {
            $locked = WithdrawalRequest::where('id', $withdrawal->id)->lockForUpdate()->firstOrFail();

            if ($locked->status !== WithdrawalStatus::APPROVED) {
                throw PaymentException::withdrawalNotApproved();
            }

            $locked->update([
                'status' => WithdrawalStatus::PAID,
                'payment_reference' => $reference,
                'admin_notes' => $notes,
                'paid_at' => now(),
            ]);

            return $locked;
        });
    }

    public function cancel(WithdrawalRequest $withdrawal, User $user): WithdrawalRequest
    {
        return DB::transaction(function () use ($withdrawal, $user) {
            $locked = WithdrawalRequest::where('id', $withdrawal->id)->lockForUpdate()->firstOrFail();

            if ($locked->status !== WithdrawalStatus::PENDING) {
                throw PaymentException::withdrawalNotPending();
            }

            $isRequester = $locked->requested_by === $user->id;
            $isOwner = $locked->organization->owner_user_id === $user->id;

            if (! $isRequester && ! $isOwner && ! $user->isSuperAdmin()) {
                throw PaymentException::withdrawalNotPending();
            }

            $locked->update(['status' => WithdrawalStatus::CANCELLED]);

            return $locked;
        });
    }
}

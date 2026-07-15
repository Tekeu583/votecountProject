<?php

namespace App\Models;

use App\Enums\PaymentStatus;
use App\Models\Election;
use App\Models\Elector;
use App\Models\Organization;
use App\Models\Subscription;
use App\Models\Vote;
use App\Traits\HasUuid;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Builder;


class PaymentTransaction extends Model
{
    use HasFactory, HasUuid;

    protected $table = 'payment_transactions';

    protected $fillable = [
        'uuid',
        'vote_id',
        'election_id',
        'elector_id',
        'subscription_id',
        'organization_id',
        'type',
        'provider',
        'provider_reference',
        'transaction_reference',
        'phone_number',
        'currency',
        'amount',
        'fees',
        'net_amount',
        'payment_method',
        'status',
        'paid_at',
        'failed_reason',
        'provider_response',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'fees' => 'decimal:2',
        'net_amount' => 'decimal:2',
        'paid_at' => 'datetime',
        'provider_response' => 'array',
        'status' => PaymentStatus::class,
    ];

    protected $attributes = [
        'status' => PaymentStatus::PENDING,
        'type'   => 'vote',
    ];

    //  ─────── Relations ───────────────────────────────────────────────
    public function vote(): BelongsTo
    {
        return $this->belongsTo(Vote::class);
    }

    public function election(): BelongsTo
    {
        return $this->belongsTo(Election::class);
    }

    public function elector(): BelongsTo
    {
        return $this->belongsTo(Elector::class);
    }

    public function subscription(): BelongsTo
    {
        return $this->belongsTo(Subscription::class);
    }

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    // ── SCOPES ────────────────────────────────────────────────────

    public function scopeVotes(Builder $query)
    {
        return $query->where('type', 'vote');
    }

    public function scopeSubscriptions( Builder $query)
    {
        return $query->where('type', 'subscription');
    }

    /**
     * organization_id n'est renseigné directement sur cette table QUE pour
     * les transactions d'abonnement (cf. migration
     * add_subscription_support_to_payment_transactions) — pour les votes
     * payants, il faut remonter via election.organization_id.
     */
    public function scopeForOrganization(Builder $query, int $organizationId): Builder
    {
        return $query->where(function (Builder $sub) use ($organizationId) {
            $sub->where('organization_id', $organizationId)
                ->orWhereHas('election', fn (Builder $eq) => $eq->where('organization_id', $organizationId));
        });
    }


    // ── HELPERS ──────────────────────────────────────────────────────────────────────

    public function markAsCompleted(string $providerReference): void
    {
        $this->status             = PaymentStatus::COMPLETED;
        $this->provider_reference = $providerReference;
        $this->paid_at            = now();
        $this->save();

        // Compléter le vote associé si transaction de type vote
        if ($this->vote) {
            $this->vote->markAsCompleted();
        }
    }
    public function markAsFailed(string $reason): void
    {
        $this->status = PaymentStatus::FAILED;
        $this->failed_reason = $reason;
        $this->save();
    }

    public function refund(): void
    {
        $this->status = PaymentStatus::REFUNDED;
        $this->save();
    }

}

<?php

namespace App\Models;

use App\Models\Organization;
use App\Models\PaymentTransaction;
use App\Models\SubscriptionPlan;
use App\Traits\HasUuid;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Subscription extends Model
{
    use HasFactory, HasUuid;

    protected $table = 'subscriptions';

    protected $fillable = [
        'uuid',
        'organization_id',
        'subscription_plan_id',
        'start_at',
        'end_at',
        'auto_renew',
        'status',
    ];

    protected $casts = [
        'start_at' => 'datetime',
        'end_at' => 'datetime',
        'auto_renew' => 'boolean',
    ];

    protected $attributes = [
        'status' => 'active',
        'auto_renew' => false,
    ];

    // ========== RELATIONS ==========

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    public function plan(): BelongsTo
    {
        return $this->belongsTo(SubscriptionPlan::class, 'subscription_plan_id');
    }

    // ========== ACCESSORS ==========

    public function getIsActiveAttribute(): bool
    {
        return $this->status === 'active' && $this->end_at > now();
    }

    public function getDaysRemainingAttribute(): int
    {
        if (! $this->is_active) {
            return 0;
        }

        return max(0, now()->diffInDays($this->end_at, false));
    }

    public function transactions(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(PaymentTransaction::class);
    }
    // ========== HELPERS ==========

    public function renew(): void
    {
        $this->start_at = now();
        $this->end_at   = now()->addDays($this->plan->duration_days);
        $this->status   = 'active';
        $this->save();
    }

    public function cancel(): void
    {
        $this->status = 'cancelled';
        $this->save();
    }


    public function markAsExpired(): void
    {
        $this->status     = 'expired';
        $this->auto_renew = false;
        $this->save();
    }

    /**
     * Retourne la dernière transaction complétée pour cet abonnement.
     */
    public function lastCompletedTransaction(): ?PaymentTransaction
    {
        return $this->transactions()
            ->where('type', 'subscription')
            ->where('status', 'completed')
            ->latest('paid_at')
            ->first();
    }
}

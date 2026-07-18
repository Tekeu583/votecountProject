<?php

namespace App\Models;

use App\Enums\WithdrawalStatus;
use App\Traits\HasAudit;
use App\Traits\HasUuid;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WithdrawalRequest extends Model
{
    use HasAudit, HasFactory, HasUuid;

    protected $table = 'withdrawal_requests';

    protected $fillable = [
        'uuid',
        'organization_id',
        'requested_by',
        'amount',
        'currency',
        'phone_number',
        'payout_provider',
        'status',
        'reviewed_by',
        'reviewed_at',
        'rejection_reason',
        'payment_reference',
        'paid_at',
        'admin_notes',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'status' => WithdrawalStatus::class,
        'reviewed_at' => 'datetime',
        'paid_at' => 'datetime',
    ];

    protected $attributes = [
        'status' => WithdrawalStatus::PENDING,
        'currency' => 'XAF',
    ];

    // ── Relations ────────────────────────────────────────────────

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    public function requester(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requested_by');
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    // ── Scopes ───────────────────────────────────────────────────

    public function scopeForOrganization(Builder $query, int $organizationId): Builder
    {
        return $query->where('organization_id', $organizationId);
    }
}

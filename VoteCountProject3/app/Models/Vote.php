<?php

namespace App\Models;

use App\Models\Election;
use App\Models\Elector;
use App\Models\OTPCode;
use App\Models\PaymentTransaction;
use App\Models\VoteItem;
use App\Models\VoteReceipt;
use App\Models\VoterSession;
use App\Traits\HasUuid;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Str;

class Vote extends Model
{
    use HasFactory, HasUuid;

    protected $table = 'votes';

    protected $fillable = [
        'uuid',
        'election_id',
        'elector_id',
        'voter_session_id',
        'ip_address',
        'device_id',
        'browser',
        'operating_system',
        'country',
        'city',
        'vote_type',
        'verification_method',
        'is_paid',
        'payment_status',
        'otp_verified',
        'total_amount',
        'fraud_score',
        'fraud_rules',
        'fraud_signals',
        'fraud_scores',
        'anomaly_detected',
        'status',
        'submitted_at',
        'validated_at',
        'vote_sequence',
        'attempt_number',
        'idempotency_key',
    ];

    protected $casts = [
        'is_paid' => 'boolean',
        'otp_verified' => 'boolean',
        'anomaly_detected' => 'boolean',
        'total_amount' => 'decimal:2',
        'fraud_score' => 'float',
        'fraud_rules' => 'array',
        'fraud_signals' => 'array',
        'fraud_scores' => 'array',
        'submitted_at' => 'datetime',
        'validated_at' => 'datetime',
    ];

    protected $attributes = [
        'status' => 'pending',
        'fraud_score' => 0,
        'attempt_number' => 1,
    ];

    // ========== RELATIONS ==========

    public function election(): BelongsTo
    {
        return $this->belongsTo(Election::class);
    }

    public function elector(): BelongsTo
    {
        return $this->belongsTo(Elector::class);
    }

    public function voterSession(): BelongsTo
    {
        return $this->belongsTo(VoterSession::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(VoteItem::class);
    }

    public function paymentTransaction(): HasOne
    {
        return $this->hasOne(PaymentTransaction::class);
    }

    public function otpCodes(): HasMany
    {
        return $this->hasMany(OTPCode::class);
    }

    public function receipt(): HasOne
    {
        return $this->hasOne(VoteReceipt::class);
    }

    // ========== SCOPES ==========

    public function scopeCompleted($query)
    {
        return $query->where('status', 'completed');
    }

    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeByElection($query, int $electionId)
    {
        return $query->where('election_id', $electionId);
    }

    public function scopeByElector($query, int $electorId)
    {
        return $query->where('elector_id', $electorId);
    }

    public function scopeFraudulent($query)
    {
        return $query->where('fraud_score', '>', 0.7);
    }

    // ========== ACCESSORS ==========

    public function getIsCompletedAttribute(): bool
    {
        return $this->status === 'completed';
    }

    public function getIsFraudulentAttribute(): bool
    {
        return $this->fraud_score > 0.7;
    }

    // ========== HELPERS ==========

    public function markAsCompleted(): void
    {
        if ($this->status === 'completed') {
            return;
        }
        $this->status = 'completed';
        $this->validated_at = now();
        $this->save();

        // Update elector
        $this->elector->markAsVoted();

        // Update election stats
        $this->election->increment('total_votes');
        if ($this->is_paid) {
            $this->election->increment('total_revenue', $this->total_amount);
        }

        // Update candidate stats
        $this->load('items.candidate');
        foreach ($this->items as $item) {
            $item->candidate->increment('vote_count', $item->quantity);
        }
    }

    protected function generateReceiptCode(): string
    {
        return 'VOTE_' . strtoupper(Str::random(12));
    }

    public function markAsFraudulent(): void
    {
        $this->status = 'fraud_suspected';
        $this->save();
    }

    public function updateFraudScore(array $signals, float $score): void
    {
        $this->fraud_signals = $signals;
        $this->fraud_score = $score;
        $this->anomaly_detected = $score > 0.7;
        $this->save();
    }
}

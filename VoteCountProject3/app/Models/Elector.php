<?php

namespace App\Models;

use App\Traits\HasSoftDeletesWithUser;
use App\Traits\HasUuid;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Notifications\Notifiable;

class Elector extends Model
{
    use HasFactory, HasSoftDeletesWithUser, HasUuid, Notifiable;

    protected $table = 'electors';

    protected $fillable = [
        'uuid',
        'election_id',
        'user_id',
        'full_name',
        'email',
        'phone',
        'gender',
        'country',
        'city',
        'has_voted',
        'verified_at',
        'fingerprint',
        'type',
        'verification_status',
        'imported_by',
        'import_batch_id',
        'status',
        'deleted_by',
        'scheduled_permanent_delete_at',
    ];

    protected $casts = [
        'has_voted' => 'boolean',
        'verified_at' => 'datetime',
        'deleted_at' => 'datetime',
        'scheduled_permanent_delete_at' => 'datetime',
    ];

    protected $attributes = [
        'has_voted' => false,
        'verification_status' => 'pending',
        'status' => 'active',
        'type' => 'registered',
    ];

    // ========== RELATIONS ==========

    public function election(): BelongsTo
    {
        return $this->belongsTo(Election::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function votes(): HasMany
    {
        return $this->hasMany(Vote::class);
    }

    public function otpCodes(): HasMany
    {
        return $this->hasMany(OTPCode::class);
    }

    public function voterSessions(): HasMany
    {
        return $this->hasMany(VoterSession::class);
    }

    public function paymentTransactions(): HasMany
    {
        return $this->hasMany(PaymentTransaction::class);
    }

    public function fraudReports(): HasMany
    {
        return $this->hasMany(FraudReport::class);
    }

    public function verifications(): HasMany
    {
        return $this->hasMany(ElectorVerification::class);
    }

    public function devices(): HasMany
    {
        return $this->hasMany(Device::class);
    }

    public function voteDrafts(): HasMany
    {
        return $this->hasMany(VoteDraft::class);
    }

    // ========== SCOPES ==========

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopeHasVoted($query)
    {
        return $query->where('has_voted', true);
    }

    public function scopeNotVoted($query)
    {
        return $query->where('has_voted', false);
    }

    public function scopeVerified($query)
    {
        return $query->where('verification_status', 'verified');
    }

    public function scopeByElection($query, int $electionId)
    {
        return $query->where('election_id', $electionId);
    }

    // ========== ACCESSORS ==========

    public function getIsVerifiedAttribute(): bool
    {
        return $this->verification_status === 'verified';
    }

    public function getIsActiveAttribute(): bool
    {
        return $this->status === 'active';
    }

    // ========== HELPERS ==========

    public function markAsVoted(): void
    {
        $votesUsed = $this->votes()
            ->where('election_id', $this->election_id)
            ->where('status', 'completed')
            ->count();

        $max = $this->election->max_votes_per_user ?? 1;

        if ($votesUsed >= $max) {
            $this->has_voted = true;
            $this->save();
        }
    }
    public function verify(): void
    {
        $this->verification_status = 'verified';
        $this->verified_at = now();
        $this->save();
    }

    public function block(): void
    {
        $this->status = 'blocked';
        $this->save();
    }

    public function canVote(): bool
    {
        $votesUsed = $this->votes()
            ->where('election_id', $this->election_id)
            ->where('status', 'completed')
            ->count();

        return $this->is_active
            && $this->is_verified
            && $this->election->is_votable
            && $votesUsed < $this->election->max_votes_per_user;
    }
}

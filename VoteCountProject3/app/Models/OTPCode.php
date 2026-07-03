<?php

namespace App\Models;

use App\Traits\HasUuid;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OTPCode extends Model
{
    use HasFactory, HasUuid;

    protected $table = 'otp_codes';

    protected $fillable = [
        'uuid',
        'vote_id',
        'elector_id',
        'user_id',
        'type',
        'token',
        'code',
        'channel',
        'ip_address',
        'device',
        'expires_at',
        'verified_at',
        'attempts',
        'status',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
        'verified_at' => 'datetime',
    ];

    protected $attributes = [
        'status' => 'pending',
        'attempts' => 0,
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
    public function vote(): BelongsTo
    {
        return $this->belongsTo(Vote::class);
    }

    public function elector(): BelongsTo
    {
        return $this->belongsTo(Elector::class);
    }

    // Ajouter les scopes
    public function scopeForUser($query, int $userId)
    {
        return $query->where('user_id', $userId);
    }

    public function scopeOfType($query, string $type)
    {
        return $query->where('type', $type);
    }

    public function scopeValid($query)
    {
        return $query->where('status', 'pending')
            ->where('expires_at', '>', now());
    }
    public function getIsExpiredAttribute(): bool
    {
        return $this->expires_at->isPast();
    }

    public function getIsVerifiedAttribute(): bool
    {
        return ! is_null($this->verified_at);
    }

    public function verify(): void
    {
        $this->verified_at = now();
        $this->status = 'verified';
        $this->save();
    }

    public function incrementAttempts(): void
    {
        $this->attempts++;

        if ($this->attempts >= 5) {
            $this->status = 'blocked';
        }

        $this->save();
    }
}

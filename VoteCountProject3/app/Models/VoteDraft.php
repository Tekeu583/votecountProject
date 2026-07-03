<?php

namespace App\Models;

use App\Traits\HasUuid;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VoteDraft extends Model
{
    use HasFactory, HasUuid;

    protected $table = 'vote_drafts';

    protected $fillable = [
        'uuid',
        'elector_id',
        'election_id',
        'payload',
        'expires_at',
    ];

    protected $casts = [
        'payload' => 'array',
        'expires_at' => 'datetime',
    ];

    public function elector(): BelongsTo
    {
        return $this->belongsTo(Elector::class);
    }

    public function election(): BelongsTo
    {
        return $this->belongsTo(Election::class);
    }

    public function getIsExpiredAttribute(): bool
    {
        return $this->expires_at->isPast();
    }
}

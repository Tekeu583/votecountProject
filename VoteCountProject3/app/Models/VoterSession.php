<?php

namespace App\Models;

use App\Traits\HasUuid;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class VoterSession extends Model
{
    use HasFactory, HasUuid;

    protected $table = 'voter_sessions';

    protected $fillable = [
        'uuid',
        'election_id',
        'elector_id',
        'ip_address',
        'device',
        'browser',
        'os',
        'location',
        'session_token',
        'started_at',
        'completed_at',
        'status',
    ];

    protected $casts = [
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
    ];

    protected $attributes = [
        'status' => 'active',
    ];

    public function election(): BelongsTo
    {
        return $this->belongsTo(Election::class);
    }

    public function elector(): BelongsTo
    {
        return $this->belongsTo(Elector::class);
    }

    public function votes(): HasMany
    {
        return $this->hasMany(Vote::class);
    }

    public function complete(): void
    {
        $this->status = 'completed';
        $this->completed_at = now();
        $this->save();
    }

    public function expire(): void
    {
        $this->status = 'expired';
        $this->save();
    }
}

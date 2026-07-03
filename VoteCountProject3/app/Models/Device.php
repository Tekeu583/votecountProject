<?php

namespace App\Models;

use App\Traits\HasUuid;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Device extends Model
{
    use HasFactory, HasUuid;

    protected $table = 'devices';

    protected $fillable = [
        'uuid',
        'elector_id',
        'user_id',
        'fingerprint_hash',
        'device_name',
        'browser',
        'os',
        'trusted',
        'last_seen_at',
    ];

    protected $casts = [
        'trusted' => 'boolean',
        'last_seen_at' => 'datetime',
    ];

    protected $attributes = [
        'trusted' => false,
    ];

    public function elector(): BelongsTo
    {
        return $this->belongsTo(Elector::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function markAsTrusted(): void
    {
        $this->trusted = true;
        $this->save();
    }

    public function updateLastSeen(): void
    {
        $this->last_seen_at = now();
        $this->save();
    }
}

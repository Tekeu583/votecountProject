<?php

namespace App\Models;

use App\Enums\FraudSeverity;
use App\Traits\HasUuid;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SecurityAlert extends Model
{
    use HasFactory, HasUuid;

    protected $table = 'security_alerts';

    protected $fillable = [
        'uuid',
        'user_id',
        'elector_id',
        'election_id',
        'type',
        'severity',
        'ip_address',
        'device',
        'location',
        'metadata',
        'resolved_by',
        'resolved_at',
    ];

    protected $casts = [
        'metadata' => 'array',
        'severity' => FraudSeverity::class,
        'resolved_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function elector(): BelongsTo
    {
        return $this->belongsTo(Elector::class);
    }

    public function election(): BelongsTo
    {
        return $this->belongsTo(Election::class);
    }

    public function resolver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'resolved_by');
    }

    public function resolve(int $userId): void
    {
        $this->resolved_by = $userId;
        $this->resolved_at = now();
        $this->save();
    }
}

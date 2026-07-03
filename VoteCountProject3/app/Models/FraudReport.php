<?php

namespace App\Models;

use App\Enums\FraudSeverity;
use App\Traits\HasUuid;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FraudReport extends Model
{
    use HasFactory, HasUuid;

    protected $table = 'fraud_reports';

    protected $fillable = [
        'uuid',
        'election_id',
        'elector_id',
        'type',
        'severity',
        'description',
        'resolved',
    ];

    protected $casts = [
        'severity' => FraudSeverity::class,
        'resolved' => 'boolean',
    ];

    protected $attributes = [
        'resolved' => false,
    ];

    public function election(): BelongsTo
    {
        return $this->belongsTo(Election::class);
    }

    public function elector(): BelongsTo
    {
        return $this->belongsTo(Elector::class);
    }

    public function resolve(): void
    {
        $this->resolved = true;
        $this->save();
    }
}

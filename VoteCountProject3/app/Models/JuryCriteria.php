<?php

namespace App\Models;

use App\Traits\HasUuid;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class JuryCriteria extends Model
{
    use HasFactory, HasUuid;

    protected $table = 'jury_criteria';

    protected $fillable = [
        'uuid',
        'election_id',
        'name',
        'description',
        'weight',
        'max_score',
    ];

    protected $casts = [
        'weight' => 'float',
        'max_score' => 'integer',
    ];

    protected $attributes = [
        'weight' => 1.0,
        'max_score' => 10,
    ];

    public function election(): BelongsTo
    {
        return $this->belongsTo(Election::class);
    }

    public function scores(): HasMany
    {
        return $this->hasMany(JuryScore::class);
    }
}

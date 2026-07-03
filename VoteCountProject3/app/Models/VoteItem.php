<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VoteItem extends Model
{
    use HasFactory;

    protected $table = 'vote_items';

    protected $fillable = [
        'vote_id',
        'candidate_id',
        'rank_position',
        'score',
        'weight',
        'quantity',
    ];

    protected $casts = [
        'rank_position' => 'integer',
        'score' => 'decimal:2',
        'weight' => 'float',
    ];

    protected $attributes = [
        'weight' => 1.0,
    ];

    public function vote(): BelongsTo
    {
        return $this->belongsTo(Vote::class);
    }

    public function candidate(): BelongsTo
    {
        return $this->belongsTo(Candidate::class);
    }
}

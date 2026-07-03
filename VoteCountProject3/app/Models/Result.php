<?php

namespace App\Models;

use App\Traits\HasUuid;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Result extends Model
{
    use HasFactory, HasUuid;

    protected $table = 'results';

    protected $fillable = [
        'uuid',
        'election_id',
        'candidate_id',
        'total_votes',
        'public_votes',
        'jury_votes',
        'ranking_points',
        'final_score',
        'percentage',
        'rank',
        'snapshot_version',
        'calculated_at',
    ];

    protected $casts = [
        'total_votes' => 'integer',
        'public_votes' => 'integer',
        'jury_votes' => 'integer',
        'ranking_points' => 'decimal:2',
        'final_score' => 'decimal:2',
        'percentage' => 'decimal:2',
        'rank' => 'integer',
        'calculated_at' => 'datetime',
    ];

    protected $attributes = [
        'total_votes' => 0,
        'public_votes' => 0,
        'jury_votes' => 0,
        'ranking_points' => 0,
        'final_score' => 0,
        'percentage' => 0,
    ];

    public function election(): BelongsTo
    {
        return $this->belongsTo(Election::class);
    }

    public function candidate(): BelongsTo
    {
        return $this->belongsTo(Candidate::class);
    }

    public function calculateRanking(array $allResults): void
    {
        usort($allResults, function ($a, $b) {
            return $b->final_score <=> $a->final_score;
        });

        foreach ($allResults as $index => $result) {
            if ($result->id === $this->id) {
                $this->rank = $index + 1;
                $this->save();
                break;
            }
        }
    }
}

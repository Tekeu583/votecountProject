<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ElectionAnalytics extends Model
{
    use HasFactory;

    protected $table = 'election_analytics';

    public $timestamps = false;

    protected $fillable = [
        'election_id',
        'total_views',
        'total_votes',
        'unique_voters',
        'conversion_rate',
        'participation_rate',
        'updated_at',
    ];

    protected $casts = [
        'total_views' => 'integer',
        'total_votes' => 'integer',
        'unique_voters' => 'integer',
        'conversion_rate' => 'float',
        'participation_rate' => 'float',
        'updated_at' => 'datetime',
    ];

    public function election(): BelongsTo
    {
        return $this->belongsTo(Election::class);
    }

    public function updateStats(): void
    {
        $this->total_votes = $this->election->votes()->completed()->count();
        $this->unique_voters = $this->election->votes()->completed()->distinct('elector_id')->count('elector_id');
        $this->participation_rate = $this->election->getParticipationRate();
        $this->updated_at = now();
        $this->save();
    }
}

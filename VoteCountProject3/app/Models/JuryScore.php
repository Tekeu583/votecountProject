<?php

namespace App\Models;

use App\Traits\HasUuid;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class JuryScore extends Model
{
    use HasFactory, HasUuid;

    protected $table = 'jury_scores';

    protected $fillable = [
        'uuid',
        'election_id',
        'candidate_id',
        'jury_user_id',
        'criteria_id',
        'score',
        'comment',
    ];

    protected $casts = [
        'score' => 'integer',
    ];

    public function election(): BelongsTo
    {
        return $this->belongsTo(Election::class);
    }

    public function candidate(): BelongsTo
    {
        return $this->belongsTo(Candidate::class);
    }

    public function juryUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'jury_user_id');
    }

    public function criteria(): BelongsTo
    {
        return $this->belongsTo(JuryCriteria::class);
    }
}

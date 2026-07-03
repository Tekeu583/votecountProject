<?php

namespace App\Models;

use App\Traits\HasUuid;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ResultSnapshot extends Model
{
    use HasFactory, HasUuid;

    protected $table = 'result_snapshots';

    protected $fillable = [
        'uuid',
        'election_id',
        'snapshot',
        'created_at',
    ];

    public $timestamps = false;

    protected $casts = [
        'snapshot' => 'array',
        'created_at' => 'datetime',
    ];

    public function election(): BelongsTo
    {
        return $this->belongsTo(Election::class);
    }
}

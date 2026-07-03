<?php

namespace App\Models;

use App\Models\Vote;
use App\Traits\HasUuid;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VoteReceipt extends Model
{
    use HasFactory, HasUuid;

    protected $table = 'vote_receipts';

    protected $fillable = [
        'uuid',
        'vote_id',
        'receipt_code',
        'qr_code',
        'issued_at',
    ];

    protected $casts = [
        'issued_at' => 'datetime',
    ];

    public function vote(): BelongsTo
    {
        return $this->belongsTo(Vote::class);
    }
}

<?php

namespace App\Models;

use App\Traits\HasUuid;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ElectorVerification extends Model
{
    use HasFactory, HasUuid;

    protected $table = 'elector_verifications';

    protected $fillable = [
        'uuid',
        'elector_id',
        'document_type',
        'document_number',
        'status',
        'verified_at',
    ];

    protected $casts = [
        'verified_at' => 'datetime',
    ];

    protected $attributes = [
        'status' => 'pending',
    ];

    public function elector(): BelongsTo
    {
        return $this->belongsTo(Elector::class);
    }
}

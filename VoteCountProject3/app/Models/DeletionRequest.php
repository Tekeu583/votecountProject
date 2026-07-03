<?php

namespace App\Models;

use App\Traits\HasUuid;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DeletionRequest extends Model
{
    use HasFactory, HasUuid;

    protected $table = 'deletion_requests';

    protected $fillable = [
        'uuid',
        'entity_type',
        'entity_id',
        'requested_by',
        'approved_by',
        'status',
        'reason',
    ];

    protected $casts = [
        'status' => 'string',
    ];

    protected $attributes = [
        'status' => 'pending',
    ];

    public function requester(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requested_by');
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function approve(int $userId): void
    {
        $this->status = 'approved';
        $this->approved_by = $userId;
        $this->save();
    }

    public function reject(int $userId): void
    {
        $this->status = 'rejected';
        $this->approved_by = $userId;
        $this->save();
    }
}

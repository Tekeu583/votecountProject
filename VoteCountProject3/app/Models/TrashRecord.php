<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\HasUuid;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TrashRecord extends Model
{
    use HasFactory, HasUuid;

    protected $table = 'trash_records';

    protected $fillable = [
        'uuid',
        'entity_type',
        'entity_id',
        'entity_snapshot',
        'deleted_by',
        'owner_user_id',
        'organization_id',
        'reason',
        'deleted_at',
        'expires_at',
        'restored_at',
        'force_deleted_at',
    ];

    protected $casts = [
        'entity_snapshot' => 'array',
        'deleted_at' => 'datetime',
        'expires_at' => 'datetime',
        'restored_at' => 'datetime',
        'force_deleted_at' => 'datetime',
    ];

    public function deleter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'deleted_by');
    }

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_user_id');
    }

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    public function getModel(): ?Model
    {
        if (!class_exists($this->entity_type)) {
            return null;
        }
        
        return $this->entity_type::withTrashed()->find($this->entity_id);
    }

    public function restore(): bool
    {
        $model = $this->getModel();
        
        if (!$model) {
            return false;
        }
        
        $model->restore();
        $this->restored_at = now();
        $this->save();
        
        return true;
    }

    public function forceDelete(): bool
    {
        $model = $this->getModel();
        
        if (!$model) {
            return false;
        }
        
        $model->forceDelete();
        $this->force_deleted_at = now();
        $this->save();
        
        return true;
    }

    public function getIsExpiredAttribute(): bool
    {
        return $this->expires_at->isPast();
    }

    public function getIsRestoredAttribute(): bool
    {
        return !is_null($this->restored_at);
    }
}
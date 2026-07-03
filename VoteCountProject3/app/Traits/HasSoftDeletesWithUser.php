<?php

namespace App\Traits;

use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Auth;

trait HasSoftDeletesWithUser
{
    use SoftDeletes;

    public static function bootHasSoftDeletesWithUser(): void
    {
        static::deleting(function ($model) {
            if (Auth::check() && $model->isForceDeleting()) {
                $model->deleted_by = Auth::id();
                $model->saveQuietly();
            }
        });

        static::restoring(function ($model) {
            $model->deleted_by = null;
            $model->deleted_at = null;
        });
    }

    public function initializeHasSoftDeletesWithUser(): void
    {
        if (! in_array('deleted_by', $this->fillable)) {
            $this->fillable[] = 'deleted_by';
        }

        if (! in_array('scheduled_permanent_delete_at', $this->fillable)) {
            $this->fillable[] = 'scheduled_permanent_delete_at';
        }
    }

    public function schedulePermanentDeletion(int $days = 60): void
    {
        $this->scheduled_permanent_delete_at = now()->addDays($days);
        $this->save();
    }

    public function isScheduledForDeletion(): bool
    {
        return ! is_null($this->scheduled_permanent_delete_at);
    }

    public function cancelScheduledDeletion(): void
    {
        $this->scheduled_permanent_delete_at = null;
        $this->save();
    }
}

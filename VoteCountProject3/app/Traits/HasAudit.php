<?php

namespace App\Traits;

use App\Models\AuditLog;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

trait HasAudit
{
    protected static function bootHasAudit(): void
    {
        // Désactiver l'audit en environnement de test
        if (app()->environment('testing')) {
            return;
        }

        static::created(function ($model) {
            $model->logAudit('created', $model->getAttributes(), null);
        });

        static::updated(function ($model) {
            $changes = $model->getChanges();
            $original = $model->getOriginal();

            if (! empty($changes)) {
                $model->logAudit('updated', $changes, $original);
            }
        });

        static::deleted(function ($model) {
            if (! $model->isForceDeleting()) {
                $model->logAudit('deleted', null, $model->getAttributes());
            }
        });

        static::restored(function ($model) {
            $model->logAudit('restored', $model->getAttributes(), null);
        });

        static::forceDeleted(function ($model) {
            $model->logAudit('force_deleted', null, $model->getAttributes());
        });
    }

    public function logAudit(string $action, ?array $newValues = null, ?array $oldValues = null): void
    {
        if (! config('audit.enabled', true)) {
            return;
        }
        if (app()->environment('testing')) {
            return;
        }

        try {
            if (class_exists(AuditLog::class)) {
                $requestId = null;
                // ✅ Éviter l'erreur sur request()->id()
                try {
                    $requestId = request()->input('_request_id') ?? request()->header('X-Request-ID');
                } catch (\Exception $e) {
                    // Ignorer l'erreur
                }
                AuditLog::create([
                    'organization_id' => $this->organization_id ?? null,
                    'election_id' => $this->election_id ?? null,
                    'user_id' => Auth::user()->id,
                    'action' => $action,
                    'entity_type' => get_class($this),
                    'entity_id' => $this->id,
                    'old_values' => $oldValues,
                    'new_values' => $newValues,
                    'ip_address' => request()->ip(),
                    'user_agent' => request()->userAgent(),
                    'created_at' => now(),
                ]);
            }
        } catch (\Exception $e) {
            Log::error('Failed to log audit: ' . $e->getMessage());
        }
    }

    private function getTraceId(): ?string
    {
        if (function_exists('request') && request()->hasHeader('X-Trace-Id')) {
            return request()->header('X-Trace-Id');
        }

        return null;
    }

    public function auditLogs()
    {
        return $this->morphMany(AuditLog::class, 'entity');
    }
}

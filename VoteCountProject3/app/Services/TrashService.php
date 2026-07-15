<?php

namespace App\Services;

use App\Models\TrashRecord;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;

/**
 * Prend un instantané d'un modèle juste avant sa suppression (soft delete),
 * pour alimenter la corbeille (Corbeille.jsx / TrashController). Sans ça,
 * ->delete() se contente de poser deleted_at, sans aucune trace exploitable
 * pour lister/restaurer/purger — c'est tout l'objet de trash_records.
 */
class TrashService
{
    public static function snapshot(Model $model, ?int $organizationId, ?int $ownerUserId = null): void
    {
        TrashRecord::create([
            'entity_type' => get_class($model),
            'entity_id' => $model->id,
            'entity_snapshot' => $model->toArray(),
            'deleted_by' => Auth::id(),
            'owner_user_id' => $ownerUserId ?? ($model->created_by ?? null),
            'organization_id' => $organizationId,
            'deleted_at' => now(),
            // Même délai que HasSoftDeletesWithUser::schedulePermanentDeletion()
            // par défaut — jamais appelée nulle part avant ce chantier.
            'expires_at' => now()->addDays(60),
        ]);
    }
}

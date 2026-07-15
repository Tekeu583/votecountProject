<?php

namespace App\Http\Controllers\Api\V1\Trash;

use App\Http\Controllers\Api\V1\BaseApiController;
use App\Http\Resources\Api\V1\TrashRecordResource;
use App\Models\Organization;
use App\Models\TrashRecord;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TrashController extends BaseApiController
{
    public function index(Request $request): JsonResponse
    {
        $organization = $this->resolveOrganization($request);

        $query = TrashRecord::query()
            ->with('deleter')
            ->whereNull('restored_at')
            ->whereNull('force_deleted_at')
            ->when($organization, fn ($q) => $q->where('organization_id', $organization->id))
            ->when($request->filled('search'), function ($q) use ($request) {
                $search = '%' . $request->query('search') . '%';
                $q->where(function ($sub) use ($search) {
                    $sub->where('entity_snapshot->full_name', 'ILIKE', $search)
                        ->orWhere('entity_snapshot->title', 'ILIKE', $search);
                });
            });

        if ($organization) {
            $this->authorize('update', $organization);
        }

        $trashed = $query->orderByDesc('deleted_at')->paginate($request->get('per_page', 20));

        return $this->paginated($trashed, TrashRecordResource::class);
    }

    public function restore(TrashRecord $trashRecord): JsonResponse
    {
        $this->authorizeForRecord($trashRecord);

        if (! $trashRecord->restore()) {
            return $this->error('Impossible de restaurer cet élément (introuvable).', null, 404);
        }

        return $this->success(null, 'Élément restauré avec succès.');
    }

    public function forceDelete(TrashRecord $trashRecord): JsonResponse
    {
        $this->authorizeForRecord($trashRecord);

        if (! $trashRecord->forceDelete()) {
            return $this->error('Impossible de supprimer définitivement cet élément (introuvable).', null, 404);
        }

        return $this->success(null, 'Élément supprimé définitivement.');
    }

    private function resolveOrganization(Request $request): ?Organization
    {
        if (! $request->filled('organization_uuid')) {
            return null;
        }

        return Organization::where('uuid', $request->query('organization_uuid'))->first();
    }

    private function authorizeForRecord(TrashRecord $trashRecord): void
    {
        // Policy "update" sur l'organisation propriétaire — même garde que
        // pour gérer les élections/candidats de cette organisation.
        // Organization::make() (id=null) pour une donnée orpheline sans
        // organization_id : OrganizationPolicy::update() ne plante pas sur
        // un modèle non persisté (comparaison owner_user_id simple), et le
        // Gate::before super-admin s'applique toujours en premier.
        $this->authorize('update', $trashRecord->organization ?? Organization::make());
    }
}

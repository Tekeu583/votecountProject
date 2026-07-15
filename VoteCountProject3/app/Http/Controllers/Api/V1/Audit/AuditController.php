<?php

namespace App\Http\Controllers\Api\V1\Audit;

use App\Http\Controllers\Api\V1\BaseApiController;
use App\Http\Resources\Api\V1\AuditLogResource;
use App\Models\AuditLog;
use App\Models\Organization;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuditController extends BaseApiController
{
    public function index(Request $request): JsonResponse
    {
        $this->authorize('view audit logs');

        $query = AuditLog::with('user');

        if ($request->has('action')) {
            $query->where('action', $request->action);
        }

        if ($request->has('user_id')) {
            $query->where('user_id', $request->user_id);
        }

        if ($request->has('entity_type')) {
            $query->where('entity_type', $request->entity_type);
        }

        if ($request->filled('organization_uuid')) {
            $organization = Organization::where('uuid', $request->query('organization_uuid'))->first();
            $query->where('organization_id', $organization?->id);
        }

        if ($request->filled('date_from')) {
            $query->where('created_at', '>=', $request->query('date_from'));
        }

        if ($request->filled('date_to')) {
            $query->where('created_at', '<=', $request->query('date_to'));
        }

        if ($request->filled('search')) {
            $search = $request->query('search');
            $query->where(function ($q) use ($search) {
                $q->where('action', 'ILIKE', "%{$search}%")
                    ->orWhere('entity_type', 'ILIKE', "%{$search}%");
            });
        }

        $logs = $query->orderBy('created_at', 'desc')
            ->paginate($request->get('per_page', 50));

        return $this->paginated($logs, AuditLogResource::class);
    }

    public function show(AuditLog $auditLog): JsonResponse
    {
        $this->authorize('view audit logs');

        return $this->success(new AuditLogResource($auditLog->load('user')));
    }
}

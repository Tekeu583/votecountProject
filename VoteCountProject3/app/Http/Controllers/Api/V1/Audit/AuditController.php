<?php

namespace App\Http\Controllers\Api\V1\Audit;

use App\Http\Controllers\Api\V1\BaseApiController;
use App\Models\AuditLog;
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

        $logs = $query->orderBy('created_at', 'desc')
            ->paginate($request->get('per_page', 50));

        return $this->paginated($logs);
    }

    public function show(AuditLog $auditLog): JsonResponse
    {
        $this->authorize('view audit logs');

        return $this->success($auditLog);
    }
}

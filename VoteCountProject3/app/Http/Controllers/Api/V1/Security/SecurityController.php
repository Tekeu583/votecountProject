<?php

namespace App\Http\Controllers\Api\V1\Security;

use App\Http\Controllers\Api\V1\BaseApiController;
use App\Http\Resources\Api\V1\SecurityAlertResource;
use App\Models\Election;
use App\Models\SecurityAlert;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

/**
 * Alertes de sécurité (fraude au vote). Le modèle SecurityAlert et le
 * FraudDetectionService existaient déjà côté backend, mais aucune route
 * API n'exposait la liste/résolution de ces alertes.
 */
class SecurityController extends BaseApiController
{
    public function index(Request $request): JsonResponse
    {
        $this->authorize('view security alerts');

        $query = SecurityAlert::with(['election', 'user', 'resolver']);

        if ($request->filled('severity')) {
            $query->where('severity', $request->query('severity'));
        }

        if ($request->has('resolved')) {
            $query->when(
                $request->boolean('resolved'),
                fn ($q) => $q->whereNotNull('resolved_at'),
                fn ($q) => $q->whereNull('resolved_at'),
            );
        }

        if ($request->filled('election_uuid')) {
            $election = Election::where('uuid', $request->query('election_uuid'))->first();
            $query->where('election_id', $election?->id ?? 0);
        }

        if ($request->filled('search')) {
            $search = $request->query('search');
            $query->where(function ($q) use ($search) {
                $q->where('type', 'ilike', "%{$search}%")
                    ->orWhere('ip_address', 'ilike', "%{$search}%")
                    ->orWhere('location', 'ilike', "%{$search}%");
            });
        }

        $alerts = $query->orderByDesc('created_at')->paginate($request->get('per_page', 15));

        return $this->paginated($alerts, SecurityAlertResource::class);
    }

    public function stats(): JsonResponse
    {
        $this->authorize('view security alerts');

        return $this->success([
            'total' => SecurityAlert::count(),
            'unresolved' => SecurityAlert::whereNull('resolved_at')->count(),
            'critical' => SecurityAlert::where('severity', 'critical')->whereNull('resolved_at')->count(),
            'high' => SecurityAlert::where('severity', 'high')->whereNull('resolved_at')->count(),
        ]);
    }

    public function resolve(SecurityAlert $securityAlert): JsonResponse
    {
        $this->authorize('manage security alerts');

        if ($securityAlert->resolved_at) {
            return $this->error('Cette alerte est déjà résolue', null, 400);
        }

        $securityAlert->resolve(Auth::id());

        return $this->success(
            new SecurityAlertResource($securityAlert->fresh(['election', 'user', 'resolver'])),
            'Alerte résolue'
        );
    }
}

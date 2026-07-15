<?php

namespace App\Http\Controllers\Api\V1\Payments;

use App\Http\Controllers\Api\V1\BaseApiController;
use App\Http\Resources\Api\V1\PaymentTransactionResource;
use App\Models\Election;
use App\Models\Organization;
use App\Models\PaymentTransaction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Historique des transactions (revenus) d'une organisation — n'existait
 * nulle part avant : PaymentController ne gère que le flux initiate/verify
 * d'une transaction individuelle, jamais une liste/historique.
 */
class RevenueController extends BaseApiController
{
    public function index(Request $request): JsonResponse
    {
        $this->authorize('view payments');

        $query = $this->scopedQuery($request)->with('election');

        if ($request->filled('status')) {
            $query->where('status', $request->query('status'));
        }
        if ($request->filled('type')) {
            $query->where('type', $request->query('type'));
        }
        if ($request->filled('date_from')) {
            $query->where('created_at', '>=', $request->query('date_from'));
        }
        if ($request->filled('date_to')) {
            $query->where('created_at', '<=', $request->query('date_to'));
        }

        $transactions = $query->orderByDesc('created_at')
            ->paginate($request->get('per_page', 20));

        return $this->paginated($transactions, PaymentTransactionResource::class);
    }

    public function stats(Request $request): JsonResponse
    {
        $this->authorize('view payments');

        $completed = (clone $this->scopedQuery($request))->where('status', 'completed');

        $totalRevenue = (float) (clone $completed)->sum('net_amount');
        $uniqueVoters = (clone $completed)->whereNotNull('elector_id')->distinct('elector_id')->count('elector_id');

        $organization = $this->resolveOrganization($request);
        $activePaidPolls = Election::query()
            ->when($organization, fn ($q) => $q->where('organization_id', $organization->id))
            ->where('payment_type', 'paid')
            ->ongoing()
            ->count();

        return $this->success([
            'total_revenue' => $totalRevenue,
            'average_per_voter' => $uniqueVoters > 0 ? round($totalRevenue / $uniqueVoters, 2) : 0,
            'active_paid_polls' => $activePaidPolls,
        ]);
    }

    private function resolveOrganization(Request $request): ?Organization
    {
        if (! $request->filled('organization_uuid')) {
            return null;
        }

        return Organization::where('uuid', $request->query('organization_uuid'))->first();
    }

    private function scopedQuery(Request $request)
    {
        $organization = $this->resolveOrganization($request);

        return PaymentTransaction::query()
            ->when($organization, fn ($q) => $q->forOrganization($organization->id));
    }
}

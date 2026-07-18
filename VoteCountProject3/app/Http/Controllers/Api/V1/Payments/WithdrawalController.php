<?php

namespace App\Http\Controllers\Api\V1\Payments;

use App\Http\Controllers\Api\V1\BaseApiController;
use App\Http\Requests\Api\V1\Payments\MarkWithdrawalPaidRequest;
use App\Http\Requests\Api\V1\Payments\RejectWithdrawalRequest;
use App\Http\Requests\Api\V1\Payments\StoreWithdrawalRequest;
use App\Http\Resources\Api\V1\WithdrawalRequestResource;
use App\Models\Organization;
use App\Models\WithdrawalRequest;
use App\Services\RevenueService;
use App\Services\WithdrawalService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class WithdrawalController extends BaseApiController
{
    public function __construct(
        protected WithdrawalService $withdrawalService,
        protected RevenueService $revenueService,
    ) {}

    public function balance(Request $request): JsonResponse
    {
        $organization = $this->resolveOrganization($request);

        if (! $organization) {
            return $this->error('organization_uuid est requis', null, 400);
        }

        $this->authorize('viewWithdrawals', $organization);

        return $this->success([
            'total_revenue' => $this->revenueService->totalCompletedRevenue($organization),
            'reserved' => $this->revenueService->totalReserved($organization),
            'available_balance' => $this->revenueService->availableBalance($organization),
            'kyc_status' => $organization->kyc_status->value,
        ]);
    }

    public function index(Request $request): JsonResponse
    {
        $organization = $this->resolveOrganization($request);

        if ($organization) {
            $this->authorize('viewWithdrawals', $organization);
            $query = WithdrawalRequest::forOrganization($organization->id);
        } else {
            // Pas d'organisation précisée = vue globale, réservée au super_admin
            // (même nuance implicite que RevenueController::resolveOrganization()
            // sauf qu'ici elle doit être stricte : cette liste ne doit jamais
            // fuiter entre organisations pour un rôle non super_admin).
            if (! Auth::user()->isSuperAdmin()) {
                return $this->forbidden();
            }
            $query = WithdrawalRequest::query();
        }

        if ($request->filled('status')) {
            $query->where('status', $request->query('status'));
        }

        if ($request->filled('search')) {
            $search = $request->query('search');
            $query->where(function ($q) use ($search) {
                $q->where('phone_number', 'ilike', "%{$search}%")
                    ->orWhereHas('organization', fn ($orgQuery) => $orgQuery->where('name', 'ilike', "%{$search}%"));
            });
        }

        $withdrawals = $query->with(['organization', 'requester', 'reviewer'])
            ->orderByDesc('created_at')
            ->paginate($request->integer('per_page', 15));

        return $this->paginated($withdrawals, WithdrawalRequestResource::class);
    }

    public function store(StoreWithdrawalRequest $request): JsonResponse
    {
        $organization = Organization::where('uuid', $request->organization_uuid)->firstOrFail();

        $withdrawal = $this->withdrawalService->createRequest($organization, Auth::user(), $request->validated());

        return $this->created(new WithdrawalRequestResource($withdrawal), 'Demande de retrait soumise avec succès.');
    }

    public function show(WithdrawalRequest $withdrawal): JsonResponse
    {
        $this->authorize('viewWithdrawals', $withdrawal->organization);

        return $this->success(new WithdrawalRequestResource($withdrawal->load(['organization', 'requester', 'reviewer'])));
    }

    public function approve(WithdrawalRequest $withdrawal): JsonResponse
    {
        $this->authorize('approve withdrawals');

        $withdrawal = $this->withdrawalService->approve($withdrawal, Auth::user());

        return $this->success(new WithdrawalRequestResource($withdrawal), 'Demande de retrait approuvée.');
    }

    public function reject(RejectWithdrawalRequest $request, WithdrawalRequest $withdrawal): JsonResponse
    {
        $withdrawal = $this->withdrawalService->reject($withdrawal, Auth::user(), $request->rejection_reason);

        return $this->success(new WithdrawalRequestResource($withdrawal), 'Demande de retrait rejetée.');
    }

    public function markPaid(MarkWithdrawalPaidRequest $request, WithdrawalRequest $withdrawal): JsonResponse
    {
        $withdrawal = $this->withdrawalService->markPaid(
            $withdrawal,
            Auth::user(),
            $request->payment_reference,
            $request->admin_notes
        );

        return $this->success(new WithdrawalRequestResource($withdrawal), 'Retrait marqué comme payé.');
    }

    public function cancel(WithdrawalRequest $withdrawal): JsonResponse
    {
        $withdrawal = $this->withdrawalService->cancel($withdrawal, Auth::user());

        return $this->success(new WithdrawalRequestResource($withdrawal), 'Demande de retrait annulée.');
    }

    private function resolveOrganization(Request $request): ?Organization
    {
        if (! $request->filled('organization_uuid')) {
            return null;
        }

        return Organization::where('uuid', $request->query('organization_uuid'))->first();
    }
}

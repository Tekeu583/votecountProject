<?php

namespace App\Http\Controllers\Api\V1\SubscriptionPlans;

use App\Http\Controllers\Api\V1\BaseApiController;
use App\Http\Requests\Api\V1\SubscriptionPlans\CreateSubscriptionPlanRequest;
use App\Http\Requests\Api\V1\SubscriptionPlans\UpdateSubscriptionPlanRequest;
use App\Http\Resources\Api\V1\SubscriptionPlanResource;
use App\Models\SubscriptionPlan;
use App\Services\SubscriptionPlanService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class SubscriptionPlanController extends BaseApiController
{
    protected SubscriptionPlanService $planService;

    public function __construct(SubscriptionPlanService $planService)
    {
        $this->planService = $planService;
    }

    /**
     * Liste des plans d'abonnement
     */
    public function index(Request $request): JsonResponse
    {
        $query = SubscriptionPlan::query();

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('is_active')) {
            $query->where('status', 'active');
        }

        $plans = $query->orderBy('price')
            ->paginate($request->get('per_page', 15));

        return $this->paginated($plans, SubscriptionPlanResource::class);
    }

    /**
     * Détails d'un plan
     */
    public function show(SubscriptionPlan $subscriptionPlan): JsonResponse
    {
        return $this->success(new SubscriptionPlanResource($subscriptionPlan));
    }

    /**
     * Créer un plan (admin)
     */
    public function store(CreateSubscriptionPlanRequest $request): JsonResponse
    {
        // Ajouter vérification manuelle si besoin
        if (!Auth::user()->can('manage subscription plans')) {
            return $this->forbidden('Vous n\'avez pas les droits pour créer un plan');
        }
        $plan = $this->planService->create($request->validated());

        return $this->created(new SubscriptionPlanResource($plan), 'Plan créé avec succès');
    }

    /**
     * Mettre à jour un plan (admin)
     */
    public function update(UpdateSubscriptionPlanRequest $request, SubscriptionPlan $subscriptionPlan): JsonResponse
    {
        if (!Auth::user()->can('manage subscription plans')) {
            return $this->forbidden('Vous n\'avez pas les droits pour modifier un plan');
        }
        $plan = $this->planService->update($subscriptionPlan, $request->validated());

        return $this->success(new SubscriptionPlanResource($plan), 'Plan mis à jour');
    }

    /**
     * Désactiver un plan (admin)
     */
    public function destroy(SubscriptionPlan $subscriptionPlan): JsonResponse
    {
        if (!Auth::user()->can('manage subscription plans')) {
            return $this->forbidden('Vous n\'avez pas les droits pour supprimer un plan');
        }
        // Vérifier si des organisations utilisent ce plan
        if ($subscriptionPlan->organizations()->count() > 0) {
            return $this->error('Impossible de supprimer un plan utilisé par des organisations', null, 400);
        }

        $subscriptionPlan->delete();

        return $this->noContent('Plan supprimé');
    }

    /**
     * Activer/désactiver un plan
     */
    public function toggleStatus(SubscriptionPlan $subscriptionPlan): JsonResponse
    {
        if (!Auth::user()->can('manage subscription plans')) {
            return $this->forbidden('Vous n\'avez pas les droits pour modifier un plan');
        }
        $newStatus = $subscriptionPlan->status === 'active' ? 'inactive' : 'active';
        $subscriptionPlan->update(['status' => $newStatus]);

        return $this->success(null, "Plan {$newStatus}");
    }

    /**
     * Plans actifs (public)
     */
    public function getActivePlans(): JsonResponse
    {
        $plans = SubscriptionPlan::where('status', 'active')
            ->orderBy('price')
            ->get();

        return $this->collection($plans, SubscriptionPlanResource::class);
    }
}

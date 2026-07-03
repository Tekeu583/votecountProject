<?php

namespace App\Http\Controllers\Api\V1\Organizations;

use App\Enums\ElectionStatus;
use App\Http\Controllers\Api\V1\BaseApiController;
use App\Http\Requests\Api\V1\Organizations\CreateOrganizationRequest;
use App\Http\Requests\Api\V1\Organizations\UpdateOrganizationRequest;
use App\Http\Resources\Api\V1\CandidateResource;
use App\Http\Resources\Api\V1\OrganizationResource;
use App\Models\Candidate;
use App\Models\Election;
use App\Models\Organization;
use App\Models\User;
use App\Services\OrganizationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class OrganizationController extends BaseApiController
{
    protected OrganizationService $organizationService;

    public function __construct(OrganizationService $organizationService)
    {
        $this->organizationService = $organizationService;
    }

    /**
     * @OA\Get(
     *     path="/api/v1/organizations",
     *     summary="List organizations",
     *     tags={"Organizations"},
     *     security={{"sanctum":{}}},
     *
     *     @OA\Response(
     *         response=200,
     *         description="List of organizations"
     *     )
     * )
     */
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Organization::class);

        $query = Organization::query();

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'ilike', "%{$request->search}%")
                    ->orWhere('email', 'ilike', "%{$request->search}%");
            });
        }

        $organizations = $query->with('owner')
            ->orderBy('created_at', 'desc')
            ->paginate($request->get('per_page', 15));

        return $this->paginated($organizations, OrganizationResource::class);
    }


    public function getCandidates(Organization $organization, Request $request): JsonResponse
    {
        $user = Auth::user();
        $isMember = $organization->users()->where('users.id', $user->id)->exists()
            || $organization->owner_user_id === $user->id;

        if (! $isMember && ! $user->hasRole('super_admin')) {
            return $this->forbidden('Accès non autorisé à cette organisation');
        }

        $query = Candidate::query()
            ->whereHas('election', function ($q) use ($organization) {
                $q->where('organization_id', $organization->id);
            })
            ->with([
                'category',
                'election.organization',
                'election.creator',
            ]);

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('election_uuid')) {
            $query->whereHas('election', function ($q) use ($request) {
                $q->where('uuid', $request->election_uuid);
            });
        }

        if ($request->filled('search')) {
            $query->where('full_name', 'ilike', '%' . $request->search . '%');
        }

        $candidates = $query
            ->orderBy('created_at', 'desc')
            ->paginate($request->integer('per_page', 15));

        $candidates->getCollection()->transform(function ($candidate) {
            $candidate->electionTitle = $candidate->election?->title;
            $candidate->electionUuid  = $candidate->election?->uuid;
            return $candidate;
        });

        return $this->paginated($candidates, CandidateResource::class);
    }
    /**
     * recuperer les organisations de l'utilisateur connecte
     * @OA\Get(
     *     path="/api/v1/organizations/my-organizations",
     *     summary="Get my organizations",
     *     tags={"Organizations"},
     *     security={{"sanctum":{}}},
     *
     *     @OA\Response(
     *         response=200,
     *         description="List of my organizations"
     *     )
     * )
     * @return JsonResponse
     * @throws \Illuminate\Auth\Access\AuthorizationException
     * @throws \Throwable
     */

    public function myOrganizations(): JsonResponse
    {
        try {
            $user = Auth::user();

            // Vérifier si l'utilisateur est connecté
            if (!$user) {
                return $this->unauthorized('Utilisateur non authentifié');
            }

            // Récupérer les organisations avec vérification
            $organizations = $user->organizations()
                ->wherePivot('status', 'active')
                ->with('owner')
                ->get();

            // Vérifier si la collection est vide
            if ($organizations->isEmpty()) {
                return $this->success([], 'Aucune organisation trouvée');
            }

            return $this->success(OrganizationResource::collection($organizations));
        } catch (\Exception $e) {
            // Logguer l'erreur pour déboguer
            Log::error('Error in myOrganizations: ' . $e->getMessage(), [
                'user_id' => Auth::id(),
                'trace' => $e->getTraceAsString()
            ]);

            return $this->error('Erreur lors de la récupération des organisations', null, 500);
        }
    }

    /**
     * @OA\Post(
     *     path="/api/v1/organizations",
     *     summary="Create organization",
     *     tags={"Organizations"},
     *     security={{"sanctum":{}}},
     *
     *     @OA\Response(
     *         response=201,
     *         description="Organization created"
     *     )
     * )
     */
    public function store(CreateOrganizationRequest $request): JsonResponse
    {
        $this->authorize('create', Organization::class);
        $organization = $this->organizationService->create($request->validated(), Auth::user());

        return $this->created(new OrganizationResource($organization), 'Organization created successfully');
    }

    /**
     * @OA\Get(
     *     path="/api/v1/organizations/{organization}",
     *     summary="Get organization details",
     *     tags={"Organizations"},
     *     security={{"sanctum":{}}},
     *
     *     @OA\Response(
     *         response=200,
     *         description="Organization details"
     *     )
     * )
     */
    public function show(Organization $organization): JsonResponse
    {
        $this->authorize('view', $organization);
        $organization->load(['owner', 'subscriptionPlan']);

        return $this->success(new OrganizationResource($organization));
    }

    /**
     * @OA\Put(
     *     path="/api/v1/organizations/{organization}",
     *     summary="Update organization",
     *     tags={"Organizations"},
     *     security={{"sanctum":{}}},
     *
     *     @OA\Response(
     *         response=200,
     *         description="Organization updated"
     *     )
     * )
     */
    public function update(UpdateOrganizationRequest $request, Organization $organization): JsonResponse
    {
        $this->authorize('update', $organization);
        $updatedOrganization = $this->organizationService->update($organization, $request->validated());

        return $this->success(new OrganizationResource($updatedOrganization), 'Organization updated successfully');
    }

    /**
     * @OA\Delete(
     *     path="/api/v1/organizations/{organization}",
     *     summary="Delete organization",
     *     tags={"Organizations"},
     *     security={{"sanctum":{}}},
     *
     *     @OA\Response(
     *         response=204,
     *         description="Organization deleted"
     *     )
     * )
     */
    public function destroy(Organization $organization): JsonResponse
    {
        $this->authorize('delete', $organization);
        $this->organizationService->delete($organization);

        return $this->noContent('Organization deleted successfully');
    }

    /**
     * @OA\Post(
     *     path="/api/v1/organizations/{organization}/users",
     *     summary="Add user to organization",
     *     tags={"Organizations"},
     *     security={{"sanctum":{}}},
     *
     *     @OA\Response(
     *         response=200,
     *         description="User added"
     *     )
     * )
     */
    public function addUser(Request $request, Organization $organization): JsonResponse
    {
        $this->authorize('update', $organization);
        $request->validate([
            'user_id' => 'required|exists:users,uuid',
            'role' => 'required|string|in:owner,admin,member,viewer',
        ]);

        $user = User::where('uuid', $request->user_id)->firstOrFail();
        $this->organizationService->addUser($organization, $user, $request->role);

        return $this->success(null, 'User added to organization successfully');
    }

    /**
     * @OA\Delete(
     *     path="/api/v1/organizations/{organization}/users/{user}",
     *     summary="Remove user from organization",
     *     tags={"Organizations"},
     *     security={{"sanctum":{}}},
     *
     *     @OA\Response(
     *         response=200,
     *         description="User removed"
     *     )
     * )
     */
    public function removeUser(Organization $organization, User $user): JsonResponse
    {
        $this->authorize('update', $organization);
        $this->organizationService->removeUser($organization, $user);

        return $this->success(null, 'User removed from organization successfully');
    }

    public function stats(): JsonResponse
    {
        if (! Auth::user()->isSuperAdmin()) {
            return $this->forbidden('Accès réservé au super administrateur');
        }

        return $this->success([
            'total'                => Organization::count(),
            'active'               => Organization::where('status', 'active')->count(),
            'inactive'             => Organization::where('status', 'inactive')->count(),
            'suspended'            => Organization::where('status', 'suspended')->count(),
            'new_this_month'       => Organization::whereMonth('created_at', now()->month)
                ->whereYear('created_at', now()->year)
                ->count(),
            'with_active_election' => Organization::whereHas(
                'elections',
                fn($q) =>
                $q->where('status', 'ongoing')
            )->count(),
        ], 'Organisation statistics retrieved');
    }
}

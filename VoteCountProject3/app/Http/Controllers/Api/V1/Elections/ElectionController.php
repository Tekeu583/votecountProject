<?php

namespace App\Http\Controllers\Api\V1\Elections;

use App\DTOs\ElectionDTO;
use App\Events\LiveResultsUpdated;
use App\Http\Controllers\Api\V1\BaseApiController;
use App\Http\Requests\Api\V1\Elections\CreateElectionRequest;
use App\Http\Requests\Api\V1\Elections\UpdateElectionRequest;
use App\Http\Resources\Api\V1\CandidateResource;
use App\Http\Resources\Api\V1\ElectionResource;
use App\Models\Category;
use App\Models\Election;
use App\Models\Organization;
use App\Models\User;
use App\Services\ElectionService;
use App\Services\ResultService;
use App\Services\TrashService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ElectionController extends BaseApiController
{
    protected ElectionService $electionService;

    protected ResultService $resultService;

    public function __construct(ElectionService $electionService, ResultService $resultService)
    {
        $this->electionService = $electionService;
        $this->resultService = $resultService;
    }

    /**
     * @OA\Get(
     *     path="/api/v1/elections/public",
     *     summary="List public elections available for candidacy",
     *     tags={"Elections"},
     *     description="Get all published elections that are open for candidacy (public access, no authentication required)",
     *
     *     @OA\Parameter(
     *         name="search",
     *         in="query",
     *         required=false,
     *         description="Search by title or description",
     *         @OA\Schema(type="string")
     *     ),
     *
     *     @OA\Parameter(
     *         name="per_page",
     *         in="query",
     *         required=false,
     *         description="Number of results per page",
     *         @OA\Schema(type="integer", default=15)
     *     ),
     *
     *     @OA\Response(
     *         response=200,
     *         description="List of public elections",
     *
     *         @OA\JsonContent(
     *             type="object",
     *
     *             @OA\Property(property="data", type="array", @OA\Items(ref="#/components/schemas/ElectionResource"))
     *         )
     *     )
     * )
     */
    public function publicIndex(Request $request): JsonResponse
    {
        $elections = $this->electionService->getPublicElections($request);

        return $this->paginated($elections, ElectionResource::class);
    }


    /**
     * Récupérer les détails d'une catégorie pour l'affichage du banner
     */
    public function getCategoryDetails(Election $election, Category $category): JsonResponse
    {
        $category->load(['candidates' => function ($query) use ($election) {
            $query->where('election_id', $election->id)->approved();
        }]);

        return response()->json([
            'category' => [
                'id' => $category->id,
                'uuid' => $category->uuid,
                'name' => $category->name,
                'description' => $category->description,
                'banner' => $category->banner_url,
                'color' => $category->color,
                'icon' => $category->icon,
            ],
            'election' => [
                'id' => $election->id,
                'uuid' => $election->uuid,
                'title' => $election->title,
                'banner' => $election->banner ? asset('storage/' . $election->banner) : null,
            ],
            'candidates' => CandidateResource::collection($category->candidates),
        ]);
    }

    /**
     * Récupérer les détails d'une élection avec ses catégories (chacune avec son banner)
     */
    public function getElectionWithCategories(Election $election): JsonResponse
    {
        $categories = $election->categories()
            ->with(['candidates' => function ($query) use ($election) {
                $query->where('election_id', $election->id)->approved();
            }])
            ->get()
            ->map(function ($category) {
                return [
                    'id' => $category->id,
                    'uuid' => $category->uuid,
                    'name' => $category->name,
                    'slug' => $category->slug,
                    'description' => $category->description,
                    'icon' => $category->icon,
                    'color' => $category->color,
                    'banner' => $category->banner_url,
                    'candidates_count' => $category->candidates->count(),
                    'candidates' => CandidateResource::collection($category->candidates),
                ];
            });

        return response()->json([
            'election' => [
                'id' => $election->id,
                'uuid' => $election->uuid,
                'title' => $election->title,
                'banner' => $election->banner ? asset('storage/' . $election->banner) : null,
            ],
            'categories' => $categories,
        ]);
    }

    /**
     * GET /api/v1/elections/open-for-candidacy
     *
     * Liste les élections dont la phase de candidature est actuellement ouverte.
     * Route dédiée pour la page "Candidater" du frontend.
     *
     * Conditions cumulatives (scopeOpenForCandidacy) :
     *   - accepts_candidates = true
     *   - election_mode IN (public)
     *   - status IN (published)
     *   - candidacy_start_at <= NOW() ou null
     *   - candidacy_end_at >= NOW() ou null
     *   - max_candidates = 0 OU candidates_count < max_candidates
     *
     * @query string  search           - Recherche par titre
     * @query string  organization_id  - Filtre par organisation (uuid)
     * @query integer per_page         - Éléments par page (défaut : 15)
     *
     * @OA\Get(
     *     path="/api/v1/elections/open-for-candidacy",
     *     summary="List elections open for candidacy",
     *     tags={"Elections"},
     *     @OA\Response(response=200, description="Elections accepting candidates")
     * )
     */
    public function openForCandidacy(Request $request): JsonResponse
    {
        $elections = $this->electionService->getOpenForCandidacy($request);

        return $this->paginated($elections, ElectionResource::class);
    }
    // voir une election de type public

    public function publicShow(Election $election): JsonResponse
    {
        // verifier que l'election est de type public sinon on renvoie l'erreur
        if ($election->election_mode !== 'public') {
            return $this->error("L'election n'est pas de type public", null, 400);
        }

        //VÉRIFIER QUE L'ÉLECTION EST A LES STATUTS PERMIS
        $allowedStatuses = ['published', 'ongoing', 'closed', 'completed'];
        if (!in_array($election->status->value, $allowedStatuses)) {
            return $this->error("Cette élection n'est pas encore disponible", null, 403);
        }
        // Choisir le tri selon que le dépouillement a eu lieu
        $candidatesQuery = $election->candidates()
            ->approved()
            ->with('category')
            ->orderByRaw('
            CASE
                WHEN rank IS NOT NULL THEN rank
                ELSE candidate_number
            END ASC
        ');

        $election->setRelation('candidates', $candidatesQuery->get());

        $election->load([
            'organization',
            'organization.subscriptionPlan',
            'organization.owner',
            'creator',
            'settings',
        ]);

        // loadCount conditionnel selon le type d'élection
        $countsToLoad = ['candidates'];

        if ($election->needsElectorList()) {
            $countsToLoad[] = 'electors';
        }

        $election->loadCount($countsToLoad);

        // Scores live pré-calculés au chargement de la page, pour que la barre
        // de résultats/le badge "classement provisoire" (ranked) s'affichent
        // immédiatement sans attendre le prochain vote (seul déclencheur du
        // broadcast WebSocket). Même calcul que celui utilisé pour le flux
        // privé (VoteController::verifyAccessOtp/submitPrivate).
        $data = (new ElectionResource($election))->resolve();
        $data['live_scores'] = $election->real_time_results
            ? LiveResultsUpdated::computeScores($election)
            : null;

        return $this->success($data);
    }

    /**
     * @OA\Get(
     *     path="/api/v1/elections",
     *     summary="List elections",
     *     tags={"Elections"},
     *     security={{"sanctum":{}}},
     *
     *     @OA\Response(
     *         response=200,
     *         description="List of elections",
     *
     *         @OA\JsonContent(
     *             type="object",
     *
     *             @OA\Property(property="data", type="array", @OA\Items(ref="#/components/schemas/ElectionResource"))
     *         )
     *     )
     * )
     */
    public function index(Request $request): JsonResponse
    {
        $elections = $this->electionService->getFilteredElections($request);

        return $this->paginated($elections, ElectionResource::class);
    }

    /**
     * @OA\Post(
     *     path="/api/v1/elections",
     *     summary="Create election",
     *     tags={"Elections"},
     *     security={{"sanctum":{}}},
     *
     *     @OA\RequestBody(
     *         required=true,
     *
     *         @OA\JsonContent(ref="#/components/schemas/CreateElectionRequest")
     *     ),
     *
     *     @OA\Response(
     *         response=201,
     *         description="Election created",
     *
     *         @OA\JsonContent(ref="#/components/schemas/ElectionResource")
     *     )
     * )
     */
    public function store(CreateElectionRequest $request): JsonResponse
    {
        $organization = Organization::where('uuid', $request->organization_id)->firstOrFail();
        // Seuls les membres actifs de l'organisation peuvent créer une élection
        // (le owner est automatiquement dans organization_user avec status=active)
        $isMember = $organization->users()
            ->where('user_id', Auth::id())
            ->wherePivot('status', 'active')
            ->exists();

        if (! $isMember) {
            return $this->error(
                'Vous devez être membre actif de cette organisation pour créer une élection.',
                null,
                403
            );
        }
        $dto = ElectionDTO::fromRequest($request, $this->storeBanner($request));
        $election = $this->electionService->create($organization, Auth::user(), $dto);

        return $this->created(new ElectionResource($election), 'Election created successfully');
    }

    /**
     * @OA\Get(
     *     path="/api/v1/elections/{election}",
     *     summary="Get election details",
     *     tags={"Elections"},
     *     security={{"sanctum":{}}},
     *
     *     @OA\Parameter(
     *         name="election",
     *         in="path",
     *         required=true,
     *
     *         @OA\Schema(type="string")
     *     ),
     *
     *     @OA\Response(
     *         response=200,
     *         description="Election details",
     *
     *         @OA\JsonContent(ref="#/components/schemas/ElectionResource")
     *     )
     * )
     */

    /**
     * POST /api/v1/elections/draft
     *
     * Crée une élection en brouillon depuis Step1 du wizard.
     * Pas de vérification d'abonnement ici — c'est à la publication.
     * Retourne l'UUID du draft pour les étapes suivantes.
     */
    public function storeDraft(CreateElectionRequest $request): JsonResponse
    {
        $organization = Organization::where('uuid', $request->organization_id)->firstOrFail();
        $isMember = $organization->users()
            ->where('user_id', Auth::id())
            ->wherePivot('status', 'active')
            ->exists();

        if (! $isMember) {
            return $this->error(
                'Vous devez être membre actif de cette organisation pour créer une élection.',
                null,
                403
            );
        }

        $dto = ElectionDTO::fromRequest($request, $this->storeBanner($request));

        // Créer sans vérifier l'abonnement — la vérification se fait à la publication
        $election = $this->electionService->createDraft($organization, Auth::user(), $dto);

        return $this->created(new ElectionResource($election), 'Brouillon créé.');
    }

    /**
     * PATCH /api/v1/elections/{election}/draft
     *
     * Met à jour un brouillon existant depuis Step1 (retour en arrière).
     * Seuls les drafts peuvent être modifiés via cet endpoint.
     */
    public function updateDraft(CreateElectionRequest $request, Election $election): JsonResponse
    {
        if (! $election->is_editable) {
            return $this->error('Seuls les brouillons peuvent être modifiés via cet endpoint.', null, 422);
        }

        if ($election->status->value !== 'draft') {
            return $this->error('Seuls les brouillons peuvent être modifiés via cet endpoint.', null, 422);
        }

        $this->authorize('update', $election);

        // Supprimer l'ancien banner si un nouveau est fourni
        if ($request->hasFile('banner') && $election->banner) {
            Storage::disk('public')->delete($election->banner);
        }

        $dto = ElectionDTO::fromRequest($request, $this->storeBanner($request));
        $updated = $this->electionService->updateDraft($election, $dto);

        return $this->success(new ElectionResource($updated), 'Brouillon mis à jour.');
    }

    public function show(Election $election): JsonResponse
    {
        // Choisir le tri selon que le dépouillement a eu lieu
        $candidatesQuery = $election->candidates()
            ->approved()
            ->with('category')
            ->orderByRaw('
            CASE
                WHEN rank IS NOT NULL THEN rank
                ELSE candidate_number
            END ASC
        ');

        $election->setRelation('candidates', $candidatesQuery->get());

        $election->load([
            'organization',
            'organization.subscriptionPlan',
            'organization.owner',
            'creator',
            'settings',
        ]);

        // loadCount conditionnel selon le type d'élection
        $countsToLoad = ['candidates'];

        if ($election->needsElectorList()) {
            $countsToLoad[] = 'electors';
        }

        $election->loadCount($countsToLoad);

        return $this->success(new ElectionResource($election));
    }
    /**
     * @OA\Put(
     *     path="/api/v1/elections/{election}",
     *     summary="Update election",
     *     tags={"Elections"},
     *     security={{"sanctum":{}}},
     *
     *     @OA\Parameter(
     *         name="election",
     *         in="path",
     *         required=true,
     *
     *         @OA\Schema(type="string")
     *     ),
     *
     *     @OA\RequestBody(
     *         required=true,
     *
     *         @OA\JsonContent(ref="#/components/schemas/UpdateElectionRequest")
     *     ),
     *
     *     @OA\Response(
     *         response=200,
     *         description="Election updated",
     *
     *         @OA\JsonContent(ref="#/components/schemas/ElectionResource")
     *     )
     * )
     */
    public function update(UpdateElectionRequest $request, Election $election): JsonResponse
    {
        $this->authorize('update', $election);

        // Supprimer l'ancien banner si un nouveau est fourni
        if ($request->hasFile('banner') && $election->banner) {
            Storage::disk('public')->delete($election->banner);
        }

        $dto = ElectionDTO::fromRequest($request, $this->storeBanner($request));
        $updatedElection = $this->electionService->update($election, $dto);

        return $this->success(new ElectionResource($updatedElection), 'Election updated successfully');
    }

    private function storeBanner(Request $request): ?string
    {
        if (! $request->hasFile('banner')) {
            return null;
        }

        $file     = $request->file('banner');
        $filename = Str::uuid() . '.' . $file->getClientOriginalExtension();

        return $file->storeAs('elections/banners', $filename, 'public');
    }
    /**
     * @OA\Delete(
     *     path="/api/v1/elections/{election}",
     *     summary="Delete election",
     *     tags={"Elections"},
     *     security={{"sanctum":{}}},
     *
     *     @OA\Parameter(
     *         name="election",
     *         in="path",
     *         required=true,
     *
     *         @OA\Schema(type="string")
     *     ),
     *
     *     @OA\Response(
     *         response=204,
     *         description="Election deleted"
     *     )
     * )
     */
    public function destroy(Election $election): JsonResponse
    {
        $this->authorize('delete', $election);

        if ($election->total_votes > 0) {
            return $this->error('Impossible de supprimer une élection ayant déjà reçu des votes.', null, 422);
        }

        TrashService::snapshot($election, $election->organization_id);
        $election->delete();

        return $this->noContent('Election deleted successfully');
    }

    /**
     * @OA\Post(
     *     path="/api/v1/elections/{election}/publish",
     *     summary="Publish election",
     *     tags={"Elections"},
     *     security={{"sanctum":{}}},
     *
     *     @OA\Response(
     *         response=200,
     *         description="Election published"
     *     )
     * )
     */
    public function publish(Election $election): JsonResponse
    {
        $this->authorize('publish elections', $election);

        $this->electionService->publish($election);

        return $this->success(null, 'Election published successfully');
    }

    /**
     * @OA\Post(
     *     path="/api/v1/elections/{election}/start",
     *     summary="Start election",
     *     tags={"Elections"},
     *     security={{"sanctum":{}}},
     *
     *     @OA\Response(
     *         response=200,
     *         description="Election started"
     *     )
     * )
     */
    public function start(Election $election): JsonResponse
    {
        $this->authorize('update', $election);

        $this->electionService->start($election);

        return $this->success(null, 'Election started successfully');
    }

    /**
     * @OA\Post(
     *     path="/api/v1/elections/{election}/end",
     *     summary="End election",
     *     tags={"Elections"},
     *     security={{"sanctum":{}}},
     *
     *     @OA\Response(
     *         response=200,
     *         description="Election ended"
     *     )
     * )
     */
    public function end(Election $election): JsonResponse
    {
        $this->authorize('update', $election);

        $this->electionService->end($election);

        return $this->success(null, 'Election ended successfully');
    }

    /**
     * @OA\Get(
     *     path="/api/v1/elections/{election}/statistics",
     *     summary="Get election statistics",
     *     tags={"Elections"},
     *     security={{"sanctum":{}}},
     *
     *     @OA\Response(
     *         response=200,
     *         description="Election statistics"
     *     )
     * )
     */
    public function statistics(Election $election): JsonResponse
    {
        $stats = $this->electionService->getStatistics($election);

        return $this->success($stats);
    }
    public function stats(): JsonResponse
    {
        if (! Auth::user()->isSuperAdmin()) {
            return $this->forbidden('Accès réservé au super administrateur');
        }

        $stats = $this->electionService->getGlobalStats();

        return $this->success($stats, 'Election statistics retrieved');
    }

    /**
     * @OA\Post(
     *     path="/api/v1/elections/{election}/managers",
     *     summary="Add election manager",
     *     tags={"Elections"},
     *     security={{"sanctum":{}}},
     *
     *     @OA\RequestBody(
     *         required=true,
     *
     *         @OA\JsonContent(
     *             required={"user_id", "role"},
     *
     *             @OA\Property(property="user_id", type="string"),
     *             @OA\Property(property="role", type="string", enum={"manager", "observer", "jury"})
     *         )
     *     ),
     *
     *     @OA\Response(
     *         response=200,
     *         description="Manager added"
     *     )
     * )
     */
    public function addManager(Request $request, Election $election): JsonResponse
    {
        $this->authorize('update', $election);

        $request->validate([
            'user_id' => 'required|exists:users,uuid',
            'role' => 'required|in:manager,observer,jury',
        ]);

        $user = User::where('uuid', $request->user_id)->firstOrFail();
        $this->electionService->addManager($election, $user, $request->role);

        return $this->success(null, 'Manager added successfully');
    }

    /**
     * @OA\Delete(
     *     path="/api/v1/elections/{election}/managers/{user}",
     *     summary="Remove election manager",
     *     tags={"Elections"},
     *     security={{"sanctum":{}}},
     *
     *     @OA\Parameter(
     *         name="user",
     *         in="path",
     *         required=true,
     *
     *         @OA\Schema(type="string")
     *     ),
     *
     *     @OA\Response(
     *         response=200,
     *         description="Manager removed"
     *     )
     * )
     */
    public function removeManager(Election $election, User $user): JsonResponse
    {
        $this->authorize('update', $election);

        $this->electionService->removeManager($election, $user);

        return $this->success(null, 'Manager removed successfully');
    }
}

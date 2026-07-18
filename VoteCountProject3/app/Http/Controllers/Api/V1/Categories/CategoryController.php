<?php

namespace App\Http\Controllers\Api\V1\Categories;

use App\Http\Controllers\Api\V1\BaseApiController;
use App\Http\Resources\Api\V1\CandidateResource;
use App\Http\Resources\Api\V1\CategoryResource;
use App\Models\Category;
use App\Models\Organization;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Une catégorie appartient toujours à une élection précise (election_id
 * obligatoire) — la création/modification/suppression se fait donc via
 * ElectionCategoryController (routes elections/{election}/categories),
 * jamais hors contexte d'élection. Ce contrôleur ne reste que pour la
 * vue d'ensemble en lecture seule (dashboard admin_org/super_admin) et
 * les routes publiques.
 */
class CategoryController extends BaseApiController
{
    /**
     * Liste des catégories d'une organisation (toutes ses élections
     * confondues), avec l'élection liée à chacune.
     */
    public function index(Request $request): JsonResponse
    {
        if (! $request->filled('organization_uuid')) {
            return $this->error('organization_uuid est requis', null, 400);
        }

        $organization = Organization::where('uuid', $request->query('organization_uuid'))->first();

        if (! $organization) {
            return $this->error('Organisation introuvable', null, 404);
        }

        $this->authorize('view', $organization);

        $query = Category::whereHas('election', fn ($q) => $q->where('organization_id', $organization->id));

        if ($request->filled('status')) {
            $query->where('status', $request->query('status'));
        }

        if ($request->filled('search')) {
            $search = $request->query('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'ilike', "%{$search}%")
                    ->orWhere('slug', 'ilike', "%{$search}%");
            });
        }

        $categories = $query->withCount('candidates')
            ->with('election:id,uuid,title')
            ->orderBy('name')
            ->paginate($request->integer('per_page', 15));

        return $this->paginated($categories, CategoryResource::class);
    }

    /**
     * Liste des catégories actives (publique)
     */
    public function getActiveCategories(): JsonResponse
    {
        $categories = Category::where('status', 'active')
            ->withCount('candidates')
            ->orderBy('name')
            ->get();

        return $this->collection($categories, CategoryResource::class);
    }

    /**
     * Obtenir les candidats d'une catégorie
     */
    public function getCandidates(Category $category): JsonResponse
    {
        $candidates = $category->candidates()
            ->where('status', 'approved')
            ->with('election')
            ->paginate(15);

        return $this->paginated($candidates, CandidateResource::class);
    }
}

<?php

namespace App\Http\Controllers\Api\V1\Categories;

use App\Http\Controllers\Api\V1\BaseApiController;
use App\Http\Requests\Api\V1\Categories\CreateCategoryRequest;
use App\Http\Requests\Api\V1\Categories\UpdateCategoryRequest;
use App\Http\Resources\Api\V1\CandidateResource;
use App\Http\Resources\Api\V1\CategoryResource;
use App\Models\Category;
use App\Services\CategoryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CategoryController extends BaseApiController
{
    protected CategoryService $categoryService;

    public function __construct(CategoryService $categoryService)
    {
        $this->categoryService = $categoryService;
    }

    /**
     * Liste des catégories
     */
    public function index(Request $request): JsonResponse
    {
        $query = Category::query();

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'ilike', "%{$request->search}%")
                    ->orWhere('slug', 'ilike', "%{$request->search}%");
            });
        }

        $categories = $query->withCount('candidates')
            ->orderBy('name')
            ->paginate($request->get('per_page', 15));

        return $this->paginated($categories, CategoryResource::class);
    }

    /**
     * Créer une catégorie
     */
    public function store(CreateCategoryRequest $request): JsonResponse
    {
        $data = $request->validated();

        if ($request->hasFile('banner')) {
            $data['banner'] = $this->categoryService->storeBanner($request->file('banner'));
        }

        $category = $this->categoryService->create($data);

        return $this->created(new CategoryResource($category), 'Catégorie créée avec succès');
    }

    /**
     * Détails d'une catégorie
     */
    public function show(Category $category): JsonResponse
    {
        $category->load('candidates');

        return $this->success(new CategoryResource($category));
    }

    /**
     * Mettre à jour une catégorie
     */
    public function update(UpdateCategoryRequest $request, Category $category): JsonResponse
    {
        $data = $request->validated();

        if ($request->hasFile('banner')) {
            $data['banner'] = $this->categoryService->storeBanner($request->file('banner'));
        }

        $updatedCategory = $this->categoryService->update($category, $data);

        return $this->success(new CategoryResource($updatedCategory), 'Catégorie mise à jour');
    }

    /**
     * Supprimer une catégorie
     */
    public function destroy(Category $category): JsonResponse
    {
        $this->categoryService->delete($category);

        return $this->noContent('Catégorie supprimée');
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

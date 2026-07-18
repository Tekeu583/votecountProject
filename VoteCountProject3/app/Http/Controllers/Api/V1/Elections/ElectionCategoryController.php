<?php

namespace App\Http\Controllers\Api\V1\Elections;

use App\Http\Controllers\Api\V1\BaseApiController;
use App\Http\Resources\Api\V1\CategoryResource;
use App\Models\Category;
use App\Models\Election;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use App\Http\Requests\Api\V1\Categories\CreateCategoryRequest;
use App\Http\Requests\Api\V1\Categories\UpdateCategoryRequest;

/**
 * Gestion des catégories spécifiques à une élection.
 *
 * Ces catégories ont election_id non null — elles n'existent
 * que dans le contexte de cette élection.
 *
 * Routes :
 *   GET    /elections/{election}/categories         → lister
 *   POST   /elections/{election}/categories         → créer
 *   PUT    /elections/{election}/categories/{cat}  → renommer/modifier
 *   DELETE /elections/{election}/categories/{cat}  → supprimer
 */
class ElectionCategoryController extends BaseApiController
{
    /**
     * GET /elections/{election}/categories
     * Retourne les catégories de cette élection
     * Utilisé par Step2 pour peupler le sélecteur de catégorie.
     */
    public function index(Election $election): JsonResponse
    {
        $categories = Category::availableFor($election->id)
            ->orderBy('name')
            ->get();

        return $this->success(CategoryResource::collection($categories));
    }

    /**
     * POST /elections/{election}/categories
     * Crée une catégorie liée à cette élection.
     *
     * Body: { name: string, description?: string, color?: string, icon?: string }
     */
    public function store(CreateCategoryRequest $request, Election $election): JsonResponse
    {
        $this->authorize('create', $election);

        // Vérifier que l'élection a has_categories activé
        if (! $election->has_categories) {
            return $this->error(
                'Les catégories ne sont pas activées pour cette élection.',
                null,
                422
            );
        }
        // Slug unique dans le contexte de cette élection
        $slug = Str::slug($request->name);
        $base = $slug;
        $i    = 1;
        while (Category::where('election_id', $election->id)->where('slug', $slug)->exists()) {
            $slug = $base . '-' . $i++;
        }

        $banner = $this->storeBanner($request);

        $category = Category::create([
            'uuid'        => Str::uuid()->toString(),
            'election_id' => $election->id,
            'name'        => $request->name,
            'slug'        => $slug,
            'description' => $request->description,
            'banner' => $banner,
            'color'       => $request->color,
            'icon'        => $request->icon,
            'status'      => 'active',
        ]);

        return $this->created(new CategoryResource($category), 'Catégorie créée.');
    }

    /**
     * PUT /elections/{election}/categories/{category}
     * Modifie une catégorie de l'élection (nom, description, couleur...).
     */
    public function update(UpdateCategoryRequest $request, Election $election, Category $category): JsonResponse
    {
        $this->authorize('update', $election);

        if ($category->election_id !== $election->id) {
            return $this->error('Cette catégorie n\'appartient pas à cette élection.', null, 403);
        }

        $data = $request->validated();

        if ($request->hasFile('banner')) {
            $data['banner'] = $this->storeBanner($request);
        }

        $category->update($data);

        return $this->success(new CategoryResource($category), 'Catégorie mise à jour.');
    }

    /**
     * DELETE /elections/{election}/categories/{category}
     * Supprime une catégorie de l'élection.
     * Les candidats assignés à cette catégorie auront category_id mis à null.
     */
    public function destroy(Election $election, Category $category): JsonResponse
    {
        $this->authorize('update', $election);

        if ($category->election_id !== $election->id) {
            return $this->error('Cette catégorie n\'appartient pas à cette élection.', null, 403);
        }

        // Désassigner les candidats de cette catégorie
        $election->candidates()
            ->where('category_id', $category->id)
            ->update(['category_id' => null]);

        $category->delete();

        return $this->success(null, 'Catégorie supprimée. Les candidats ont été désassignés.');
    }

    private function storeBanner(Request $request): ?string
    {
        if (! $request->hasFile('banner')) {
            return null;
        }

        $file     = $request->file('banner');
        $filename = Str::uuid() . '.' . $file->getClientOriginalExtension();

        return $file->storeAs('categories/banners', $filename, 'public');
    }
}

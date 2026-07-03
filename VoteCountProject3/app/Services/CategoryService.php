<?php

namespace App\Services;

use App\Models\Category;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class CategoryService
{
    public function create(array $data): Category
    {
        $slug = Str::slug($data['name']);
        $originalSlug = $slug;
        $counter = 1;

        while (Category::where('slug', $slug)->exists()) {
            $slug = $originalSlug . '-' . $counter++;
        }

        return Category::create([
            'uuid' => Str::uuid()->toString(),
            'name' => $data['name'],
            'slug' => $slug,
            'banner' => $data['banner'],
            'description' => $data['description'] ?? null,
            'icon' => $data['icon'] ?? null,
            'color' => $data['color'] ?? '#3B82F6',
            'status' => $data['status'] ?? 'active',
        ]);
    }

    public function update(Category $category, array $data): Category
    {
        if (isset($data['name']) && $data['name'] !== $category->name) {
            $slug = Str::slug($data['name']);
            $originalSlug = $slug;
            $counter = 1;

            while (Category::where('slug', $slug)->where('id', '!=', $category->id)->exists()) {
                $slug = $originalSlug . '-' . $counter++;
            }

            $data['slug'] = $slug;
        }

        $category->update($data);

        return $category->fresh();
    }
    /**
     * Stocke le banner et retourne son chemin relatif.
     */
    public function storeBanner(UploadedFile $file): string
    {
        $filename = Str::uuid() . '.' . $file->getClientOriginalExtension();
        return $file->storeAs('categories/banners', $filename, 'public');
    }
    public function delete(Category $category): void
    {
        // Vérifier si des candidats sont associés
        if ($category->candidates()->exists()) {
            throw new \Exception('Impossible de supprimer une catégorie qui contient des candidats');
        }
        // Supprimer le banner avant de supprimer la catégorie
        if ($category->banner) {
            Storage::disk('public')->delete($category->banner);
        }

        $category->delete();
        $category->delete();
    }
}

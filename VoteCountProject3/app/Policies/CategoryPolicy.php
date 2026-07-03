<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Category;

class CategoryPolicy
{
    public function before(User $user, string $ability): ?bool
    {
        if ($user->isSuperAdmin()) {
            return true;
        }
        return null;
    }

    public function viewAny(User $user): bool
    {
        return true; // Tout le monde peut voir les catégories
    }

    public function view(User $user, Category $category): bool
    {
        return true; // Tout le monde peut voir une catégorie
    }

    public function create(User $user): bool
    {
        return $user->can('manage categories');
    }

    public function update(User $user, Category $category): bool
    {
        return $user->can('manage categories');
    }

    public function delete(User $user, Category $category): bool
    {
        return $user->can('manage categories');
    }
}

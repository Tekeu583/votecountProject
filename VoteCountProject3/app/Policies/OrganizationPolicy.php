<?php

namespace App\Policies;

use App\Models\Organization;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class OrganizationPolicy
{
    use HandlesAuthorization;

    public function before(User $user, string $ability): ?bool
    {
        if ($user->isSuperAdmin()) {
            return true;
        }

        return null;
    }

    /**
     * AJOUT : viewAny — lister toutes les organisations.
     * Requis par OrganizationController::index() via $this->authorize('viewAny').
     * Seuls les utilisateurs avec la permission 'view organizations' peuvent lister.
     * (super_admin passe par before() directement)
     */
    public function viewAny(User $user): bool
    {
        return $user->can('view organizations');
    }

    public function view(User $user, Organization $organization): bool
    {
        return $user->canAccessOrganization($organization);
    }

    public function create(User $user): bool
    {
        logger()->info('CREATE ORGANIZATION', [
            'user_id' => $user->id,
            'roles' => $user->getRoleNames()->toArray(),
            'permissions' => $user->getAllPermissions()->pluck('name')->toArray(),
        ]);
        return $user->can('create organizations');
    }

    public function update(User $user, Organization $organization): bool
    {
        return $organization->owner_user_id === $user->id
            || $user->can('edit organizations');
    }

    public function delete(User $user, Organization $organization): bool
    {
        return $organization->owner_user_id === $user->id
            || $user->can('delete organizations');
    }

    public function manageUsers(User $user, Organization $organization): bool
    {
        return $organization->owner_user_id === $user->id
            || $user->can('manage users');
    }

    public function viewPayments(User $user, Organization $organization): bool
    {
        return $this->view($user, $organization) && $user->can('view payments');
    }
}

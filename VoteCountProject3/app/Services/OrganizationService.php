<?php

namespace App\Services;

use App\Exceptions\OrganizationException;
use App\Models\Organization;
use App\Models\Subscription;
use App\Models\SubscriptionPlan;
use App\Models\User;
use App\Repositories\Contracts\OrganizationRepositoryInterface;
use App\Services\RoleService;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class OrganizationService
{
    protected OrganizationRepositoryInterface $organizationRepository;

    public function __construct(OrganizationRepositoryInterface $organizationRepository)
    {
        $this->organizationRepository = $organizationRepository;
    }

    public function create(array $data, User $owner): Organization
    {
        // Generate unique slug
        $slug = Str::slug($data['name']);
        $originalSlug = $slug;
        $counter = 1;

        while ($this->organizationRepository->findBySlug($slug)) {
            $slug = $originalSlug . '-' . $counter++;
        }

        $organization = $this->organizationRepository->create([
            'name' => $data['name'],
            'slug' => $slug,
            'logo' => $data['logo'] ?? null,
            'banner' => $data['banner'] ?? null,
            'description' => $data['description'] ?? null,
            'email' => $data['email'] ?? null,
            'phone' => $data['phone'] ?? null,
            'website' => $data['website'] ?? null,
            'country' => $data['country'] ?? null,
            'city' => $data['city'] ?? null,
            'address' => $data['address'] ?? null,
            'owner_user_id' => $owner->id,
            'created_by' => $owner->id,
        ]);

        // Assign owner to organization
        $organization->users()->attach($owner->id, [
            'role_slug' => 'owner',
            'joined_at' => now(),
            'status' => 'active',
        ]);

        // Assign organization_owner role to owner if not already super_admin
        if (! $owner->hasRole('super_admin')) {
            RoleService::assignRoleToUser($owner, 'organization_owner');
        }

        // Attribution automatique du plan gratuit
        // Toute nouvelle organisation reçoit le plan "free" (30 jours, 1 élection)
        // ce qui lui permet de créer et lancer sa première élection sans paiement.
        $freePlan = SubscriptionPlan::where('slug', 'free')
            ->where('status', 'active')
            ->first();

        if ($freePlan) {
            Subscription::create([
                'organization_id'      => $organization->id,
                'subscription_plan_id' => $freePlan->id,
                'start_at'             => now(),
                'end_at'               => now()->addDays($freePlan->duration_days),
                'status'               => 'active',
                'auto_renew'           => false,
            ]);
        } else {
            Log::warning('[OrganizationService] Plan gratuit introuvable — aucun abonnement attribué.', [
                'organization_id' => $organization->id,
            ]);
        }

        return $organization;
    }

    public function update(Organization $organization, array $data): Organization
    {
        // Update slug if name changed
        if (isset($data['name']) && $data['name'] !== $organization->name) {
            $slug = Str::slug($data['name']);
            $originalSlug = $slug;
            $counter = 1;

            while ($this->organizationRepository->findBySlug($slug) && $slug !== $organization->slug) {
                $slug = $originalSlug . '-' . $counter++;
            }

            $data['slug'] = $slug;
        }

        return $this->organizationRepository->update($organization->id, $data);
    }

    public function addUser(Organization $organization, User $user, string $role): void
    {
        if ($organization->users()->where('user_id', $user->id)->exists()) {
            throw OrganizationException::userAlreadyInOrganization();
        }

        $organization->users()->attach($user->id, [
            'role_slug' => $role,
            'joined_at' => now(),
            'status' => 'active',
        ]);

        if (! $user->hasRole('organization_owner') && ! $user->hasRole('super_admin')) {
            RoleService::assignRoleToUser($user, 'organization_user');
        }
    }

    public function removeUser(Organization $organization, User $user): void
    {
        if ($organization->owner_user_id === $user->id) {
            throw OrganizationException::cannotRemoveOwner();
        }

        $organization->users()->detach($user->id);
    }

    public function changeRole(Organization $organization, User $user, string $newRole): void
    {
        if ($organization->owner_user_id === $user->id) {
            throw OrganizationException::cannotChangeOwnerRole();
        }

        $organization->users()->updateExistingPivot($user->id, [
            'role_slug' => $newRole,
        ]);
    }

    public function delete(Organization $organization): void
    {
        if ($organization->elections()->whereNotIn('status', ['archived', 'cancelled'])->exists()) {
            throw OrganizationException::hasActiveElections();
        }

        $organization->delete();
    }
}

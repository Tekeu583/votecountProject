<?php

namespace App\Policies;

use App\Models\Election;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class ElectionPolicy
{
    use HandlesAuthorization;

    public function before(User $user, string $ability): ?bool
    {
        if ($user->isSuperAdmin()) {
            return true;
        }

        return null;
    }

    public function viewAny(User $user): bool
    {
        return $user->can('view elections');
    }
    public function view(User $user, Election $election): bool
    {
        return $user->canAccessElection($election);
    }

    public function create(User $user): bool
    {
        return $user->can('create elections');
    }

    public function update(User $user, Election $election): bool
    {
        // Uniquement le créateur, le propriétaire de l'organisation, ou un
        // membre du staff de CETTE élection précise (pivot election_user).
        // Pas de repli sur une permission Spatie globale ('edit elections') :
        // organization_owner la possède pour toutes les organisations, ce
        // qui autorisait n'importe quel propriétaire à modifier les
        // élections d'organisations tierces.
        if ($user->id === $election->created_by) {
            return true;
        }

        $organization = $election->organization;
        if ($organization && $organization->owner_user_id === $user->id) {
            return true;
        }

        // Check election_user role
        $pivot = $user->elections()->where('election_id', $election->id)->first()?->pivot;
        if ($pivot && in_array($pivot->role_slug, ['creator', 'admin', 'manager'])) {
            return true;
        }

        return false;
    }

    public function delete(User $user, Election $election): bool
    {
        // Même raison que update() : pas de repli sur permission globale.
        if ($user->id === $election->created_by) {
            return true;
        }

        $organization = $election->organization;
        if ($organization && $organization->owner_user_id === $user->id) {
            return true;
        }

        return false;
    }

    public function publish(User $user, Election $election): bool
    {
        return $this->update($user, $election) && $election->is_editable;
    }

    /**
     * Créateur de l'élection ou propriétaire de l'organisation — aucune
     * ligne election_user n'est jamais créée automatiquement pour eux
     * (ElectionService::create() ne les attache pas), donc sans ce
     * raccourci ils échouent silencieusement toute ability qui ne vérifie
     * que le pivot/une permission Spatie, alors même que update()/delete()
     * les autorisent déjà via ce même raccourci.
     */
    private function isCreatorOrOwner(User $user, Election $election): bool
    {
        if ($user->id === $election->created_by) {
            return true;
        }

        $organization = $election->organization;

        return $organization && $organization->owner_user_id === $user->id;
    }

    public function manageCandidates(User $user, Election $election): bool
    {
        if ($this->isCreatorOrOwner($user, $election)) {
            return true;
        }

        $pivot = $user->elections()->where('election_id', $election->id)->first()?->pivot;

        // Pas de repli sur permission globale : voir commentaire sur update().
        return $pivot && in_array($pivot->role_slug, ['creator', 'admin', 'manager']);
    }

    public function manageElectors(User $user, Election $election): bool
    {
        if ($this->isCreatorOrOwner($user, $election)) {
            return true;
        }

        $pivot = $user->elections()->where('election_id', $election->id)->first()?->pivot;

        return $pivot && in_array($pivot->role_slug, ['creator', 'admin', 'manager']);
    }

    public function scoreCandidates(User $user, Election $election): bool
    {
        if ($this->isCreatorOrOwner($user, $election)) {
            return true;
        }

        $pivot = $user->elections()->where('election_id', $election->id)->first()?->pivot;

        return $pivot && in_array($pivot->role_slug, ['creator', 'admin', 'manager', 'jury']);
    }

    public function viewResults(?User $user, Election $election): bool
    {
        if ($election->public_results) {
            return true;
        }

        return $user ? $this->view($user, $election) : false;
    }

    public function vote(User $user, ?Election $election): bool
    {
        if (! $election) {
            return false;
        }

        // Guest voting
        if (! $user && $election->allow_guest_vote) {
            return true;
        }

        // Authenticated user
        if ($user && $election->is_votable) {
            // Check if user is blocked from this election
            $pivot = $user->elections()->where('election_id', $election->id)->first()?->pivot;
            if ($pivot && $pivot->status === 'blocked') {
                return false;
            }

            return true;
        }

        return false;
    }
}

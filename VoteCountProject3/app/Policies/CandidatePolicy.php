<?php

namespace App\Policies;

use App\Models\Candidate;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

/**
 *
 * CandidateController appelle $this->authorize('update'|'delete'|'approve'|'reject', $candidate)
 * à plusieurs endroits. Depuis Laravel 11+, les policies sont auto-découvertes
 * par convention (App\Models\Candidate → App\Policies\CandidatePolicy). En
 * l'absence de ce fichier, Laravel ne trouve aucune règle et refuse TOUJOURS
 * l'action par défaut → "This action is unauthorized." pour update, delete,
 * approve et reject, quel que soit l'utilisateur connecté.
 *
 * Toute la logique déléguée à ElectionPolicy::manageCandidates() sur
 * l'élection parente — cette méthode existait déjà et gérait exactement ce
 * cas (créateur, propriétaire d'organisation, rôle election_user, ou
 * permission Spatie 'manage candidates'), mais n'était jamais appelée.
 */
class CandidatePolicy
{
    use HandlesAuthorization;

    public function before(User $user, string $ability): ?bool
    {
        if ($user->isSuperAdmin()) {
            return true;
        }

        return null;
    }

    public function view(User $user, Candidate $candidate): bool
    {
        return $user->can('view', $candidate->election);
    }

    public function update(User $user, Candidate $candidate): bool
    {
        return $user->can('manageCandidates', $candidate->election);
    }

    public function delete(User $user, Candidate $candidate): bool
    {
        return $user->can('manageCandidates', $candidate->election);
    }

    public function approve(User $user, Candidate $candidate): bool
    {
        return $user->can('manageCandidates', $candidate->election);
    }

    public function reject(User $user, Candidate $candidate): bool
    {
        return $user->can('manageCandidates', $candidate->election);
    }
}

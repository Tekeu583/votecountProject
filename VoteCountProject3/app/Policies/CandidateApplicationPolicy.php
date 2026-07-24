<?php

namespace App\Policies;

use App\Models\User;
use App\Models\CandidateApplication;
use Illuminate\Auth\Access\HandlesAuthorization;

class CandidateApplicationPolicy
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
        return $user->can('view candidate applications');
    }

    public function view(User $user, CandidateApplication $application): bool
    {
        $election = $application->election;
        return $user->canAccessElection($election);
    }

    public function approve(User $user, CandidateApplication $application): bool
    {
        // Réutilise ElectionPolicy::manageCandidates (créateur / propriétaire
        // d'organisation / rôle pivot manager). L'ancienne version dépendait
        // de la permission 'manage candidates' qui n'existe pas dans le
        // seeder → seul le super_admin pouvait approuver (bug bloquant).
        return $user->can('manageCandidates', $application->election);
    }

    public function reject(User $user, CandidateApplication $application): bool
    {
        return $user->can('manageCandidates', $application->election);
    }
}
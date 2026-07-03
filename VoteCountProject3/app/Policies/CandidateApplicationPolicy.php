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
        $election = $application->election;
        return $user->canAccessElection($election) && $user->can('manage candidates');
    }

    public function reject(User $user, CandidateApplication $application): bool
    {
        $election = $application->election;
        return $user->canAccessElection($election) && $user->can('manage candidates');
    }
}
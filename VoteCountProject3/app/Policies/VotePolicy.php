<?php

namespace App\Policies;

use App\Models\Election;
use App\Models\User;
use App\Models\Vote;
use Illuminate\Auth\Access\HandlesAuthorization;

class VotePolicy
{
    use HandlesAuthorization;

    public function before(User $user, string $ability): ?bool
    {
        if ($user->isSuperAdmin()) {
            return true;
        }

        return null;
    }

    public function view(User $user, Vote $vote): bool
    {
        // User can view their own votes
        if ($user->id === $vote->elector->user_id) {
            return true;
        }

        // Election managers can view votes
        $election = $vote->election;
        $pivot = $user->elections()->where('election_id', $election->id)->first()?->pivot;

        if ($pivot && in_array($pivot->role_slug, ['creator', 'admin', 'manager', 'observer'])) {
            return true;
        }

        return $user->can('view votes');
    }

    public function audit(User $user, Election $election): bool
    {
        $pivot = $user->elections()->where('election_id', $election->id)->first()?->pivot;

        if ($pivot && in_array($pivot->role_slug, ['creator', 'admin', 'observer'])) {
            return true;
        }

        return $user->can('audit votes');
    }

    public function invalidate(User $user, Vote $vote): bool
    {
        $election = $vote->election;
        $pivot = $user->elections()->where('election_id', $election->id)->first()?->pivot;

        if ($pivot && $pivot->role_slug === 'admin') {
            return true;
        }

        return $user->can('invalid votes');
    }
}

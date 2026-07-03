<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class RoleContextMiddleware
{
    public function handle(Request $request, Closure $next)
    {
        if (Auth::check()) {
            $user = Auth::user();

            // Check organization context
            $organization = $request->get('current_organization');
            if ($organization) {
                $pivot = $user->organizations()
                    ->where('organization_id', $organization->id)
                    ->first()?->pivot;

                if ($pivot) {
                    $user->setAttribute('current_organization_role', $pivot->role_slug);
                    $user->setAttribute('current_organization_permissions', $pivot->permissions);
                }
            }

            // Check election context
            $election = $request->get('current_election');
            if ($election) {
                $pivot = $user->elections()
                    ->where('election_id', $election->id)
                    ->first()?->pivot;

                if ($pivot) {
                    $user->setAttribute('current_election_role', $pivot->role_slug);
                    $user->setAttribute('current_election_permissions', $pivot->permissions);
                }
            }
        }

        return $next($request);
    }
}

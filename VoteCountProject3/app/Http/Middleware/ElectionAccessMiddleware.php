<?php

namespace App\Http\Middleware;

use App\Exceptions\ElectionException;
use App\Models\Election;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ElectionAccessMiddleware
{
    public function handle(Request $request, Closure $next)
    {
        $electionUuid = $request->route('election')
            ?? $request->route('uuid')
            ?? $request->header('X-Election');

        if (! $electionUuid) {
            throw ElectionException::notFound();
        }

        $election = Election::where('uuid', $electionUuid)->firstOrFail();

        if (! $election) {
            throw ElectionException::notFound();
        }

        // Check access based on user role
        if (Auth::check()) {
            $hasAccess = Auth::user()->canAccessElection($election);

            if (! $hasAccess && ! $election->allow_guest_vote) {
                throw ElectionException::notAccessible();
            }
        } elseif (! $election->allow_guest_vote) {
            throw ElectionException::notAccessible();
        }

        $request->merge(['current_election' => $election]);
        app()->instance('current_election', $election);

        return $next($request);
    }
}

<?php

namespace App\Http\Middleware;

use App\Exceptions\OrganizationException;
use App\Models\Organization;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class TenantMiddleware
{
    public function handle(Request $request, Closure $next)
    {
        $organizationSlug = $request->route('organization')
            ?? $request->header('X-Organization')
            ?? $request->get('organization_slug');

        if (! $organizationSlug) {
            throw OrganizationException::notFound();
        }

        $organization = Organization::where('slug', $organizationSlug)
            ->active()
            ->first();

        if (! $organization) {
            throw OrganizationException::notFound();
        }

        // Check if user belongs to organization
        if (Auth::check() && ! Auth::user()->canAccessOrganization($organization)) {
            throw OrganizationException::accessDenied();
        }

        // Bind organization to request
        $request->merge(['current_organization' => $organization]);
        app()->instance('current_organization', $organization);

        return $next($request);
    }
}

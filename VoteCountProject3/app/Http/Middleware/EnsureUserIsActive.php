<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

/**
 * Bloque à CHAQUE requête tout utilisateur suspendu ou banni — la suspension
 * prend effet immédiatement, même sur une session déjà ouverte (contrairement
 * au seul contrôle au login). Invalide la session SPA au passage.
 */
class EnsureUserIsActive
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user && $user->isBlocked()) {
            Auth::guard('web')->logout();

            if ($request->hasSession()) {
                $request->session()->invalidate();
                $request->session()->regenerateToken();
            }

            return response()->json([
                'success' => false,
                'message' => $user->status->value === 'banned'
                    ? 'Votre compte a été banni. Contactez l\'administrateur.'
                    : 'Votre compte a été suspendu. Contactez l\'administrateur.',
            ], 403);
        }

        return $next($request);
    }
}

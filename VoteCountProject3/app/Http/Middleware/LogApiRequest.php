<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

class LogApiRequest
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Responsphp artisan reverb:starte)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->is('api/*') && ! $request->is('api/v1/votes/submit')) {
            Log::channel('audit')->info('API Request', [
                'method' => $request->method(),
                'path' => $request->path(),
                'ip' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'user_id' => Auth::user() ? Auth::user()->id : null,
            ]);
        }

        return $next($request);
    }
}

<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Cache\RateLimiter;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class RateLimitMiddleware
{
    protected RateLimiter $limiter;

    public function __construct(RateLimiter $limiter)
    {
        $this->limiter = $limiter;
    }

    public function handle(Request $request, Closure $next): Response
    {
        $key = $this->resolveRequestKey($request);
        $maxAttempts = $this->resolveMaxAttempts($request);
        $decayMinutes = $this->resolveDecayMinutes($request);

        if ($this->limiter->tooManyAttempts($key, $maxAttempts)) {
            $retryAfter = $this->limiter->availableIn($key);

            return response()->json([
                'success' => false,
                'message' => 'Too many attempts. Please try again later.',
                'retry_after' => $retryAfter,
                'status_code' => 429,
            ], 429);
        }

        $this->limiter->hit($key, $decayMinutes * 60);

        $response = $next($request);

        return $this->addHeaders(
            $response,
            $maxAttempts,
            $this->limiter->attempts($key),
            $this->limiter->availableIn($key)
        );
    }

    protected function resolveRequestKey(Request $request): string
    {
        if (Auth::check()) {
            return 'user_'.Auth::user()->id.'_'.$request->path();
        }

        return 'ip_'.$request->ip().'_'.$request->path();
    }

    protected function resolveMaxAttempts(Request $request): int
    {
        $route = $request->route();
        $maxAttempts = config('rate_limiting.global', 60);

        if ($route && $route->getName()) {
            $routeMax = config('rate_limiting.routes.'.$route->getName());
            if ($routeMax) {
                $maxAttempts = $routeMax;
            }
        }

        return $maxAttempts;
    }

    protected function resolveDecayMinutes(Request $request): int
    {
        $route = $request->route();
        $decayMinutes = 1;

        if ($route && $route->getName()) {
            $routeDecay = config('rate_limiting.decay.'.$route->getName());
            if ($routeDecay) {
                $decayMinutes = $routeDecay;
            }
        }

        return $decayMinutes;
    }

    protected function addHeaders(Response $response, int $limit, int $remaining, int $retryAfter): Response
    {
        $response->headers->set('X-RateLimit-Limit', $limit);
        $response->headers->set('X-RateLimit-Remaining', $remaining);

        if ($retryAfter > 0) {
            $response->headers->set('Retry-After', $retryAfter);
        }

        return $response;
    }
}

<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class LogIpAddress
{
    public function handle(Request $request, Closure $next)
    {
        $response = $next($request);

        // Log IP pour chaque requête API (optionnel, pour audit)
        if ($request->is('api/*')) {
            Log::channel('audit')->debug('API Request', [
                'method' => $request->method(),
                'path' => $request->path(),
                'ip' => $this->getClientIp($request),
                'user_agent' => $request->userAgent(),
                'user_id' => Auth::user() ? Auth::user()->id : null,
            ]);
        }

        return $response;
    }

    protected function getClientIp(Request $request): string
    {
        $headers = [
            'HTTP_X_FORWARDED_FOR',
            'HTTP_X_REAL_IP',
            'HTTP_CLIENT_IP',
            'REMOTE_ADDR',
        ];

        foreach ($headers as $header) {
            if ($request->server($header)) {
                $ips = explode(',', $request->server($header));
                $ip = trim($ips[0]);
                if (filter_var($ip, FILTER_VALIDATE_IP)) {
                    return $ip;
                }
            }
        }

        return $request->ip() ?? '0.0.0.0';
    }
}

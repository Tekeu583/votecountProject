<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class NormalizeUri
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $rawUri = $request->getRequestUri();
        
        // Détection chirurgicale des espaces (bruts ou encodés) en début/fin d'URI
        if (preg_match('/^(\s|%20)+|(\s|%20)+$/', $rawUri)) {
            $cleanUri = preg_replace('/^(\s|%20)+|(\s|%20)+$/', '', $rawUri);
            
            // On utilise une redirection 308 (Permanent Redirect) 
            // C'est crucial pour les APIs car cela préserve la méthode (POST) et le Body
            return redirect()->to($cleanUri, 308);
        }

        return $next($request);
    }
}

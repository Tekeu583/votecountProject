<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    |
    | Here you may configure your settings for cross-origin resource sharing
    | or "CORS". This determines what cross-origin operations may execute
    | in web browsers. You are free to adjust these settings as needed.
    |
    | To learn more: https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
    |
    */

    'paths' => ['api/*', 'sanctum/csrf-cookie','broadcasting/auth'],

    'allowed_methods' => ['*'],

    // Origines autorisées : uniquement celles définies par variables d'env.
    // array_filter retire les valeurs vides — ainsi aucun localhost n'est
    // codé en dur (il resterait sinon ouvert sur le serveur de production).
    // En dev local : FRONTEND_URL=http://localhost:5173 (+ FRONTEND_URL_ALT au besoin).
    'allowed_origins' => array_values(array_filter([
        env('FRONTEND_URL'),
        env('FRONTEND_URL_ALT'),
    ])),

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['Accept', 'Authorization', 'X-XSRF-TOKEN', 'Content-Type','X-Requested-With',],

    'exposed_headers' => ['XSRF-TOKEN'],

    'max_age' => 0,

    'supports_credentials' => true,

];

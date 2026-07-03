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

    'allowed_origins' => [env('FRONTEND_URL', 'http://localhost:5173'), 'http://localhost:3000', 'http://localhost:5174'],

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['Accept', 'Authorization', 'X-XSRF-TOKEN', 'Content-Type','X-Requested-With',],

    'exposed_headers' => ['XSRF-TOKEN'],

    'max_age' => 0,

    'supports_credentials' => true,

];

<?php

return [
    'global' => env('RATE_LIMIT_GLOBAL', 60),
    'api' => env('RATE_LIMIT_API', 100),
    'auth' => env('RATE_LIMIT_AUTH', 10),
    'vote' => env('RATE_LIMIT_VOTE', 5),

    'routes' => [
        'auth.login' => 10,
        'auth.register' => 5,
        'auth.forgot-password' => 3,
        'votes.submit' => 5,
        'votes.verify' => 10,
    ],

    'decay' => [
        'auth.login' => 1,
        'auth.register' => 60,
        'auth.forgot-password' => 60,
        'votes.submit' => 1,
    ],
];

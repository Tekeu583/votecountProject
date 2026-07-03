<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Environnement de paiement global
    |--------------------------------------------------------------------------
    | 'sandbox' en dev/staging, 'production' en prod.
    | Toutes les variables sensibles viennent du .env — jamais codées ici.
    */
    'environment' => env('PAYMENT_ENV', 'sandbox'),

    /*
    |--------------------------------------------------------------------------
    | Devise par défaut
    |--------------------------------------------------------------------------
    */
    'default_currency' => env('PAYMENT_CURRENCY', 'XAF'),

    /*
    |--------------------------------------------------------------------------
    | Providers disponibles
    |--------------------------------------------------------------------------
    */
    'providers' => [

        'orange_money' => [
            'driver'         => \App\Services\Payment\OrangeMoneyProvider::class,
            'api_key'        => env('ORANGE_MONEY_API_KEY'),
            'api_secret'     => env('ORANGE_MONEY_API_SECRET'),
            'webhook_secret' => env('ORANGE_MONEY_WEBHOOK_SECRET'),
            'environment'    => env('PAYMENT_ENV', 'sandbox'),
            'enabled'        => env('ORANGE_MONEY_ENABLED', true),
        ],

        'mtn_money' => [
            'driver'         => \App\Services\Payment\MTNMoneyProvider::class,
            'api_key'        => env('MTN_MONEY_API_KEY'),
            'api_secret'     => env('MTN_MONEY_API_SECRET'),
            'webhook_secret' => env('MTN_MONEY_WEBHOOK_SECRET'),
            'environment'    => env('PAYMENT_ENV', 'sandbox'),
            'enabled'        => env('MTN_MONEY_ENABLED', true),
        ],

        'stripe' => [
            'driver'         => \App\Services\Payment\StripeProvider::class,
            'api_key'        => env('STRIPE_API_KEY'),
            'api_secret'     => env('STRIPE_API_SECRET'),
            'webhook_secret' => env('STRIPE_WEBHOOK_SECRET'),
            'environment'    => env('PAYMENT_ENV', 'sandbox'),
            'enabled'        => env('STRIPE_ENABLED', true),
        ],
        'campay' => [
            'driver'         => \App\Services\Payment\CamPayProvider::class,
            'api_key'        => env('CAMPAY_ACCESS_TOKEN'),
            'api_secret'     => '', // non utilisé par CamPay
            'webhook_secret' => env('CAMPAY_WEBHOOK_SECRET'),
            'environment'    => env('PAYMENT_ENV', 'sandbox'),
            'enabled'        => env('CAMPAY_ENABLED', true),
        ],

    ],

    /*
    |--------------------------------------------------------------------------
    | Durée de cache des tokens OAuth (Orange Money, MTN Money)
    |--------------------------------------------------------------------------
    | En secondes. 3300 = 55 minutes (marge avant expiration de 60 min).
    */
    'token_cache_ttl' => env('PAYMENT_TOKEN_CACHE_TTL', 3300),

];

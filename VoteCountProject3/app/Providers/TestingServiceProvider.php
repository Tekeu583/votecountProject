<?php

namespace App\Providers;

use Illuminate\Support\Facades\Config;
use Illuminate\Support\ServiceProvider;

class TestingServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        if ($this->app->environment('testing')) {
            Config::set('cache.default', 'array');
            Config::set('queue.default', 'sync');
            Config::set('session.driver', 'array');
            Config::set('mail.default', 'array');
            Config::set('broadcasting.default', 'log');
        }
    }

    public function boot(): void
    {
        //
    }
}

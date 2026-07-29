<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Pagination\Paginator;
use Illuminate\Queue\Events\JobExceptionOccurred;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        if ($this->app->environment('local')) {
            if (class_exists(\Laravel\Telescope\TelescopeServiceProvider::class)) {
                $this->app->register(\Laravel\Telescope\TelescopeServiceProvider::class);
            }
            $this->app->singleton(\App\Services\PaymentGateway::class);
        }
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Définir le Rate Limiter 'api'
        RateLimiter::for('api', function (Request $request) {
            return Limit::perMinute(60)->by($request->user()?->id ?: $request->ip());
        });

        // Limite la soumission de demandes de retrait — anti-spam simple en
        // complément du garde-fou métier (une seule demande pending/approved
        // à la fois par organisation, cf. WithdrawalService::createRequest()).
        RateLimiter::for('withdrawal-requests', function (Request $request) {
            return Limit::perDay(5)->by($request->user()?->id ?: $request->ip());
        });

        // Forcer les requêtes HTTPS en production
        if ($this->app->environment('production')) {
            URL::forceScheme('https');
        }

        // Prévenir les N+1 queries en développement
        if ($this->app->environment('local')) {
            Model::preventLazyLoading();
            DB::listen(function ($query) {
                if ($query->time > 100) {
                    logger()->warning('Slow query detected', [
                        'sql' => $query->sql,
                        'bindings' => $query->bindings,
                        'time' => $query->time
                    ]);
                }
            });
        }
        Event::listen(function (JobExceptionOccurred $event) {
            DB::disconnect();
        });

        // Pagination avec Tailwind
        Paginator::useTailwind();

        // Strict mode pour les models
        Model::shouldBeStrict();
    }
}

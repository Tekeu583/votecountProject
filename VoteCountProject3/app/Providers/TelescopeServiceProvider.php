<?php

namespace App\Providers;

use App\Models\User;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

/**
 * Charge conditionnellement le TelescopeServiceProvider :
 * - En dev (Telescope installé via require-dev) : étend TelescopeApplicationServiceProvider
 *   et registre les filtres, la gate, le masquage des données sensibles.
 * - En prod (--no-dev, Telescope absent) : devient un ServiceProvider vide.
 *
 * Ce guard permet à composer install --no-dev de ne pas crasher sur
 * "Class Laravel\Telescope\TelescopeApplicationServiceProvider not found".
 */
if (class_exists(\Laravel\Telescope\TelescopeApplicationServiceProvider::class)) {

    class TelescopeServiceProvider extends \Laravel\Telescope\TelescopeApplicationServiceProvider
    {
        public function register(): void
        {
            $this->hideSensitiveRequestDetails();

            $isLocal = $this->app->environment('local');

            \Laravel\Telescope\Telescope::filter(function (\Laravel\Telescope\IncomingEntry $entry) use ($isLocal) {
                return $isLocal ||
                       $entry->isReportableException() ||
                       $entry->isFailedRequest() ||
                       $entry->isFailedJob() ||
                       $entry->isScheduledTask() ||
                       $entry->hasMonitoredTag();
            });
        }

        protected function hideSensitiveRequestDetails(): void
        {
            if ($this->app->environment('local')) {
                return;
            }

            \Laravel\Telescope\Telescope::hideRequestParameters(['_token']);
            \Laravel\Telescope\Telescope::hideRequestHeaders([
                'cookie',
                'x-csrf-token',
                'x-xsrf-token',
            ]);
        }

        protected function gate(): void
        {
            Gate::define('viewTelescope', function (User $user) {
                return $user->isSuperAdmin();
            });
        }
    }

} else {

    // Fallback prod : ServiceProvider vide, sans dépendance à Telescope.
    class TelescopeServiceProvider extends ServiceProvider
    {
        public function register(): void
        {
            // Telescope n'est pas installé (--no-dev). Rien à faire.
        }
    }
}
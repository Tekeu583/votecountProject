<?php

use App\Console\Commands\ProcessElectionLifecycle;
use App\Console\Commands\ProcessSubscriptionRenewals;
use App\Console\Commands\PurgeExpiredTrash;
use App\Jobs\CleanStaleDrafts;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schedule;


Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');


// Transitions automatiques du cycle de vie des élections :
//   - published → ongoing dès que start_at est atteint
//   - ongoing   → closed  dès que end_at est dépassé
//   - is_votable et is_editable se mettent à jour automatiquement
//     (accesseurs dynamiques, pas de colonnes à modifier)
//
// Fréquence : chaque minute — précision maximale du scheduler Laravel.
// withoutOverlapping() : si un cycle dure > 1 min (ex: nombreuses
// élections à traiter), on n'en lance pas un second en parallèle.
// runInBackground() : non bloquant pour le scheduler principal.

Schedule::command(ProcessElectionLifecycle::class)
    ->everyMinute()
    ->withoutOverlapping()
    ->runInBackground()
    ->onFailure(function () {
        Log::error('ProcessElectionLifecycle : échec de l\'exécution planifiée');
    });

// Traitement des abonnements : renouvellements auto + alertes d'expiration
// Lancé chaque jour à 02:00 (heure creuse) pour éviter les pics de charge
Schedule::command(ProcessSubscriptionRenewals::class)
    ->dailyAt('02:00')
    ->withoutOverlapping()       // évite les doubles exécutions si la précédente traîne
    ->runInBackground()          // non bloquant
    ->onFailure(function () {
        Log::error('ProcessSubscriptionRenewals : échec de l\'exécution planifiée');
    })
    ->emailOutputOnFailure(env('MAIL_ADMIN_ADDRESS', 'admin@example.com'));

// Nettoyage quotidien des brouillons d'élection abandonnés (> 7 jours sans activité)
Schedule::job(new CleanStaleDrafts)->daily();

// Purge définitive quotidienne de la corbeille (éléments non restaurés
// dont expires_at est dépassé — 60 jours après suppression par défaut).
Schedule::command(PurgeExpiredTrash::class)
    ->daily()
    ->withoutOverlapping()
    ->runInBackground()
    ->onFailure(function () {
        Log::error('PurgeExpiredTrash : échec de l\'exécution planifiée');
    });

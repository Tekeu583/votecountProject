<?php

namespace App\Console\Commands;

use App\Jobs\RenewSubscriptionJob;
use App\Models\Subscription;
use App\Notifications\SubscriptionRenewalNotification;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class ProcessSubscriptionRenewals extends Command
{
    protected $signature = 'subscriptions:process-renewals
                            {--dry-run : Affiche ce qui serait fait sans effectuer d\'actions}';

    protected $description = 'Renouvelle automatiquement les abonnements éligibles et envoie les alertes d\'expiration';

    public function handle(): int
    {
        $isDryRun = $this->option('dry-run');

        if ($isDryRun) {
            $this->warn('Mode dry-run activé — aucune action ne sera effectuée.');
        }

        $this->processExpired($isDryRun);
        $this->processExpiringWarnings($isDryRun);
        $this->processAutoRenewals($isDryRun);

        $this->info('Traitement des abonnements terminé.');

        return self::SUCCESS;
    }


    /**
     * Marque comme expirés les abonnements actifs dont la date de fin est dépassée.
     */
    protected function processExpired(bool $isDryRun): void
    {
        $expired = Subscription::where('status', 'active')
            ->where('end_at', '<', now())
            ->where('auto_renew', false)
            ->with(['organization.owner', 'plan'])
            ->get();

        $this->line("Abonnements expirés (sans auto_renew) : {$expired->count()}");

        foreach ($expired as $subscription) {
            $this->line("  → Expiration : {$subscription->organization->name} / {$subscription->plan->name}");

            if (! $isDryRun) {
                $subscription->update(['status' => 'expired']);

                $owner = $subscription->organization->owner;
                $owner?->notify(new SubscriptionRenewalNotification(
                    $subscription,
                    SubscriptionRenewalNotification::TYPE_EXPIRED,
                ));

                Log::info('Subscription expired', ['uuid' => $subscription->uuid]);
            }
        }
    }

    /**
     * Envoie des alertes aux organisations dont l'abonnement expire dans 7 jours ou 1 jour.
     * N'envoie pas d'alerte si auto_renew est activé (le renouvellement sera automatique).
     */
    protected function processExpiringWarnings(bool $isDryRun): void
    {
        $thresholds = [
            7 => '7 jours',
            1 => '1 jour',
        ];

        foreach ($thresholds as $days => $label) {
            $subscriptions = Subscription::where('status', 'active')
                ->where('auto_renew', false)
                ->whereBetween('end_at', [
                    now()->addDays($days)->startOfDay(),
                    now()->addDays($days)->endOfDay(),
                ])
                ->with(['organization.owner', 'plan'])
                ->get();

            $this->line("Abonnements expirant dans {$label} : {$subscriptions->count()}");

            foreach ($subscriptions as $subscription) {
                $this->line("  → Alerte ({$label}) : {$subscription->organization->name}");

                if (! $isDryRun) {
                    $owner = $subscription->organization->owner;
                    $owner?->notify(new SubscriptionRenewalNotification(
                        $subscription,
                        SubscriptionRenewalNotification::TYPE_EXPIRING,
                    ));
                }
            }
        }
    }

    /**
     * Lance les jobs de renouvellement pour les abonnements avec auto_renew actif
     * qui expirent dans moins de 24h.
     */
    protected function processAutoRenewals(bool $isDryRun): void
    {
        $toRenew = Subscription::where('status', 'active')
            ->where('auto_renew', true)
            ->where('end_at', '<=', now()->addDay())
            ->with(['organization.owner', 'plan'])
            ->get();

        $this->line("Abonnements à renouveler automatiquement : {$toRenew->count()}");

        foreach ($toRenew as $subscription) {
            $this->line("  → Renouvellement : {$subscription->organization->name} / {$subscription->plan->name}");

            if (! $isDryRun) {
                dispatch(new RenewSubscriptionJob($subscription));

                Log::info('RenewSubscriptionJob dispatched', ['uuid' => $subscription->uuid]);
            }
        }
    }
}

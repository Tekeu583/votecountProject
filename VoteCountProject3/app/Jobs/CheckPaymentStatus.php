<?php

namespace App\Jobs;

use App\Models\PaymentTransaction;
use App\Notifications\SubscriptionRenewalNotification;
use App\Services\PaymentService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class CheckPaymentStatus implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public PaymentTransaction $transaction;

    public int $attempt = 0;

    /** Indique si ce check fait suite à un renouvellement automatique */
    public bool $isAutoRenewal;

    public function __construct(PaymentTransaction $transaction, int $attempt = 0, bool $isAutoRenewal = false)
    {
        $this->transaction   = $transaction;
        $this->attempt       = $attempt;
        $this->isAutoRenewal = $isAutoRenewal;
    }

    public function handle(PaymentService $paymentService): void
    {
        $transaction = $this->transaction->fresh(['subscription.plan', 'subscription.organization.owner']);

        if ($transaction->status->isFinal()) {
            return;
        }

        $verified = $paymentService->verifyPayment($transaction);

        if ($verified) {
            // Paiement confirmé — si c'est un renouvellement auto, notifier le owner
            if ($this->isAutoRenewal && $transaction->type === 'subscription') {
                $subscription = $transaction->subscription?->fresh(['plan', 'organization.owner']);

                if ($subscription) {
                    // Recalculer les dates d'abonnement
                    $subscription->renew();

                    // Notifier le propriétaire de l'organisation
                    $owner = $subscription->organization->owner;
                    $owner?->notify(new SubscriptionRenewalNotification(
                        $subscription,
                        SubscriptionRenewalNotification::TYPE_RENEWED,
                    ));
                }
            }

            return;
        }

        // Pas encore confirmé — réessayer jusqu'à 10 fois
        if ($this->attempt < 10) {
            dispatch(new CheckPaymentStatus($transaction, $this->attempt + 1, $this->isAutoRenewal))
                ->delay(now()->addSeconds(10));
        } else {
            // Abandon après 10 tentatives — marquer comme échoué
            $transaction->markAsFailed('Délai de vérification dépassé (10 tentatives)');

            if ($this->isAutoRenewal && $transaction->type === 'subscription') {
                $subscription = $transaction->subscription;
                $owner        = $subscription?->organization?->owner;
                $owner?->notify(new SubscriptionRenewalNotification(
                    $subscription,
                    SubscriptionRenewalNotification::TYPE_FAILED,
                    'Délai de confirmation dépassé',
                ));
            }
        }
    }
}

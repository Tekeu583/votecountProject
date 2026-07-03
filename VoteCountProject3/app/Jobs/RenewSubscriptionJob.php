<?php

namespace App\Jobs;

use App\Jobs\CheckPaymentStatus;
use App\Models\PaymentTransaction;
use App\Models\Subscription;
use App\Notifications\SubscriptionRenewalNotification;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class RenewSubscriptionJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /** Nombre de tentatives max avant abandon */
    public int $tries = 3;

    /** Délai entre les tentatives (secondes) */
    public int $backoff = 60;

    public function __construct(protected Subscription $subscription) {}

    protected function gateway(): \App\Services\PaymentGateway
    {
        return app(\App\Services\PaymentGateway::class);
    }


    public function handle(): void
    {
        $subscription = $this->subscription->fresh(['plan', 'organization.owner']);
        $organization = $subscription->organization;
        $owner        = $organization->owner;

        // Sécurité : ne renouveler que si toujours actif et auto_renew activé
        if (! $subscription->auto_renew || ! $subscription->is_active) {
            Log::info('RenewSubscriptionJob skipped', [
                'subscription' => $subscription->uuid,
                'reason'       => $subscription->auto_renew ? 'not active' : 'auto_renew disabled',
            ]);

            return;
        }

        // Retrouver le dernier provider de paiement utilisé avec succès
        $lastTransaction = PaymentTransaction::where('subscription_id', $subscription->id)
            ->where('type', 'subscription')
            ->where('status', 'completed')
            ->latest('paid_at')
            ->first();

        $provider = $lastTransaction?->provider
            ?? $this->gateway()->enabledProviders()[0]
            ?? null;

        if (! $provider) {
            $this->notifyFailure($owner, 'Aucun provider de paiement disponible.');
            return;
        }

        DB::beginTransaction();
        try {
            $plan      = $subscription->plan;
            $reference = 'SUB_RENEW_' . strtoupper(uniqid()) . '_' . random_int(1000, 9999);

            $transaction = PaymentTransaction::create([
                'subscription_id'       => $subscription->id,
                'organization_id'       => $organization->id,
                'type'                  => 'subscription',
                'provider'              => $provider,
                'phone_number'          => $lastTransaction?->phone_number,
                'currency'              => $plan->currency,
                'amount'                => $plan->price,
                'net_amount'            => $plan->price,
                'payment_method'        => $provider,
                'transaction_reference' => $reference,
                'provider_reference'    => '',
                'status'                => 'processing',
            ]);

            // Initier le paiement auprès du provider
            $providerInstance = $this->gateway()->provider($provider, $organization);
            $response         = $providerInstance->initiatePayment($transaction, $lastTransaction?->phone_number);

            $transaction->update([
                'provider_reference' => $response['reference'],
                'provider_response'  => $response,
            ]);

            DB::commit();

            Log::info('RenewSubscriptionJob : paiement initié', [
                'subscription'    => $subscription->uuid,
                'transaction_ref' => $reference,
                'provider'        => $provider,
            ]);

            // Lancer le polling du statut (réutilise le Job existant)
            dispatch(new CheckPaymentStatus($transaction,0,true))->delay(now()->addSeconds(15));
        } catch (\Exception $e) {
            DB::rollBack();

            Log::error('RenewSubscriptionJob : échec', [
                'subscription' => $subscription->uuid,
                'error'        => $e->getMessage(),
            ]);

            $this->notifyFailure($owner, $e->getMessage());

            // Relancer la tentative via la queue (jusqu'à $tries)
            $this->fail($e);
        }
    }

    protected function notifyFailure(mixed $owner, string $reason): void
    {
        if ($owner) {
            $owner->notify(new SubscriptionRenewalNotification(
                $this->subscription,
                SubscriptionRenewalNotification::TYPE_FAILED,
                $reason,
            ));
        }
    }
}

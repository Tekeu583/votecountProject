<?php

namespace App\Services;

use App\Exceptions\PaymentException;
use App\Models\PaymentTransaction;
use App\Models\PaymentWebhook;
use App\Models\Vote;

class PaymentService
{
    public function __construct(protected PaymentGateway $gateway) {}

    /**
     * Expose les providers activés pour les controllers qui en ont besoin.
     */
    public function getProviders(): array
    {
        return $this->gateway->enabledProviders();
    }

    /**
     * Initie un paiement pour un vote.
     */
    public function processPayment(Vote $vote, string $provider, string $phoneNumber): PaymentTransaction
    {
        // Résolution : d'abord l'org de l'élection (pour un éventuel override), sinon .env
        $organization = $vote->election->organization;
        $providerInstance = $this->gateway->provider($provider, $organization);

        $transaction = PaymentTransaction::create([
            'vote_id'               => $vote->id,
            'election_id'           => $vote->election_id,
            'elector_id'            => $vote->elector_id,
            'organization_id'       => $organization->id,
            'type'                  => 'vote',
            'provider'              => $provider,
            'phone_number'          => $phoneNumber,
            'currency'              => $vote->election->currency,
            'amount'                => $vote->total_amount,
            'net_amount'            => $vote->total_amount,
            'payment_method'        => $provider,
            'transaction_reference' => $this->generateTransactionReference(),
            'provider_reference'    => '',
            'status'                => 'processing',
        ]);

        try {
            $response = $providerInstance->initiatePayment($transaction, $phoneNumber);

            $transaction->update([
                'provider_reference' => $response['reference'],
                'provider_response'  => $response,
            ]);

            return $transaction;
        } catch (\Exception $e) {
            $transaction->markAsFailed($e->getMessage());
            throw PaymentException::providerError($provider, $e->getMessage());
        }
    }

    /**
     * Vérifie le statut d'une transaction auprès du prestataire.
     */
    public function verifyPayment(PaymentTransaction $transaction): bool
    {
        // Résolution : org de l'élection ou org directe de la transaction
        $organization = $transaction->election?->organization
            ?? $transaction->organization;

        $providerInstance = $this->gateway->provider($transaction->provider, $organization);
        $status = $providerInstance->checkStatus($transaction->provider_reference);

        if ($status === 'completed') {
            $transaction->markAsCompleted($transaction->provider_reference);
            return true;
        }

        if ($status === 'failed') {
            $transaction->markAsFailed('Payment failed from provider');
            return false;
        }

        return false;
    }

    /**
     * Traite un webhook entrant — config résolue depuis .env (+ éventuel override DB).
     */

    public function handleWebhook(string $provider, array $payload, string $signature): void
    {
        $providerRef = $payload['reference'] ?? $payload['transaction_reference'] ?? null;
        $externalRef = $payload['external_reference'] ?? null;

        $transaction = PaymentTransaction::query()
            ->where('provider', $provider)
            ->where(function ($q) use ($providerRef, $externalRef) {
                if ($providerRef) {
                    $q->orWhere('provider_reference', $providerRef);
                }
                if ($externalRef) {
                    $q->orWhere('transaction_reference', $externalRef);
                }
            })
            ->with(['election.organization', 'organization'])
            ->first();

        $organization = $transaction?->election?->organization
            ?? $transaction?->organization;

        $providerInstance = $this->gateway->provider($provider, $organization);

        if (! $providerInstance->verifyWebhook($payload, $signature)) {
            throw PaymentException::webhookVerificationFailed();
        }

        if ($transaction && $transaction->status->value === 'processing') {
            $this->verifyPayment($transaction);
        }

        PaymentWebhook::create([
            'provider'     => $provider,
            'payload'      => $payload,
            'signature'    => $signature,
            'processed'    => true,
            'processed_at' => now(),
        ]);
    }

    protected function generateTransactionReference(): string
    {
        return 'VOTE_' . strtoupper(uniqid()) . '_' . random_int(1000, 9999);
    }
}

<?php

namespace App\Services\Payment;

use App\DTOs\PaymentProviderConfig;
use App\Models\PaymentTransaction;
use App\Services\Contracts\PaymentProviderInterface;
use Illuminate\Support\Facades\Log;
use Stripe\Exception\SignatureVerificationException;
use Stripe\PaymentIntent;
use Stripe\Stripe;
use Stripe\Webhook;

class StripeProvider implements PaymentProviderInterface
{
    protected PaymentProviderConfig $config;

    public function initialize(PaymentProviderConfig $config): void
    {
        $config->validate();
        $this->config = $config;
        Stripe::setApiKey($config->apiKey);
    }

    public function initiatePayment(PaymentTransaction $transaction, string $phoneNumber): array
    {
        $intent = PaymentIntent::create([
            'amount'   => (int) ($transaction->amount * 100), // en centimes
            'currency' => strtolower($transaction->currency),
            'metadata' => [
                'transaction_reference' => $transaction->transaction_reference,
                'transaction_id'        => $transaction->id,
            ],
        ]);

        return [
            'reference'     => $intent->id,
            'client_secret' => $intent->client_secret,
            'status'        => 'PENDING',
        ];
    }

    public function checkStatus(string $reference): string
    {
        $intent = PaymentIntent::retrieve($reference);

        return match ($intent->status) {
            'succeeded' => 'completed',
            'processing' => 'pending',
            default      => 'failed',
        };
    }

    public function verifyWebhook(array $payload, string $signature): bool
    {
        if (empty($signature) || empty($this->config->webhookSecret)) {
            return false;
        }

        try {
            $rawPayload = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
            Webhook::constructEvent($rawPayload, $signature, $this->config->webhookSecret);
            return true;
        } catch (SignatureVerificationException $e) {
            Log::warning('Stripe webhook signature verification failed', [
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }
}

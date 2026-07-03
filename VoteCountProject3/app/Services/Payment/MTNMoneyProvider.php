<?php

namespace App\Services\Payment;

use App\DTOs\PaymentProviderConfig;
use App\Models\PaymentTransaction;
use App\Services\Contracts\PaymentProviderInterface;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class MTNMoneyProvider implements PaymentProviderInterface
{
    protected PaymentProviderConfig $config;
    protected string $baseUrl;

    public function initialize(PaymentProviderConfig $config): void
    {
        $config->validate();
        $this->config  = $config;
        $this->baseUrl = $config->isProduction()
            ? 'https://api.mtn.com/momo/v1'
            : 'https://api.mtn.com/sandbox/momo/v1';
    }

    public function initiatePayment(PaymentTransaction $transaction, string $phoneNumber): array
    {
        $response = Http::withHeaders([
            'Authorization'  => 'Bearer ' . $this->getAccessToken(),
            'X-Reference-Id' => $transaction->transaction_reference,
            'Content-Type'   => 'application/json',
        ])->post($this->baseUrl . '/request-to-pay', [
            'amount'     => $transaction->amount,
            'currency'   => $transaction->currency,
            'externalId' => $transaction->transaction_reference,
            'payer'      => [
                'partyIdType' => 'MSISDN',
                'partyId'     => $phoneNumber,
            ],
            'payerMessage' => 'Payment for ' . ($transaction->election?->title ?? 'subscription'),
        ]);

        if (! $response->successful()) {
            Log::error('MTN Money payment failed', [
                'response'    => $response->json(),
                'transaction' => $transaction->id,
            ]);
            throw new \Exception('MTN Money payment failed: ' . $response->body());
        }

        return [
            'reference' => $transaction->transaction_reference,
            'status'    => 'PENDING',
        ];
    }

    public function checkStatus(string $reference): string
    {
        $response = Http::withHeaders([
            'Authorization' => 'Bearer ' . $this->getAccessToken(),
        ])->get($this->baseUrl . '/request-to-pay/' . $reference);

        if (! $response->successful()) {
            return 'failed';
        }

        return match ($response->json()['status'] ?? 'PENDING') {
            'SUCCESSFUL' => 'completed',
            'PENDING'    => 'pending',
            default      => 'failed',
        };
    }

    public function verifyWebhook(array $payload, string $signature): bool
    {
        $expected = hash_hmac('sha256', json_encode($payload), $this->config->webhookSecret);
        return hash_equals($expected, $signature);
    }

    /**
     * Récupère un access token OAuth avec cache — évite un appel réseau par transaction.
     */
    protected function getAccessToken(): string
    {
        $cacheKey = 'payment_token_mtn_' . md5($this->config->apiKey);
        $ttl      = config('payment.token_cache_ttl', 3300);

        return Cache::remember($cacheKey, $ttl, function () {
            $response = Http::withBasicAuth($this->config->apiKey, $this->config->apiSecret)
                ->post($this->baseUrl . '/token', ['grant_type' => 'client_credentials']);

            if (! $response->successful()) {
                throw new \RuntimeException('MTN Money : impossible d\'obtenir un access token.');
            }

            return $response->json()['access_token'] ?? '';
        });
    }
}

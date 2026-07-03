<?php

namespace App\Services\Payment;

use App\DTOs\PaymentProviderConfig;
use App\Models\PaymentTransaction;
use App\Services\Contracts\PaymentProviderInterface;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class OrangeMoneyProvider implements PaymentProviderInterface
{
    protected PaymentProviderConfig $config;
    protected string $baseUrl;

    public function initialize(PaymentProviderConfig $config): void
    {
        $config->validate();
        $this->config  = $config;
        $this->baseUrl = $config->isProduction()
            ? 'https://api.orange.com/orange-money/webpayment/v1'
            : 'https://api.orange.com/sandbox/orange-money/webpayment/v1';
    }

    public function initiatePayment(PaymentTransaction $transaction, string $phoneNumber): array
    {
        $response = Http::withHeaders([
            'Authorization' => 'Bearer ' . $this->getAccessToken(),
            'Content-Type'  => 'application/json',
        ])->post($this->baseUrl . '/webpayment', [
            'merchant_key'  => $this->config->apiKey,
            'currency'      => $transaction->currency,
            'order_id'      => $transaction->transaction_reference,
            'amount'        => $transaction->amount,
            'phone_number'  => $phoneNumber,
            'return_url'    => config('app.url') . '/api/v1/payments/verify',
            'cancel_url'    => config('app.url') . '/api/v1/payments/cancel',
            'notif_url'     => config('app.url') . '/api/v1/payments/webhook/orange_money',
        ]);

        if (! $response->successful()) {
            Log::error('Orange Money payment failed', [
                'response'    => $response->json(),
                'transaction' => $transaction->id,
            ]);
            throw new \Exception('Orange Money payment failed: ' . $response->body());
        }

        return $response->json();
    }

    public function checkStatus(string $reference): string
    {
        $response = Http::withHeaders([
            'Authorization' => 'Bearer ' . $this->getAccessToken(),
        ])->get($this->baseUrl . '/transactions/' . $reference);

        if (! $response->successful()) {
            return 'failed';
        }

        return match ($response->json()['status'] ?? 'PENDING') {
            'SUCCESS' => 'completed',
            'PENDING' => 'pending',
            default   => 'failed',
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
        $cacheKey = 'payment_token_orange_' . md5($this->config->apiKey);
        $ttl      = config('payment.token_cache_ttl', 3300);

        return Cache::remember($cacheKey, $ttl, function () {
            $response = Http::withBasicAuth($this->config->apiKey, $this->config->apiSecret)
                ->post($this->baseUrl . '/token', ['grant_type' => 'client_credentials']);

            if (! $response->successful()) {
                throw new \RuntimeException('Orange Money : impossible d\'obtenir un access token.');
            }

            return $response->json()['access_token'] ?? '';
        });
    }
}

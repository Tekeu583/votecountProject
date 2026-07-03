<?php

namespace App\Services\Payment;

use App\DTOs\PaymentProviderConfig;
use App\Models\PaymentTransaction;
use App\Services\Contracts\PaymentProviderInterface;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * CamPayProvider — intégration CamPay (agrégateur MTN + Orange Money Cameroun).
 *
 * Docs de référence (fournies par l'utilisateur, doc Postman CamPay) :
 *  - POST {base}/collect/        → initie un paiement (pop-up USSD sur le tel)
 *  - GET  {base}/transaction/{ref}/ → statut : SUCCESSFUL | PENDING | FAILED
 *  - Webhook : champ `signature` = JWT (HS256) signé avec la webhook key,
 *    à valider pour authentifier l'appel entrant.
 *
 * Auth : header "Authorization: Token <access_token>" (permanent token CamPay).
 */
class CamPayProvider implements PaymentProviderInterface
{
    protected PaymentProviderConfig $config;

    protected string $baseUrl;

    /**
     * Le token d'accès permanent CamPay.
     * CamPay n'utilise pas api_key/api_secret + OAuth comme Orange/MTN :
     * on réutilise le champ apiKey de PaymentProviderConfig pour transporter
     * l'access_token (voir mapping dans config/payment.php).
     */
    protected string $accessToken;

    public function initialize(PaymentProviderConfig $config): void
    {
        $this->config = $config;
        if (empty($config->apiKey)) {
            throw new \RuntimeException('CamPay : access_token manquant. Vérifiez CAMPAY_ACCESS_TOKEN dans votre .env.');
        }

        // Demo : https://demo.campay.net/api — Prod : https://www.campay.net/api
        $this->baseUrl = rtrim(config('services.campay.base_url', 'https://demo.campay.net/api'), '/');

        $this->accessToken = $config->apiKey;
    }

    /**
     * Initie un paiement CamPay (déclenche le pop-up USSD sur le téléphone).
     *
     * Retourne le JSON CamPay, qui contient au minimum :
     *   - reference : UUID CamPay de la transaction (sert au checkStatus / polling)
     *   - ussd_code, operator : infos d'affichage éventuelles
     */
    public function initiatePayment(PaymentTransaction $transaction, string $phoneNumber): array
    {
        $amountToSend = (string) (int) round((float) $transaction->amount);
        Log::info('DEBUG CamPay amount envoyé', [
            'transaction_amount_raw' => $transaction->amount,
            'amount_envoye_a_campay' => $amountToSend,
        ]);

        $response = Http::withHeaders([
            'Authorization' => 'Token ' . $this->accessToken,
            'Content-Type'  => 'application/json',
        ])->post($this->baseUrl . '/collect/', [
            'amount'             => $amountToSend,
            'from'               => $this->normalizePhone($phoneNumber),
            'description'        => 'Vote - ' . ($transaction->election?->title ?? 'Election'),
            'external_reference' => $transaction->transaction_reference,
        ]);

        if (! $response->successful()) {
            Log::error('CamPay payment initiation failed', [
                'status'      => $response->status(),
                'response'    => $response->json(),
                'transaction' => $transaction->id,
            ]);
            throw new \Exception('CamPay payment failed: ' . $response->body());
        }

        return $response->json();
    }

    /**
     * Vérifie le statut d'une transaction via son UUID CamPay (le "reference"
     * retourné par initiatePayment, stocké en provider_reference).
     *
     * Retourne l'un des statuts normalisés attendus par PaymentService :
     * 'completed' | 'pending' | 'failed'.
     */
    public function checkStatus(string $reference): string
    {
        $response = Http::withHeaders([
            'Authorization' => 'Token ' . $this->accessToken,
        ])->get($this->baseUrl . '/transaction/' . $reference . '/');

        if (! $response->successful()) {
            return 'pending';
        }

        return $this->mapStatus($response->json()['status'] ?? 'PENDING');
    }

    /**
     * Vérifie l'authenticité d'un webhook CamPay.
     *
     * CamPay envoie un champ `signature` qui est un JWT (HS256) signé avec la
     * webhook key de l'app. On le décode avec cette clé : si le décodage
     * réussit ET que les données du token correspondent au payload reçu, le
     * webhook est authentique.
     *
     * @param array  $payload   Les données du webhook (query params ou JSON).
     * @param string $signature Le JWT du champ `signature`.
     */
    public function verifyWebhook(array $payload, string $signature): bool
    {
        if (empty($signature) || empty($this->config->webhookSecret)) {
            return false;
        }

        try {
            $decoded = (array) JWT::decode(
                $signature,
                new Key($this->config->webhookSecret, 'HS256')
            );

            // On ne garde que le champ `reference` du payload.
            $payloadRef = $payload['reference'] ?? null;
            $tokenRef   = $decoded['reference'] ?? null;

            if ($payloadRef && $tokenRef && ! hash_equals((string) $tokenRef, (string) $payloadRef)) {
                Log::warning('CamPay webhook: reference mismatch entre JWT et payload', [
                    'payload_reference' => $payloadRef,
                    'token_reference'   => $tokenRef,
                ]);

                return false;
            }

            return true;
        } catch (\Throwable $e) {
            Log::warning('CamPay webhook signature invalide', ['error' => $e->getMessage()]);

            return false;
        }
    }

    /**
     * Mappe les statuts CamPay vers les statuts internes normalisés.
     * CamPay : SUCCESSFUL | PENDING | FAILED.
     */
    protected function mapStatus(string $campayStatus): string
    {
        return match (strtoupper($campayStatus)) {
            'SUCCESSFUL' => 'completed',
            'PENDING'    => 'pending',
            default      => 'failed',
        };
    }

    /**
     * Normalise un numéro camerounais au format attendu par CamPay :
     * 237XXXXXXXXX (indicatif pays, 9 chiffres, sans "+", espaces ni tirets).
     */
    protected function normalizePhone(string $phone): string
    {
        $digits = preg_replace('/\D+/', '', $phone);
        if (str_starts_with($digits, '00')) {
            $digits = substr($digits, 2);
        }

        if (str_starts_with($digits, '237')) {
            return $digits;
        }
        return '237' . $digits;
    }
}

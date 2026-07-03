<?php

namespace App\Services\Contracts;

use App\DTOs\PaymentProviderConfig;
use App\Models\PaymentTransaction;

interface PaymentProviderInterface
{
    /**
     * Injecte la configuration (clés API, environnement).
     */
    public function initialize(PaymentProviderConfig $config): void;

    /**
     * Initie un paiement auprès du provider externe.
     * Retourne un tableau contenant au minimum 'reference' et 'status'.
     */
    public function initiatePayment(PaymentTransaction $transaction, string $phoneNumber): array;

    /**
     * Vérifie le statut d'une transaction existante.
     * Retourne 'completed', 'pending' ou 'failed'.
     */
    public function checkStatus(string $reference): string;

    /**
     * Vérifie la signature HMAC d'un webhook entrant.
     */
    public function verifyWebhook(array $payload, string $signature): bool;
}

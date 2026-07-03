<?php

namespace App\DTOs;

use App\Models\PaymentConfig;

/**
 * Représente la configuration d'un provider de paiement.
 *
 * Source possible :
 *  - config/payment.php (valeur par défaut, vient du .env)
 *  - PaymentConfig Eloquent (override admin optionnel en DB)
 *
 * Les providers (OrangeMoneyProvider, MTNMoneyProvider, StripeProvider)
 * utilisent uniquement ce DTO — ils ne touchent plus jamais l'Eloquent PaymentConfig.
 */
final class PaymentProviderConfig
{
    public function __construct(
        public readonly string $provider,
        public readonly string $apiKey,
        public readonly string $apiSecret,
        public readonly string $webhookSecret,
        public readonly string $environment,
        public readonly bool   $enabled = true,
    ) {}

    /**
     * Construit depuis config/payment.php (source principale — .env).
     */
    public static function fromConfig(string $provider): self
    {
        $config = config("payment.providers.{$provider}");

        if (! $config) {
            throw new \InvalidArgumentException("Provider [{$provider}] non trouvé dans config/payment.php");
        }

        return new self(
            provider: $provider,
            apiKey: $config['api_key']        ?? '',
            apiSecret: $config['api_secret']     ?? '',
            webhookSecret: $config['webhook_secret'] ?? '',
            environment: $config['environment']    ?? config('payment.environment', 'sandbox'),
            enabled: (bool) ($config['enabled'] ?? true),
        );
    }

    /**
     * Construit depuis un override Eloquent PaymentConfig (optionnel).
     * Utilisé uniquement quand un admin a saisi des clés custom en DB.
     */
    public static function fromEloquent(\App\Models\PaymentConfig $model): self
    {
        return new self(
            provider: $model->provider,
            apiKey: $model->api_key        ?? '',
            apiSecret: $model->api_secret     ?? '',
            webhookSecret: $model->webhook_secret ?? '',
            environment: $model->environment    ?? config('payment.environment', 'sandbox'),
            enabled: (bool) $model->is_active,
        );
    }

    public function isProduction(): bool
    {
        return $this->environment === 'production';
    }

    public function isSandbox(): bool
    {
        return $this->environment === 'sandbox';
    }

    public function validate(): void
    {
        if (empty($this->apiKey)) {
            throw new \RuntimeException("Provider [{$this->provider}] : api_key manquant. Vérifiez votre .env.");
        }

        if (empty($this->apiSecret)) {
            throw new \RuntimeException("Provider [{$this->provider}] : api_secret manquant. Vérifiez votre .env.");
        }
    }
}

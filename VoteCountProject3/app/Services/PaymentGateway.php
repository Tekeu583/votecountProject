<?php

namespace App\Services;

use App\DTOs\PaymentProviderConfig;
use App\Models\Organization;
use App\Models\PaymentConfig;
use App\Services\Contracts\PaymentProviderInterface;

/**
 * PaymentGateway — résolution de la configuration provider.
 *
 * Priorité de résolution (du plus au moins prioritaire) :
 *  1. Override DB : PaymentConfig de l'organisation (si présent et actif)
 *  2. Config centrale : config/payment.php (valeurs .env)
 *
 * Cela permet à 99% des organisations d'utiliser les clés plateforme sans
 * aucune configuration, tout en laissant la possibilité à un admin de
 * surcharger pour une organisation spécifique si nécessaire un jour.
 */
class PaymentGateway
{
    /**
     * Retourne une instance du provider initialisée avec la bonne config.
     *
     * @param  string            $provider      'orange_money' | 'mtn_money' | 'stripe'
     * @param  Organization|null $organization  Si fournie, cherche un éventuel override DB
     */
    public function provider(string $provider, ?Organization $organization = null): PaymentProviderInterface
    {
        $config = $this->resolveConfig($provider, $organization);

        if (! $config->enabled) {
            throw new \RuntimeException("Provider [{$provider}] est désactivé.");
        }

        $driverClass = config("payment.providers.{$provider}.driver");

        if (! $driverClass || ! class_exists($driverClass)) {
            throw new \InvalidArgumentException("Driver introuvable pour le provider [{$provider}].");
        }

        /** @var PaymentProviderInterface $instance */
        $instance = app($driverClass);
        $instance->initialize($config);

        return $instance;
    }

    /**
     * Résout la configuration selon la priorité :
     * 1. Override DB de l'organisation (si existant)
     * 2. Config .env (par défaut)
     */
    public function resolveConfig(string $provider, ?Organization $organization = null): PaymentProviderConfig
    {
        // 1. Chercher un éventuel override DB pour cette organisation
        if ($organization) {
            $override = PaymentConfig::where('organization_id', $organization->id)
                ->where('provider', $provider)
                ->where('is_active', true)
                ->first();

            if ($override && ! empty($override->api_key)) {
                return PaymentProviderConfig::fromEloquent($override);
            }
        }

        // 2. Fallback sur la config centrale (.env)
        return PaymentProviderConfig::fromConfig($provider);
    }

    /**
     * Retourne la liste des providers activés.
     */
    public function enabledProviders(): array
    {
        return collect(config('payment.providers'))
            ->filter(fn($cfg) => $cfg['enabled'] ?? true)
            ->keys()
            ->values()
            ->all();
    }
}

<?php

namespace App\Http\Middleware;

use Illuminate\Http\Middleware\TrustProxies as Middleware;
use Illuminate\Http\Request;

class TrustProxies extends Middleware
{
    /**
     * Proxys de confiance.
     *
     * Avec '*', TOUTE valeur d'en-tête X-Forwarded-For était acceptée : un
     * client pouvait donc annoncer l'IP de son choix et usurper son identité
     * réseau — ce qui contourne le rate limiting et fausse la détection de
     * fraude, tous deux indexés sur l'IP.
     *
     * On ne fait désormais confiance qu'aux adresses internes de notre propre
     * chaîne (nginx du VPS → nginx du conteneur → php-fpm). Symfony remonte
     * alors X-Forwarded-For de droite à gauche en ignorant ces proxys : la
     * première IP publique rencontrée est la vraie IP du client, et les
     * valeurs forgées placées à gauche par un attaquant sont ignorées.
     *
     * @var array<int, string>|string|null
     */
    protected $proxies = [
        '127.0.0.1',
        '::1',
        '10.0.0.0/8',
        '172.16.0.0/12',
        '192.168.0.0/16',
    ];

    /**
     * The headers that should be used to detect proxies.
     *
     * @var int
     */
    protected $headers =
        Request::HEADER_X_FORWARDED_FOR |
        Request::HEADER_X_FORWARDED_HOST |
        Request::HEADER_X_FORWARDED_PORT |
        Request::HEADER_X_FORWARDED_PROTO |
        Request::HEADER_X_FORWARDED_AWS_ELB;
}
<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\Route;
use Tests\TestCase;

/**
 * L'IP du client sert de clé au rate limiting ET à la détection de fraude :
 * si elle est fausse, les deux protections s'effondrent.
 *
 * La chaîne réseau en production est : nginx du VPS → nginx du conteneur →
 * php-fpm. Seules ces adresses internes doivent compter comme proxys de
 * confiance.
 *
 * Défaut constaté avec l'ancien `$proxies = '*'` (reproduit par le 3e test) :
 * quand un proxy interne figure dans X-Forwarded-For, Symfony considère toute
 * la chaîne comme fiable et retourne l'IP du PROXY au lieu de celle du
 * visiteur. Tous les utilisateurs partagent alors la même IP — le rate
 * limiting les bloque collectivement et la détection de fraude devient aveugle.
 *
 * Les deux premiers tests documentent le comportement attendu et servent de
 * garde-fou (ils passaient déjà avec l'ancienne configuration).
 */
class TrustProxiesClientIpTest extends TestCase
{
    /** Route de test exposant l'IP telle que Laravel la résout. */
    private const URI = '/_test/client-ip';

    /** IP publique fictive jouant le rôle du visiteur. */
    private const CLIENT_IP = '41.202.207.10';

    /** IP privée jouant le rôle d'un proxy interne (nginx du VPS). */
    private const PROXY_IP = '172.18.0.1';

    /** IP que le client tenterait de s'attribuer lui-même. */
    private const FORGED_IP = '1.2.3.4';

    protected function setUp(): void
    {
        parent::setUp();

        Route::middleware('web')->get(self::URI, fn () => response()->json([
            'ip' => request()->ip(),
        ]));
    }

    /** Simule une requête arrivant depuis le proxy interne (php-fpm en loopback). */
    private function callThroughProxy(string $forwardedFor): \Illuminate\Testing\TestResponse
    {
        return $this->withServerVariables(['REMOTE_ADDR' => '127.0.0.1'])
            ->getJson(self::URI, ['X-Forwarded-For' => $forwardedFor]);
    }

    public function test_l_ip_reelle_est_extraite_derriere_le_proxy(): void
    {
        $this->callThroughProxy(self::CLIENT_IP)
            ->assertOk()
            ->assertJson(['ip' => self::CLIENT_IP]);
    }

    public function test_une_ip_forgee_par_le_client_est_ignoree(): void
    {
        // Le client annonce FORGED_IP ; nginx ajoute sa vraie IP à droite.
        // On doit retenir la vraie IP, pas celle que le client s'est attribuée.
        $response = $this->callThroughProxy(self::FORGED_IP.', '.self::CLIENT_IP);

        $response->assertOk()->assertJson(['ip' => self::CLIENT_IP]);
        $this->assertNotSame(self::FORGED_IP, $response->json('ip'));
    }

    public function test_la_chaine_de_proxys_internes_est_traversee(): void
    {
        // Cas qui échouait avec $proxies = '*' : l'IP du proxy interne était
        // retournée à la place de celle du visiteur.
        $this->callThroughProxy(self::CLIENT_IP.', '.self::PROXY_IP)
            ->assertOk()
            ->assertJson(['ip' => self::CLIENT_IP]);
    }
}

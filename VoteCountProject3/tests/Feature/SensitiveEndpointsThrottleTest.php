<?php

namespace Tests\Feature;

use App\Models\Election;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

/**
 * Go-live : les endpoints sensibles n'avaient que le throttle:api global
 * (60/min). Un voter_code partagé permettait de spammer des OTP aux électeurs
 * jusqu'à épuiser le quota SMTP. Rate limits dédiés ajoutés (2026-07-19).
 */
class SensitiveEndpointsThrottleTest extends TestCase
{
    use RefreshDatabase;

    public function test_verify_access_est_limite_a_6_par_minute(): void
    {
        Queue::fake();
        Election::factory()->create([
            'election_mode' => 'private',
            'voter_code' => 'ABC12345',
        ]);

        $payload = ['voter_code' => 'ABC12345', 'email' => 'x@example.com'];

        // 6 premières requêtes acceptées (throttle:6,1).
        for ($i = 0; $i < 6; $i++) {
            $this->postJson('/api/v1/elections/vote/access/verify', $payload)
                ->assertOk();
        }

        // La 7e est bloquée par le rate limiter.
        $this->postJson('/api/v1/elections/vote/access/verify', $payload)
            ->assertStatus(429);
    }

    public function test_login_est_limite(): void
    {
        $payload = ['email' => 'nobody@example.com', 'password' => 'wrong-password'];

        // throttle:10,1 → la 11e requête est bloquée.
        for ($i = 0; $i < 10; $i++) {
            $this->postJson('/api/v1/auth/login', $payload);
        }

        $this->postJson('/api/v1/auth/login', $payload)
            ->assertStatus(429);
    }
}

<?php

namespace Tests\Feature;

use App\Models\Election;
use App\Models\SecurityAlert;
use App\Models\Vote;
use App\Services\FraudDetectionService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

/**
 * Régression : FraudDetectionService::createSecurityAlert() lisait
 * $vote->elector->user_id sans opérateur null-safe. Pour un vote anonyme
 * (elector_id null), cela levait "Attempt to read property on null" dès que
 * le score de fraude dépassait le seuil d'alerte. Corrigé en $vote->elector?->
 * user_id (2026-07-19).
 */
class FraudAlertNullElectorTest extends TestCase
{
    use RefreshDatabase;

    public function test_alerte_de_fraude_sur_un_vote_anonyme_sans_electeur(): void
    {
        $election = Election::factory()->create(['election_mode' => 'public']);

        // Vote anonyme : elector_id null (cas des votes publics/invités).
        $vote = Vote::create([
            'uuid' => (string) Str::uuid(),
            'election_id' => $election->id,
            'elector_id' => null,
            'ip_address' => '127.0.0.1',
            'browser' => 'TestBrowser',
            'status' => 'completed',
            'idempotency_key' => (string) Str::uuid(),
        ]);

        // Données historiques poussant le score au-delà du seuil d'alerte (0.6)
        // pour forcer l'appel à createSecurityAlert().
        $historicalData = [
            'ip_votes' => 25,      // same_ip → 0.25
            'device_votes' => 15,  // same_device → 0.20
            'time_since_last_vote' => 0, // rapid_voting → 0.30
        ];

        $result = app(FraudDetectionService::class)->analyze($vote, $historicalData);

        // Ne doit PAS crasher, et l'alerte doit être créée avec user_id null.
        $this->assertGreaterThan(0.6, $result['score']);
        $this->assertDatabaseHas('security_alerts', [
            'election_id' => $election->id,
            'elector_id' => null,
            'user_id' => null,
            'type' => 'fraud_detected',
        ]);
    }
}

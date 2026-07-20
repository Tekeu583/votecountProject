<?php

namespace Tests\Feature;

use App\Jobs\SendOtpCode;
use App\Models\Election;
use App\Models\Elector;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

/**
 * Régression : VoteController::verifyAccess() renvoyait "Invalid email" (404)
 * quand l'email n'était pas un électeur inscrit, permettant d'énumérer les
 * emails de la liste électorale à partir d'un voter_code valide (souvent
 * diffusé publiquement). La réponse doit désormais être IDENTIQUE que l'email
 * existe ou non — un OTP n'est réellement envoyé que si l'email correspond à
 * un électeur actif pouvant encore voter (2026-07-19).
 */
class VerifyAccessEnumerationTest extends TestCase
{
    use RefreshDatabase;

    private function privateElection(): Election
    {
        return Election::factory()->create([
            'election_mode' => 'private',
            'voter_code' => 'ABC12345',
            'max_votes_per_user' => 1,
        ]);
    }

    public function test_email_inscrit_et_email_inconnu_donnent_une_reponse_identique(): void
    {
        Queue::fake();
        $election = $this->privateElection();
        Elector::factory()->create([
            'election_id' => $election->id,
            'email' => 'inscrit@example.com',
            'status' => 'active',
        ]);

        $inscrit = $this->postJson('/api/v1/elections/vote/access/verify', [
            'voter_code' => 'ABC12345',
            'email' => 'inscrit@example.com',
        ]);

        $inconnu = $this->postJson('/api/v1/elections/vote/access/verify', [
            'voter_code' => 'ABC12345',
            'email' => 'inconnu@example.com',
        ]);

        // Même statut HTTP, même forme de payload, même message.
        $this->assertSame($inscrit->status(), $inconnu->status());
        $inscrit->assertOk();
        $inconnu->assertOk();
        $this->assertSame($inscrit->json('message'), $inconnu->json('message'));
        $this->assertNotNull($inscrit->json('data.access_token'));
        $this->assertNotNull($inconnu->json('data.access_token'));
        $this->assertSame($election->uuid, $inscrit->json('data.uuid_election'));
        $this->assertSame($election->uuid, $inconnu->json('data.uuid_election'));
    }

    public function test_otp_envoye_seulement_pour_un_electeur_inscrit(): void
    {
        Queue::fake();
        $election = $this->privateElection();
        Elector::factory()->create([
            'election_id' => $election->id,
            'email' => 'inscrit@example.com',
            'status' => 'active',
        ]);

        $this->postJson('/api/v1/elections/vote/access/verify', [
            'voter_code' => 'ABC12345',
            'email' => 'inscrit@example.com',
        ])->assertOk();

        Queue::assertPushed(SendOtpCode::class, 1);
    }

    public function test_aucun_otp_envoye_pour_un_email_inconnu(): void
    {
        Queue::fake();
        $this->privateElection();

        $this->postJson('/api/v1/elections/vote/access/verify', [
            'voter_code' => 'ABC12345',
            'email' => 'inconnu@example.com',
        ])->assertOk();

        Queue::assertNotPushed(SendOtpCode::class);
    }
}

<?php

namespace Tests\Feature;

use App\Models\Candidate;
use App\Models\Election;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * Nouveau dashboard candidat : l'utilisateur connecté doit pouvoir lister
 * SES candidatures, toutes élections confondues — aucun endpoint n'existait
 * (Candidate.user_id existe et est lié automatiquement à la création via
 * CandidateAccountLinkService, mais rien ne l'exposait). Mirroir exact de
 * JuryController::myElections()/ElectionStaffController::myElections().
 */
class CandidateMineTest extends TestCase
{
    use RefreshDatabase;

    public function test_liste_les_candidatures_de_lutilisateur_connecte(): void
    {
        $user = User::factory()->create();
        $election1 = Election::factory()->create(['title' => 'Election A']);
        $election2 = Election::factory()->create(['title' => 'Election B']);

        Candidate::factory()->create(['election_id' => $election1->id, 'user_id' => $user->id]);
        Candidate::factory()->create(['election_id' => $election2->id, 'user_id' => $user->id]);
        Candidate::factory()->create(['election_id' => $election1->id, 'user_id' => null]);

        Sanctum::actingAs($user);
        $response = $this->getJson('/api/v1/candidates/mine');

        $response->assertOk();
        $this->assertCount(2, $response->json('data'));
        $this->assertNotNull($response->json('data.0.election.uuid'));
    }

    public function test_ne_voit_pas_les_candidatures_dun_autre_utilisateur(): void
    {
        $user = User::factory()->create();
        $autre = User::factory()->create();
        $election = Election::factory()->create();
        Candidate::factory()->create(['election_id' => $election->id, 'user_id' => $autre->id]);

        Sanctum::actingAs($user);
        $response = $this->getJson('/api/v1/candidates/mine');

        $response->assertOk();
        $this->assertCount(0, $response->json('data'));
    }

    public function test_liste_vide_sans_candidature(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $response = $this->getJson('/api/v1/candidates/mine');

        $response->assertOk();
        $this->assertCount(0, $response->json('data'));
    }
}

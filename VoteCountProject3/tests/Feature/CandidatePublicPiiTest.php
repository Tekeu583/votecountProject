<?php

namespace Tests\Feature;

use App\Models\Candidate;
use App\Models\Election;
use App\Models\Organization;
use App\Models\User;
use App\Services\RoleService;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * Régression PII : la route publique GET /elections/{election}/candidates
 * exposait l'email de TOUS les candidats (y compris pending/rejected) à
 * n'importe quel visiteur non authentifié — fuite de données personnelles
 * (concours de miss = adresses de jeunes femmes scrapables). La route doit,
 * pour le public, ne renvoyer que les candidats approuvés et sans email ;
 * un gestionnaire authentifié conserve la vue complète (2026-07-19).
 */
class CandidatePublicPiiTest extends TestCase
{
    use RefreshDatabase;

    private function electionWithCandidates(): array
    {
        $election = Election::factory()->create(['election_mode' => 'public']);
        $approved = Candidate::factory()->create([
            'election_id' => $election->id,
            'email' => 'approuve@example.com',
            'status' => 'approved',
        ]);
        $pending = Candidate::factory()->create([
            'election_id' => $election->id,
            'email' => 'attente@example.com',
            'status' => 'pending',
        ]);

        return [$election, $approved, $pending];
    }

    public function test_visiteur_public_ne_voit_que_les_approuves_sans_email(): void
    {
        [$election, $approved] = $this->electionWithCandidates();

        $response = $this->getJson("/api/v1/elections/{$election->uuid}/candidates");

        $response->assertOk();
        $data = collect($response->json('data'));

        // Un seul candidat visible (l'approuvé), le pending est masqué.
        $this->assertSame(1, $data->count());
        $this->assertSame($approved->uuid, $data->first()['uuid']);

        // Aucun email exposé publiquement.
        $this->assertArrayNotHasKey('email', $data->first());
        $this->assertStringNotContainsString('approuve@example.com', $response->getContent());
        $this->assertStringNotContainsString('attente@example.com', $response->getContent());
    }

    public function test_gestionnaire_authentifie_voit_tout_avec_email(): void
    {
        $this->seed(RolesAndPermissionsSeeder::class);

        $owner = User::factory()->create();
        $org = Organization::factory()->create(['owner_user_id' => $owner->id]);
        $org->users()->attach($owner->id, ['role_slug' => 'owner', 'status' => 'active', 'joined_at' => now()]);
        RoleService::assignRoleToUser($owner, 'organization_owner');

        $election = Election::factory()->create([
            'organization_id' => $org->id,
            'created_by' => $owner->id,
            'election_mode' => 'public',
        ]);
        Candidate::factory()->create(['election_id' => $election->id, 'email' => 'a@example.com', 'status' => 'approved']);
        Candidate::factory()->create(['election_id' => $election->id, 'email' => 'p@example.com', 'status' => 'pending']);

        Sanctum::actingAs($owner);
        $response = $this->getJson("/api/v1/elections/{$election->uuid}/candidates?status=pending");

        $response->assertOk();
        $data = collect($response->json('data'));
        $this->assertSame(1, $data->count());
        $this->assertSame('pending', $data->first()['status']);
        $this->assertSame('p@example.com', $data->first()['email']);
    }
}

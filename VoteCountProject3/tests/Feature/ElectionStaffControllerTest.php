<?php

namespace Tests\Feature;

use App\Models\Election;
use App\Models\Organization;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * Nouvel onglet "Équipe" : affectation de gestionnaires (manager) et
 * observateurs (observer) à une élection précise, par email (compte déjà
 * existant obligatoire) — même mécanisme que le jury (election_user pivot),
 * mais sans restriction de vote_type (contrairement au jury, réservé aux
 * élections pondérées).
 */
class ElectionStaffControllerTest extends TestCase
{
    use RefreshDatabase;

    private function createOwnerWithElection(): array
    {
        $owner = User::factory()->create();
        $org = Organization::factory()->create(['owner_user_id' => $owner->id]);
        $election = Election::factory()->create([
            'organization_id' => $org->id,
            'created_by' => $owner->id,
        ]);

        return [$owner, $election];
    }

    public function test_affecte_un_gestionnaire_par_email(): void
    {
        [$owner, $election] = $this->createOwnerWithElection();
        $manager = User::factory()->create(['email' => 'gestionnaire@example.com']);
        Sanctum::actingAs($owner);

        $response = $this->postJson("/api/v1/elections/{$election->uuid}/staff", [
            'email' => 'gestionnaire@example.com',
            'role' => 'manager',
        ]);

        $response->assertOk();
        $this->assertDatabaseHas('election_user', [
            'election_id' => $election->id,
            'user_id' => $manager->id,
            'role_slug' => 'manager',
        ]);
    }

    public function test_affecte_un_observateur_par_email(): void
    {
        [$owner, $election] = $this->createOwnerWithElection();
        User::factory()->create(['email' => 'observateur@example.com']);
        Sanctum::actingAs($owner);

        $response = $this->postJson("/api/v1/elections/{$election->uuid}/staff", [
            'email' => 'observateur@example.com',
            'role' => 'observer',
        ]);

        $response->assertOk();
        $this->assertDatabaseHas('election_user', [
            'election_id' => $election->id,
            'role_slug' => 'observer',
        ]);
    }

    public function test_refuse_un_email_sans_compte(): void
    {
        [$owner, $election] = $this->createOwnerWithElection();
        Sanctum::actingAs($owner);

        $response = $this->postJson("/api/v1/elections/{$election->uuid}/staff", [
            'email' => 'inconnu@example.com',
            'role' => 'manager',
        ]);

        $response->assertStatus(404);
    }

    public function test_refuse_une_double_affectation(): void
    {
        [$owner, $election] = $this->createOwnerWithElection();
        $manager = User::factory()->create(['email' => 'gestionnaire@example.com']);
        Sanctum::actingAs($owner);

        $this->postJson("/api/v1/elections/{$election->uuid}/staff", [
            'email' => 'gestionnaire@example.com',
            'role' => 'manager',
        ])->assertOk();

        $response = $this->postJson("/api/v1/elections/{$election->uuid}/staff", [
            'email' => 'gestionnaire@example.com',
            'role' => 'observer',
        ]);

        $response->assertStatus(422);
        // Régression : le message doit préciser le rôle déjà occupé (ex.
        // "gestionnaire"), pas juste dire "déjà affecté" sans plus de
        // détail — sinon on croit à tort qu'il n'a AUCUN rôle sur l'élection.
        $response->assertJsonFragment(['message' => "Cet utilisateur a déjà un rôle sur cette élection (gestionnaire). Un utilisateur ne peut avoir qu'un seul rôle par élection."]);
    }

    public function test_refuse_laffectation_dun_candidat_comme_staff(): void
    {
        [$owner, $election] = $this->createOwnerWithElection();
        $candidat = User::factory()->create(['email' => 'candidat@example.com']);
        Sanctum::actingAs($owner);
        app(\App\Services\ElectionService::class)->addManager($election, $candidat, 'candidat');

        $response = $this->postJson("/api/v1/elections/{$election->uuid}/staff", [
            'email' => 'candidat@example.com',
            'role' => 'manager',
        ]);

        $response->assertStatus(422);
        $response->assertJsonFragment(['message' => "Cet utilisateur a déjà un rôle sur cette élection (candidat). Un utilisateur ne peut avoir qu'un seul rôle par élection."]);
    }

    public function test_liste_le_staff_avec_son_role(): void
    {
        [$owner, $election] = $this->createOwnerWithElection();
        User::factory()->create(['email' => 'manager@example.com']);
        User::factory()->create(['email' => 'observer@example.com']);
        Sanctum::actingAs($owner);

        $this->postJson("/api/v1/elections/{$election->uuid}/staff", ['email' => 'manager@example.com', 'role' => 'manager']);
        $this->postJson("/api/v1/elections/{$election->uuid}/staff", ['email' => 'observer@example.com', 'role' => 'observer']);

        $response = $this->getJson("/api/v1/elections/{$election->uuid}/staff");
        $response->assertOk();
        $this->assertCount(2, $response->json('data'));

        $onlyManagers = $this->getJson("/api/v1/elections/{$election->uuid}/staff?role=manager");
        $this->assertCount(1, $onlyManagers->json('data'));
        $this->assertEquals('manager', $onlyManagers->json('data.0.role_slug'));
    }

    public function test_retire_un_membre_du_staff(): void
    {
        [$owner, $election] = $this->createOwnerWithElection();
        $manager = User::factory()->create(['email' => 'gestionnaire@example.com']);
        Sanctum::actingAs($owner);

        $this->postJson("/api/v1/elections/{$election->uuid}/staff", [
            'email' => 'gestionnaire@example.com',
            'role' => 'manager',
        ]);

        $response = $this->deleteJson("/api/v1/elections/{$election->uuid}/staff/{$manager->uuid}");

        $response->assertOk();
        $this->assertDatabaseMissing('election_user', [
            'election_id' => $election->id,
            'user_id' => $manager->id,
        ]);
    }

    public function test_refuse_un_utilisateur_non_autorise(): void
    {
        [, $election] = $this->createOwnerWithElection();
        $stranger = User::factory()->create();
        User::factory()->create(['email' => 'gestionnaire@example.com']);
        Sanctum::actingAs($stranger);

        $response = $this->postJson("/api/v1/elections/{$election->uuid}/staff", [
            'email' => 'gestionnaire@example.com',
            'role' => 'manager',
        ]);

        $response->assertStatus(403);
    }
}

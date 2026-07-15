<?php

namespace Tests\Feature;

use App\Models\Organization;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * Nouvel onglet "Équipe" : gestion des membres de l'organisation
 * (organization_user pivot). addUser() cherchait par uuid — remplacé par une
 * recherche par email pour la cohérence avec le reste de l'app (jury, staff
 * d'élection), et listUsers()/updateUserRole() branchent enfin des méthodes
 * de OrganizationService/OrganizationPolicy qui existaient déjà mais
 * n'étaient appelées par aucune route.
 */
class OrganizationUsersTest extends TestCase
{
    use RefreshDatabase;

    public function test_ajoute_un_membre_par_email(): void
    {
        $owner = User::factory()->create();
        $org = Organization::factory()->create(['owner_user_id' => $owner->id]);
        $member = User::factory()->create(['email' => 'membre@example.com']);
        Sanctum::actingAs($owner);

        $response = $this->postJson("/api/v1/organizations/{$org->uuid}/users", [
            'email' => 'membre@example.com',
            'role' => 'member',
        ]);

        $response->assertOk();
        $this->assertDatabaseHas('organization_user', [
            'organization_id' => $org->id,
            'user_id' => $member->id,
            'role_slug' => 'member',
        ]);
    }

    public function test_refuse_un_email_sans_compte(): void
    {
        $owner = User::factory()->create();
        $org = Organization::factory()->create(['owner_user_id' => $owner->id]);
        Sanctum::actingAs($owner);

        $response = $this->postJson("/api/v1/organizations/{$org->uuid}/users", [
            'email' => 'inconnu@example.com',
            'role' => 'member',
        ]);

        $response->assertStatus(404);
    }

    public function test_liste_les_membres_avec_leur_role(): void
    {
        $owner = User::factory()->create();
        $org = Organization::factory()->create(['owner_user_id' => $owner->id]);
        $member = User::factory()->create(['email' => 'membre@example.com']);
        Sanctum::actingAs($owner);

        $this->postJson("/api/v1/organizations/{$org->uuid}/users", [
            'email' => 'membre@example.com',
            'role' => 'admin',
        ]);

        $response = $this->getJson("/api/v1/organizations/{$org->uuid}/users");

        $response->assertOk();
        $this->assertCount(1, $response->json('data'));
        $this->assertEquals($member->email, $response->json('data.0.email'));
        $this->assertEquals('admin', $response->json('data.0.role_slug'));
    }

    public function test_change_le_role_dun_membre(): void
    {
        $owner = User::factory()->create();
        $org = Organization::factory()->create(['owner_user_id' => $owner->id]);
        $member = User::factory()->create(['email' => 'membre@example.com']);
        Sanctum::actingAs($owner);

        $this->postJson("/api/v1/organizations/{$org->uuid}/users", [
            'email' => 'membre@example.com',
            'role' => 'viewer',
        ]);

        $response = $this->patchJson("/api/v1/organizations/{$org->uuid}/users/{$member->uuid}", [
            'role' => 'admin',
        ]);

        $response->assertOk();
        $this->assertDatabaseHas('organization_user', [
            'organization_id' => $org->id,
            'user_id' => $member->id,
            'role_slug' => 'admin',
        ]);
    }

    public function test_ne_peut_pas_changer_le_role_du_owner(): void
    {
        $owner = User::factory()->create();
        $org = Organization::factory()->create(['owner_user_id' => $owner->id]);
        Sanctum::actingAs($owner);

        $response = $this->patchJson("/api/v1/organizations/{$org->uuid}/users/{$owner->uuid}", [
            'role' => 'admin',
        ]);

        $response->assertStatus(400);
    }

    public function test_ne_peut_pas_retirer_le_owner(): void
    {
        $owner = User::factory()->create();
        $org = Organization::factory()->create(['owner_user_id' => $owner->id]);
        Sanctum::actingAs($owner);

        $response = $this->deleteJson("/api/v1/organizations/{$org->uuid}/users/{$owner->uuid}");

        $response->assertStatus(400);
    }
}

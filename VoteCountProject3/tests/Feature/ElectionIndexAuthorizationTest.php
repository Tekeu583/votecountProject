<?php

namespace Tests\Feature;

use App\Models\Election;
use App\Models\Organization;
use App\Models\User;
use App\Services\RoleService;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * Défense en profondeur : ElectionController::index() n'appelait aucun
 * authorize('viewAny'). Le scoping par organisation existait déjà dans le
 * repository, mais l'autorisation explicite manquait — ajoutée pour la
 * cohérence avec le reste du contrôleur (2026-07-19).
 */
class ElectionIndexAuthorizationTest extends TestCase
{
    use RefreshDatabase;

    public function test_un_owner_ne_voit_que_les_elections_de_ses_organisations(): void
    {
        $this->seed(RolesAndPermissionsSeeder::class);

        $owner = User::factory()->create();
        $org = Organization::factory()->create(['owner_user_id' => $owner->id]);
        $org->users()->attach($owner->id, ['role_slug' => 'owner', 'status' => 'active', 'joined_at' => now()]);
        RoleService::assignRoleToUser($owner, 'organization_owner');

        $mienne = Election::factory()->create(['organization_id' => $org->id]);
        $autreOrg = Organization::factory()->create();
        Election::factory()->create(['organization_id' => $autreOrg->id]);

        Sanctum::actingAs($owner);
        $response = $this->getJson('/api/v1/elections');

        $response->assertOk();
        $uuids = collect($response->json('data'))->pluck('uuid');
        $this->assertTrue($uuids->contains($mienne->uuid));
        $this->assertSame(1, $uuids->count(), "L'owner ne doit voir que sa propre élection.");
    }

    public function test_un_utilisateur_sans_permission_view_elections_est_refuse(): void
    {
        // On ne seed PAS les rôles : l'utilisateur n'a aucune permission.
        $user = User::factory()->create();
        Election::factory()->create();

        Sanctum::actingAs($user);
        $response = $this->getJson('/api/v1/elections');

        $response->assertStatus(403);
    }
}

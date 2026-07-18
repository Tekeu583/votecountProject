<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Election;
use App\Models\Organization;
use App\Models\User;
use App\Services\RoleService;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * Régression : ElectionPolicy::update()/delete()/manageCandidates()/
 * manageElectors()/scoreCandidates() retombaient sur une permission Spatie
 * globale ('edit elections', 'delete elections'...) quand aucune des
 * vérifications creator/organisation/pivot ne passait. Comme organization_owner
 * possède ces permissions pour TOUTES les organisations (pas seulement la
 * sienne), n'importe quel propriétaire pouvait modifier/supprimer les
 * élections — et donc les catégories, candidats, électeurs — d'une
 * organisation tierce. Trouvé en écrivant ce test pour le nouvel endpoint
 * PUT elections/{election}/categories/{category} (2026-07-18).
 */
class ElectionCategoryCrossOrgAuthorizationTest extends TestCase
{
    use RefreshDatabase;

    private function makeOwner(Organization $organization): User
    {
        $this->seed(RolesAndPermissionsSeeder::class);
        $user = User::factory()->create();
        $organization->update(['owner_user_id' => $user->id]);
        $organization->users()->attach($user->id, [
            'role_slug' => 'owner',
            'status' => 'active',
            'joined_at' => now(),
        ]);
        RoleService::assignRoleToUser($user, 'organization_owner');

        return $user;
    }

    public function test_owner_peut_renommer_une_categorie_de_son_election(): void
    {
        $org = Organization::factory()->create();
        $owner = $this->makeOwner($org);
        $election = Election::factory()->create(['organization_id' => $org->id, 'has_categories' => true]);
        $category = Category::create([
            'uuid' => (string) Str::uuid(),
            'election_id' => $election->id,
            'name' => 'Ancien nom',
            'slug' => 'ancien-nom',
            'status' => 'active',
        ]);

        Sanctum::actingAs($owner);

        $response = $this->putJson("/api/v1/elections/{$election->uuid}/categories/{$category->uuid}", [
            'name' => 'Nouveau nom',
        ]);

        $response->assertOk();
        $this->assertEquals('Nouveau nom', $category->fresh()->name);
    }

    public function test_owner_dune_autre_organisation_ne_peut_pas_modifier(): void
    {
        $org = Organization::factory()->create();
        Organization::factory()->create();
        $otherOrg = Organization::factory()->create();
        $otherOwner = $this->makeOwner($otherOrg);

        $election = Election::factory()->create(['organization_id' => $org->id, 'has_categories' => true]);
        $category = Category::create([
            'uuid' => (string) Str::uuid(),
            'election_id' => $election->id,
            'name' => 'Ancien nom',
            'slug' => 'ancien-nom-2',
            'status' => 'active',
        ]);

        Sanctum::actingAs($otherOwner);

        $response = $this->putJson("/api/v1/elections/{$election->uuid}/categories/{$category->uuid}", [
            'name' => 'Hack',
        ]);

        $response->assertStatus(403);
        $this->assertEquals('Ancien nom', $category->fresh()->name);
    }
}

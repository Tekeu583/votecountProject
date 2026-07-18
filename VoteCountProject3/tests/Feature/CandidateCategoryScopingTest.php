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
 * Régression : category_id (CreateCandidateRequest) vérifiait seulement que
 * la catégorie EXISTE quelque part sur la plateforme, jamais qu'elle
 * appartient à L'ÉLECTION du candidat créé. Un candidat pouvait donc être
 * assigné à une catégorie d'une élection totalement différente. Trouvé en
 * rendant election_id obligatoire sur Category (plus de catégorie globale) —
 * cette validation devait de toute façon être resserrée pour rester cohérente
 * (2026-07-18).
 */
class CandidateCategoryScopingTest extends TestCase
{
    use RefreshDatabase;

    private function actingOwner(Organization $organization): User
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
        Sanctum::actingAs($user);

        return $user;
    }

    public function test_categorie_dune_autre_election_est_refusee(): void
    {
        $org = Organization::factory()->create();
        $this->actingOwner($org);

        $election = Election::factory()->create(['organization_id' => $org->id, 'has_categories' => true]);
        $autreElection = Election::factory()->create(['organization_id' => $org->id, 'has_categories' => true]);

        $categorieAutreElection = Category::create([
            'uuid' => (string) Str::uuid(),
            'election_id' => $autreElection->id,
            'name' => 'Catégorie étrangère',
            'slug' => 'categorie-etrangere',
            'status' => 'active',
        ]);

        $response = $this->postJson("/api/v1/elections/{$election->uuid}/candidates", [
            'full_name' => 'Jean Test',
            'category_id' => $categorieAutreElection->uuid,
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors('category_id');
    }

    public function test_categorie_de_la_meme_election_est_acceptee(): void
    {
        $org = Organization::factory()->create();
        $this->actingOwner($org);

        $election = Election::factory()->create(['organization_id' => $org->id, 'has_categories' => true]);

        $categorie = Category::create([
            'uuid' => (string) Str::uuid(),
            'election_id' => $election->id,
            'name' => 'Bonne catégorie',
            'slug' => 'bonne-categorie',
            'status' => 'active',
        ]);

        $response = $this->postJson("/api/v1/elections/{$election->uuid}/candidates", [
            'full_name' => 'Jean Test',
            'email' => 'jean.test@example.com',
            'category_id' => $categorie->uuid,
        ]);

        $response->assertCreated();
        $this->assertDatabaseHas('candidates', [
            'full_name' => 'Jean Test',
            'category_id' => $categorie->id,
        ]);
    }
}

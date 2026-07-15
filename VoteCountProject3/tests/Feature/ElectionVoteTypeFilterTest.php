<?php

namespace Tests\Feature;

use App\Enums\VoteType;
use App\Models\Election;
use App\Models\Organization;
use App\Models\User;
use App\Services\RoleService;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * Régression : le jury n'a de sens que pour les élections à vote pondéré
 * (weighted) — le sélecteur d'élections de Jurys.jsx/JuryModal.jsx doit
 * donc pouvoir filtrer côté serveur via ?vote_type=weighted plutôt que de
 * proposer toutes les élections de l'organisation.
 */
class ElectionVoteTypeFilterTest extends TestCase
{
    use RefreshDatabase;

    public function test_filtre_les_elections_par_vote_type(): void
    {
        $this->seed(RolesAndPermissionsSeeder::class);
        $user = User::factory()->create();
        RoleService::assignRoleToUser($user, 'organization_owner');
        Sanctum::actingAs($user);

        $org = Organization::factory()->create(['owner_user_id' => $user->id]);
        $user->organizations()->attach($org->id, ['role_slug' => 'owner', 'joined_at' => now()]);
        Election::factory()->create(['organization_id' => $org->id, 'vote_type' => VoteType::WEIGHTED]);
        Election::factory()->create(['organization_id' => $org->id, 'vote_type' => VoteType::SINGLE]);
        Election::factory()->create(['organization_id' => $org->id, 'vote_type' => VoteType::MULTIPLE]);

        $response = $this->getJson('/api/v1/elections?vote_type=weighted');

        $response->assertOk();
        $this->assertCount(1, $response->json('data'));
        $this->assertEquals('weighted', $response->json('data.0.vote_type'));
    }
}

<?php

namespace Tests\Feature;

use App\Models\Election;
use App\Models\User;
use App\Services\ElectionService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * Régression : le rôle "jury" est contextuel (election_user.role_slug),
 * jamais synchronisé avec les rôles globaux Spatie (user.roles) —
 * ElectionService::addManager() n'assigne aucun rôle Spatie. Sans exposer
 * ces rôles contextuels dans /me, le frontend n'a aucun moyen de savoir
 * qu'un utilisateur est juré, et le bloque à tort à l'accès de /jury.
 */
class UserResourceElectionRolesTest extends TestCase
{
    use RefreshDatabase;

    public function test_me_expose_les_roles_contextuels_delection_de_lutilisateur(): void
    {
        $election = Election::factory()->create();
        $jury = User::factory()->create();

        Sanctum::actingAs($jury);
        app(ElectionService::class)->addManager($election, $jury, 'jury');

        $response = $this->getJson('/api/v1/auth/me');

        $response->assertOk();
        $elections = $response->json('data.elections');

        $this->assertCount(1, $elections);
        $this->assertEquals($election->uuid, $elections[0]['uuid']);
        $this->assertEquals('jury', $elections[0]['role']);
    }

    public function test_me_expose_un_tableau_elections_vide_pour_un_utilisateur_sans_affectation(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $response = $this->getJson('/api/v1/auth/me');

        $response->assertOk();
        $this->assertEquals([], $response->json('data.elections'));
    }
}

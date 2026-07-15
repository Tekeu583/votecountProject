<?php

namespace Tests\Feature;

use App\Models\Election;
use App\Models\User;
use App\Services\ElectionService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * Nouveau dashboard "gestionnaire d'élection" (manager) : l'utilisateur doit
 * pouvoir lister les élections où il a role_slug='manager' (election_user).
 * electionsApi.getAll() ne suffit pas ici — il scope par organisations dont
 * l'utilisateur est MEMBRE, pas par affectation de staff — même raison qui a
 * motivé JuryController::myElections() (mirroir exact ici).
 */
class ManagerElectionsTest extends TestCase
{
    use RefreshDatabase;

    public function test_liste_les_elections_ou_lutilisateur_est_gestionnaire(): void
    {
        $manager = User::factory()->create();
        $election1 = Election::factory()->create(['title' => 'Election A']);
        $election2 = Election::factory()->create(['title' => 'Election B']);
        $autre = Election::factory()->create(['title' => 'Election C']);

        Sanctum::actingAs(User::factory()->create());
        app(ElectionService::class)->addManager($election1, $manager, 'manager');
        app(ElectionService::class)->addManager($election2, $manager, 'manager');

        Sanctum::actingAs($manager);
        $response = $this->getJson('/api/v1/manager/elections');

        $response->assertOk();
        $uuids = collect($response->json('data'))->pluck('uuid');
        $this->assertCount(2, $uuids);
        $this->assertTrue($uuids->contains($election1->uuid));
        $this->assertTrue($uuids->contains($election2->uuid));
        $this->assertFalse($uuids->contains($autre->uuid));
    }

    public function test_ne_confond_pas_avec_un_autre_role_sur_la_meme_election(): void
    {
        $jury = User::factory()->create();
        $election = Election::factory()->create();
        Sanctum::actingAs(User::factory()->create());
        app(ElectionService::class)->addManager($election, $jury, 'jury');

        Sanctum::actingAs($jury);
        $response = $this->getJson('/api/v1/manager/elections');

        $response->assertOk();
        $this->assertCount(0, $response->json('data'));
    }

    public function test_retourne_une_liste_vide_sans_affectation(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $response = $this->getJson('/api/v1/manager/elections');

        $response->assertOk();
        $this->assertCount(0, $response->json('data'));
    }
}

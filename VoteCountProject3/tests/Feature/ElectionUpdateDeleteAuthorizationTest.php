<?php

namespace Tests\Feature;

use App\Models\Election;
use App\Models\Organization;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * Régression : ElectionController::update()/destroy() n'appelaient aucun
 * $this->authorize() — contrairement à updateDraft()/addManager() — donc
 * n'importe quel utilisateur authentifié pouvait modifier/supprimer
 * n'importe quelle élection de la plateforme. Corrigé en réutilisant
 * ElectionPolicy::update()/delete() (déjà existantes, déjà utilisées
 * ailleurs). destroy() gagne aussi une règle métier : impossible de
 * supprimer une élection ayant déjà reçu des votes.
 */
class ElectionUpdateDeleteAuthorizationTest extends TestCase
{
    use RefreshDatabase;

    private function createOwnerWithElection(array $electionAttrs = []): array
    {
        $owner = User::factory()->create();
        $org = Organization::factory()->create(['owner_user_id' => $owner->id]);
        $election = Election::factory()->create(array_merge([
            'organization_id' => $org->id,
            'created_by' => $owner->id,
        ], $electionAttrs));

        return [$owner, $election];
    }

    public function test_un_tiers_ne_peut_pas_modifier_une_election(): void
    {
        [, $election] = $this->createOwnerWithElection();
        $stranger = User::factory()->create();
        Sanctum::actingAs($stranger);

        $response = $this->putJson("/api/v1/elections/{$election->uuid}", ['title' => 'Piraté']);

        $response->assertStatus(403);
        $this->assertNotEquals('Piraté', $election->fresh()->title);
    }

    public function test_un_tiers_ne_peut_pas_supprimer_une_election(): void
    {
        [, $election] = $this->createOwnerWithElection(['total_votes' => 0]);
        $stranger = User::factory()->create();
        Sanctum::actingAs($stranger);

        $response = $this->deleteJson("/api/v1/elections/{$election->uuid}");

        $response->assertStatus(403);
        $this->assertDatabaseHas('elections', ['id' => $election->id, 'deleted_at' => null]);
    }

    public function test_le_owner_peut_modifier_lelection(): void
    {
        [$owner, $election] = $this->createOwnerWithElection();
        Sanctum::actingAs($owner);

        $response = $this->putJson("/api/v1/elections/{$election->uuid}", ['title' => 'Nouveau titre']);

        $response->assertOk();
        $this->assertEquals('Nouveau titre', $election->fresh()->title);
    }

    public function test_supprime_une_election_sans_vote(): void
    {
        [$owner, $election] = $this->createOwnerWithElection(['total_votes' => 0]);
        Sanctum::actingAs($owner);

        $response = $this->deleteJson("/api/v1/elections/{$election->uuid}");

        $response->assertNoContent();
        $this->assertSoftDeleted('elections', ['id' => $election->id]);
    }

    public function test_refuse_de_supprimer_une_election_avec_des_votes(): void
    {
        [$owner, $election] = $this->createOwnerWithElection(['total_votes' => 5]);
        Sanctum::actingAs($owner);

        $response = $this->deleteJson("/api/v1/elections/{$election->uuid}");

        $response->assertStatus(422);
        $this->assertDatabaseHas('elections', ['id' => $election->id, 'deleted_at' => null]);
    }

    /**
     * Régression : une élection 'ongoing' était TOUJOURS considérée non
     * modifiable (ElectionStatus::isEditable() ne liste que
     * draft/pending/published) — même sans aucun vote reçu, où rien ne
     * serait pourtant invalidé par une modification.
     */
    public function test_le_owner_peut_modifier_une_election_en_cours_sans_vote(): void
    {
        [$owner, $election] = $this->createOwnerWithElection(['status' => 'ongoing', 'total_votes' => 0]);
        Sanctum::actingAs($owner);

        $response = $this->putJson("/api/v1/elections/{$election->uuid}", ['title' => 'Titre mis à jour en cours']);

        $response->assertOk();
        $this->assertEquals('Titre mis à jour en cours', $election->fresh()->title);
    }

    public function test_refuse_de_modifier_une_election_en_cours_avec_des_votes(): void
    {
        [$owner, $election] = $this->createOwnerWithElection(['status' => 'ongoing', 'total_votes' => 3]);
        Sanctum::actingAs($owner);

        $response = $this->putJson("/api/v1/elections/{$election->uuid}", ['title' => 'Tentative']);

        $response->assertStatus(400);
        $this->assertNotEquals('Tentative', $election->fresh()->title);
    }

    /**
     * Le formulaire d'édition renvoie toujours start_at (même non modifié)
     * — pour une élection en cours il est nécessairement dans le passé,
     * la règle "after:now" ne doit donc pas s'appliquer dans ce cas.
     */
    public function test_reenvoyer_lancien_start_at_dune_election_en_cours_ne_bloque_pas(): void
    {
        [$owner, $election] = $this->createOwnerWithElection([
            'status' => 'ongoing',
            'total_votes' => 0,
            'start_at' => now()->subHours(2),
            'end_at' => now()->addDays(3),
        ]);
        Sanctum::actingAs($owner);

        $response = $this->putJson("/api/v1/elections/{$election->uuid}", [
            'title' => 'Titre mis à jour',
            'start_at' => $election->start_at->toIso8601String(),
            'end_at' => now()->addDays(5)->toIso8601String(),
        ]);

        $response->assertOk();
    }

    public function test_une_election_publiee_pas_encore_demarree_exige_toujours_un_start_at_futur(): void
    {
        [$owner, $election] = $this->createOwnerWithElection(['status' => 'published']);
        Sanctum::actingAs($owner);

        $response = $this->putJson("/api/v1/elections/{$election->uuid}", [
            'start_at' => now()->subDay()->toIso8601String(),
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors('start_at');
    }
}

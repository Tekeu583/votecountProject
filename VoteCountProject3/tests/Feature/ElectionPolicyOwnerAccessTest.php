<?php

namespace Tests\Feature;

use App\Models\Election;
use App\Models\Organization;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * Régression : ElectionService::create() n'attache JAMAIS le créateur ni le
 * propriétaire de l'organisation à election_user — aucune ligne pivot pour
 * eux. update()/delete() le savent déjà (raccourci direct sur created_by /
 * organization.owner_user_id), mais manageCandidates()/manageElectors()/
 * scoreCandidates() ne vérifiaient QUE le pivot ou une permission Spatie —
 * un simple organization_owner qui crée sa propre élection se faisait donc
 * refuser la gestion de ses propres candidats/électeurs/critères de jury.
 *
 * Trouvé en testant manuellement le nouvel écran de critères de jury
 * (JuryCriteriaManager.jsx) : POST jury-criteria (ability 'update', déjà
 * correcte) réussissait, mais GET jury-criteria (ability 'scoreCandidates')
 * échouait en 403 pour ce même utilisateur sur sa propre élection.
 */
class ElectionPolicyOwnerAccessTest extends TestCase
{
    use RefreshDatabase;

    public function test_le_createur_sans_pivot_peut_gerer_les_criteres_de_jury(): void
    {
        $creator = User::factory()->create();
        $election = Election::factory()->create([
            'created_by' => $creator->id,
            'vote_type' => 'weighted',
        ]);
        Sanctum::actingAs($creator);

        $store = $this->postJson("/api/v1/elections/{$election->uuid}/jury-criteria", [
            'name' => 'Qualité',
            'weight' => 2,
            'max_score' => 10,
        ]);
        $store->assertCreated();

        $index = $this->getJson("/api/v1/elections/{$election->uuid}/jury-criteria");
        $index->assertOk();
        $this->assertCount(1, $index->json('data'));
    }

    public function test_le_proprietaire_dorganisation_sans_pivot_peut_gerer_les_criteres_de_jury(): void
    {
        $owner = User::factory()->create();
        $createur = User::factory()->create();
        $org = Organization::factory()->create(['owner_user_id' => $owner->id]);
        $election = Election::factory()->create([
            'organization_id' => $org->id,
            'created_by' => $createur->id,
            'vote_type' => 'weighted',
        ]);
        Sanctum::actingAs($owner);

        $response = $this->getJson("/api/v1/elections/{$election->uuid}/jury-criteria");

        $response->assertOk();
    }

    public function test_un_tiers_sans_pivot_ni_permission_est_toujours_refuse(): void
    {
        $stranger = User::factory()->create();
        $election = Election::factory()->create(['vote_type' => 'weighted']);
        Sanctum::actingAs($stranger);

        $response = $this->getJson("/api/v1/elections/{$election->uuid}/jury-criteria");

        $response->assertStatus(403);
    }
}

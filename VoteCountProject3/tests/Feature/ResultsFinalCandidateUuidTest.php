<?php

namespace Tests\Feature;

use App\Enums\ElectionStatus;
use App\Models\Candidate;
use App\Models\Election;
use App\Models\Organization;
use App\Models\ResultSnapshot;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * Régression : "Top 3 candidats" du DashboardHome (et le tableau de
 * Resultats.jsx) affichaient "—" au lieu du nom quand le résultat provient
 * d'un snapshot calculé AVANT l'ajout de candidate_uuid au job de calcul —
 * ces vieux snapshots n'ont que candidate_id, et le frontend fait le
 * rapprochement candidat/résultat via candidate_uuid.
 *
 * Corrigé en résolvant candidate_uuid depuis candidate_id à la lecture
 * (ResultController::final()), plutôt que de dépendre d'un recalcul manuel
 * de chaque élection historique.
 */
class ResultsFinalCandidateUuidTest extends TestCase
{
    use RefreshDatabase;

    public function test_resout_candidate_uuid_pour_un_ancien_snapshot(): void
    {
        $owner = User::factory()->create();
        $org = Organization::factory()->create(['owner_user_id' => $owner->id]);
        $election = Election::factory()->create([
            'organization_id' => $org->id,
            'created_by' => $owner->id,
            'status' => ElectionStatus::CLOSED,
        ]);
        $candidate = Candidate::factory()->create(['election_id' => $election->id, 'status' => 'approved']);

        // Snapshot "ancien format" : pas de candidate_uuid, seulement candidate_id.
        ResultSnapshot::create([
            'election_id' => $election->id,
            'snapshot' => [
                'results' => [
                    ['candidate_id' => $candidate->id, 'total_votes' => 5, 'percentage' => 100],
                ],
            ],
            'created_at' => now(),
        ]);

        Sanctum::actingAs($owner);
        $response = $this->getJson("/api/v1/elections/{$election->uuid}/results/final");

        $response->assertOk();
        $this->assertEquals($candidate->uuid, $response->json('data.results.0.candidate_uuid'));
    }

    public function test_ne_touche_pas_a_un_snapshot_recent_avec_candidate_uuid(): void
    {
        $owner = User::factory()->create();
        $org = Organization::factory()->create(['owner_user_id' => $owner->id]);
        $election = Election::factory()->create([
            'organization_id' => $org->id,
            'created_by' => $owner->id,
            'status' => ElectionStatus::CLOSED,
        ]);
        $candidate = Candidate::factory()->create(['election_id' => $election->id, 'status' => 'approved']);

        ResultSnapshot::create([
            'election_id' => $election->id,
            'snapshot' => [
                'results' => [
                    ['candidate_id' => $candidate->id, 'candidate_uuid' => $candidate->uuid, 'total_votes' => 5, 'percentage' => 100],
                ],
            ],
            'created_at' => now(),
        ]);

        Sanctum::actingAs($owner);
        $response = $this->getJson("/api/v1/elections/{$election->uuid}/results/final");

        $response->assertOk();
        $this->assertEquals($candidate->uuid, $response->json('data.results.0.candidate_uuid'));
    }
}

<?php

namespace Tests\Feature;

use App\Http\Requests\Api\V1\Elections\CreateElectionRequest;
use App\Models\Candidate;
use App\Models\Election;
use App\Models\JuryCriteria;
use App\Models\JuryScore;
use App\Models\User;
use App\Services\ElectionService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Validator;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * Tests de régression pour la notation jury du vote_type "weighted"
 * (JuryScoreController + validation du poids public/jury).
 */
class JuryScoringTest extends TestCase
{
    use RefreshDatabase;

    private function weightedElectionWithJury(): array
    {
        $election = Election::factory()->ongoing()->create([
            'vote_type' => 'weighted',
            'public_weight' => 0.6,
            'jury_weight' => 0.4,
        ]);
        $candidate = Candidate::factory()->approved()->create(['election_id' => $election->id]);
        $criteria = JuryCriteria::create([
            'election_id' => $election->id,
            'name' => 'Qualité',
            'weight' => 1,
            'max_score' => 10,
        ]);
        $jury = User::factory()->create();
        // addManager() lit Auth::user() pour "assigned_by" — un acteur doit
        // être authentifié au moment de l'appel (peu importe lequel ici).
        Sanctum::actingAs($jury);
        app(ElectionService::class)->addManager($election, $jury, 'jury');

        return [$election, $candidate, $criteria, $jury];
    }

    public function test_un_jure_peut_soumettre_des_notes_par_critere(): void
    {
        [$election, $candidate, $criteria, $jury] = $this->weightedElectionWithJury();
        Sanctum::actingAs($jury);

        $response = $this->postJson("/api/v1/elections/{$election->uuid}/jury/scores", [
            'candidate_id' => $candidate->uuid,
            'scores' => [
                ['criteria_id' => $criteria->uuid, 'score' => 8],
            ],
            'comment' => 'Bon candidat',
        ]);

        $response->assertOk();
        $this->assertDatabaseHas('jury_scores', [
            'candidate_id' => $candidate->id,
            'jury_user_id' => $jury->id,
            'criteria_id' => $criteria->id,
            'score' => 8,
        ]);
    }

    public function test_renoter_un_candidat_met_a_jour_la_note_existante_sans_creer_de_doublon(): void
    {
        [$election, $candidate, $criteria, $jury] = $this->weightedElectionWithJury();
        Sanctum::actingAs($jury);

        $payload = fn (int $score) => [
            'candidate_id' => $candidate->uuid,
            'scores' => [['criteria_id' => $criteria->uuid, 'score' => $score]],
        ];

        $this->postJson("/api/v1/elections/{$election->uuid}/jury/scores", $payload(6))->assertOk();
        $this->postJson("/api/v1/elections/{$election->uuid}/jury/scores", $payload(9))->assertOk();

        $this->assertEquals(1, JuryScore::where('candidate_id', $candidate->id)
            ->where('jury_user_id', $jury->id)
            ->where('criteria_id', $criteria->id)
            ->count());
        $this->assertEquals(9, JuryScore::where('candidate_id', $candidate->id)
            ->where('jury_user_id', $jury->id)
            ->where('criteria_id', $criteria->id)
            ->first()->score);
    }

    public function test_une_note_superieure_au_max_score_du_critere_est_rejetee(): void
    {
        [$election, $candidate, $criteria, $jury] = $this->weightedElectionWithJury();
        Sanctum::actingAs($jury);

        $response = $this->postJson("/api/v1/elections/{$election->uuid}/jury/scores", [
            'candidate_id' => $candidate->uuid,
            'scores' => [['criteria_id' => $criteria->uuid, 'score' => 15]], // max_score = 10
        ]);

        $response->assertStatus(422);
        $this->assertDatabaseMissing('jury_scores', [
            'candidate_id' => $candidate->id,
            'criteria_id' => $criteria->id,
        ]);
    }

    public function test_un_utilisateur_sans_role_jury_ne_peut_pas_noter(): void
    {
        [$election, $candidate, $criteria] = $this->weightedElectionWithJury();
        $outsider = User::factory()->create();
        Sanctum::actingAs($outsider);

        $response = $this->postJson("/api/v1/elections/{$election->uuid}/jury/scores", [
            'candidate_id' => $candidate->uuid,
            'scores' => [['criteria_id' => $criteria->uuid, 'score' => 5]],
        ]);

        $response->assertStatus(403);
    }

    public function test_create_election_weighted_rejette_une_somme_de_poids_differente_de_un(): void
    {
        $request = CreateElectionRequest::create('/api/v1/elections', 'POST', [
            'vote_type' => 'weighted',
            'public_weight' => 0.7,
            'jury_weight' => 0.5,
        ]);

        $validator = Validator::make($request->all(), $request->rules());
        $request->withValidator($validator);

        $this->assertTrue($validator->fails());
        $this->assertArrayHasKey('jury_weight', $validator->errors()->toArray());
    }

    public function test_create_election_weighted_accepte_une_somme_de_poids_egale_a_un(): void
    {
        $request = CreateElectionRequest::create('/api/v1/elections', 'POST', [
            'vote_type' => 'weighted',
            'public_weight' => 0.6,
            'jury_weight' => 0.4,
        ]);

        $validator = Validator::make($request->all(), $request->rules());
        $request->withValidator($validator);

        $this->assertArrayNotHasKey('jury_weight', $validator->errors()->toArray());
    }
}

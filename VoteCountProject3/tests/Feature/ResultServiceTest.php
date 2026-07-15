<?php

namespace Tests\Feature;

use App\Events\ResultsCalculated;
use App\Models\Candidate;
use App\Models\Election;
use App\Models\Elector;
use App\Models\JuryCriteria;
use App\Models\JuryScore;
use App\Models\Result;
use App\Models\User;
use App\Models\Vote;
use App\Models\VoteItem;
use App\Services\ResultService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Str;
use Tests\TestCase;

/**
 * Tests de régression pour ResultService::calculateResults(), en particulier
 * le dépouillement IRV (Instant Runoff Voting) du vote_type "ranked", qui
 * remplace l'ancien comptage de Borda (calculateRankingPoints) et la formule
 * live "10 - avg_rank" — ni l'un ni l'autre n'implémentait un vrai IRV.
 *
 * Chaque bulletin est un groupe de "N bulletins identiques" (un Vote +
 * VoteItems avec une quantity donnée), ce qui reflète directement le modèle
 * de paiement du vote ranked (N voix achetées = N copies du même classement).
 */
class ResultServiceTest extends TestCase
{
    use RefreshDatabase;

    protected ResultService $resultService;

    protected function setUp(): void
    {
        parent::setUp();

        $this->resultService = app(ResultService::class);

        Event::fake([ResultsCalculated::class]);
    }

    /** Crée un groupe de bulletins identiques : un classement, répété `quantity` fois. */
    private function castBallotGroup(Election $election, array $rankedCandidates, int $quantity): void
    {
        $elector = Elector::factory()->create(['election_id' => $election->id]);

        $vote = Vote::create([
            'election_id' => $election->id,
            'elector_id' => $elector->id,
            'ip_address' => '127.0.0.1',
            'status' => 'completed',
            'vote_sequence' => 1,
            'idempotency_key' => (string) Str::uuid(),
            'submitted_at' => now(),
        ]);

        foreach ($rankedCandidates as $index => $candidate) {
            VoteItem::create([
                'vote_id' => $vote->id,
                'candidate_id' => $candidate->id,
                'rank_position' => $index + 1,
                'quantity' => $quantity,
            ]);
        }
    }

    private function rankedElection(int $candidateCount): array
    {
        $election = Election::factory()->closed()->create(['vote_type' => 'ranked']);
        $candidates = Candidate::factory()->approved()->count($candidateCount)->create(['election_id' => $election->id]);

        return [$election, $candidates];
    }

    public function test_classement_complet_designe_le_gagnant_a_la_majorite_au_premier_tour(): void
    {
        [$election, $candidates] = $this->rankedElection(3);
        [$a, $b, $c] = $candidates;

        $this->castBallotGroup($election, [$a, $b, $c], 6);
        $this->castBallotGroup($election, [$b, $a, $c], 3);
        $this->castBallotGroup($election, [$c, $b, $a], 1);

        $this->resultService->calculateResults($election);

        $results = Result::where('election_id', $election->id)->orderBy('rank')->get();
        $this->assertEquals($a->id, $results->first()->candidate_id);
        $this->assertEquals(1, $results->first()->rank);

        $snapshot = $election->resultSnapshots()->latest()->first()->snapshot;
        $this->assertEquals($a->id, $snapshot['irv']['winner_candidate_id']);
        // Majorité déjà atteinte dès le round 1 (6/10 >= 6).
        $this->assertEquals($a->id, $snapshot['irv']['rounds'][0]['majority_reached_by']);
    }

    public function test_classement_partiel_les_bulletins_epuises_sont_retires_du_calcul_de_majorite(): void
    {
        [$election, $candidates] = $this->rankedElection(3);
        [$a, $b, $c] = $candidates;

        $this->castBallotGroup($election, [$a], 5);           // partiel : A seul
        $this->castBallotGroup($election, [$b, $c], 3);
        $this->castBallotGroup($election, [$c], 2);            // partiel : C seul -> s'épuise si C éliminé

        $this->resultService->calculateResults($election);

        $snapshot = $election->resultSnapshots()->latest()->first()->snapshot;
        $rounds = $snapshot['irv']['rounds'];

        $this->assertEquals(2, count($rounds));
        $finalRound = $rounds[1];
        // 10 bulletins - 2 épuisés = 8 actifs ; majorité = floor(8/2)+1 = 5, pas 6.
        $this->assertEquals(8, $finalRound['total_active']);
        $this->assertEquals(5, $finalRound['majority_threshold']);
        $this->assertEquals(2, $finalRound['exhausted_this_round']);
        $this->assertEquals($a->id, $snapshot['irv']['winner_candidate_id']);
    }

    public function test_egalite_delimination_departagee_par_le_nombre_de_voix_du_tour_precedent(): void
    {
        [$election, $candidates] = $this->rankedElection(4);
        [$a, $b, $c, $d] = $candidates;

        $this->castBallotGroup($election, [$a, $b, $c, $d], 5);
        $this->castBallotGroup($election, [$b, $a, $c, $d], 4);
        $this->castBallotGroup($election, [$c, $b, $a, $d], 3);
        $this->castBallotGroup($election, [$d, $c, $b, $a], 1);

        $this->resultService->calculateResults($election);

        $snapshot = $election->resultSnapshots()->latest()->first()->snapshot;
        $rounds = $snapshot['irv']['rounds'];

        // Round 1 : D (1) éliminé seul. Round 2 : B et C à 4-4, départagés par
        // leurs voix du round précédent (round 1 : B=4, C=3) -> C éliminé.
        $round2 = $rounds[1];
        $this->assertNotNull($round2['tie_break']);
        $this->assertEquals('previous_round_count', $round2['tie_break']['method']);
        $this->assertEquals($c->id, $round2['eliminated']);
        $this->assertEqualsCanonicalizing([$b->id, $c->id], $round2['tie_break']['candidates_considered']);

        $this->assertEquals($b->id, $snapshot['irv']['winner_candidate_id']);
    }

    public function test_egalite_delimination_departagee_par_les_premiers_choix_du_tour_1_quand_le_tour_precedent_est_aussi_a_egalite(): void
    {
        [$election, $candidates] = $this->rankedElection(5);
        [$a, $w, $x, $y, $z] = $candidates;

        $this->castBallotGroup($election, [$a, $y, $z, $x, $w], 20);
        $this->castBallotGroup($election, [$w, $z, $y, $x, $a], 2);
        $this->castBallotGroup($election, [$x, $a, $y, $z, $w], 3);
        $this->castBallotGroup($election, [$y, $z, $x, $a, $w], 7);
        $this->castBallotGroup($election, [$z, $y, $x, $a, $w], 5);

        $this->resultService->calculateResults($election);

        $snapshot = $election->resultSnapshots()->latest()->first()->snapshot;
        $rounds = $snapshot['irv']['rounds'];

        // Round où Y et Z sont à 7-7 (round précédent aussi 7-7) -> départage
        // par les 1ers choix figés du round 1 (Y=7, Z=5) -> Z éliminé.
        $tieRound = null;
        foreach ($rounds as $round) {
            if ($round['tie_break'] !== null) {
                $tieRound = $round;
                break;
            }
        }

        $this->assertNotNull($tieRound, 'Aucun round avec départage trouvé.');
        $this->assertEquals('first_choice_count', $tieRound['tie_break']['method']);
        $this->assertEquals($z->id, $tieRound['eliminated']);
        $this->assertEqualsCanonicalizing([$y->id, $z->id], $tieRound['tie_break']['candidates_considered']);
    }

    public function test_egalite_du_tour_final_departagee_par_les_choix_successifs(): void
    {
        [$election, $candidates] = $this->rankedElection(4);
        [$a, $b, $c, $d] = $candidates;

        $this->castBallotGroup($election, [$a, $d, $b, $c], 5);
        $this->castBallotGroup($election, [$b, $d, $a, $c], 5);
        $this->castBallotGroup($election, [$c, $a, $b, $d], 2);
        $this->castBallotGroup($election, [$d, $c, $b, $a], 2);

        $this->resultService->calculateResults($election);

        $snapshot = $election->resultSnapshots()->latest()->first()->snapshot;
        $finalTieBreak = $snapshot['irv']['final_tie_break'];

        $this->assertNotNull($finalTieBreak);
        // La règle du tour final NE compare JAMAIS le tour précédent — elle
        // compare directement les préférences figées (ici : le rang 2).
        $this->assertNotEquals('previous_round_count', $finalTieBreak['method']);
        $this->assertEquals('rank_2_choice_count', $finalTieBreak['method']);
        $this->assertEquals($a->id, $finalTieBreak['chosen']);
        $this->assertEquals($a->id, $snapshot['irv']['winner_candidate_id']);
    }

    public function test_egalite_totale_declenche_un_tirage_au_sort_documente(): void
    {
        [$election, $candidates] = $this->rankedElection(2);
        [$a, $b] = $candidates;

        $this->castBallotGroup($election, [$a, $b], 5);
        $this->castBallotGroup($election, [$b, $a], 5);

        $this->resultService->calculateResults($election);

        $snapshot = $election->resultSnapshots()->latest()->first()->snapshot;
        $finalTieBreak = $snapshot['irv']['final_tie_break'];

        $this->assertNotNull($finalTieBreak);
        $this->assertEquals('random_draw', $finalTieBreak['method']);
        $this->assertEqualsCanonicalizing([$a->id, $b->id], $finalTieBreak['candidates_considered']);
        $this->assertContains($snapshot['irv']['winner_candidate_id'], [$a->id, $b->id]);
    }

    /** Crée un vote public (choix unique) répété `quantity` fois pour un candidat. */
    private function castSingleVoteGroup(Election $election, Candidate $candidate, int $quantity): void
    {
        $elector = Elector::factory()->create(['election_id' => $election->id]);

        $vote = Vote::create([
            'election_id' => $election->id,
            'elector_id' => $elector->id,
            'ip_address' => '127.0.0.1',
            'status' => 'completed',
            'vote_sequence' => 1,
            'idempotency_key' => (string) Str::uuid(),
            'submitted_at' => now(),
        ]);

        VoteItem::create([
            'vote_id' => $vote->id,
            'candidate_id' => $candidate->id,
            'quantity' => $quantity,
        ]);
    }

    public function test_calculateResults_weighted_combine_la_part_de_voix_publique_et_la_note_jury(): void
    {
        $election = Election::factory()->closed()->create([
            'vote_type' => 'weighted',
            'public_weight' => 0.6,
            'jury_weight' => 0.4,
        ]);
        $a = Candidate::factory()->approved()->create(['election_id' => $election->id]);
        $b = Candidate::factory()->approved()->create(['election_id' => $election->id]);

        // Voix publiques : A=8, B=2 (80% / 20%).
        $this->castSingleVoteGroup($election, $a, 8);
        $this->castSingleVoteGroup($election, $b, 2);

        // Deux critères de poids et max_score différents — un critère noté
        // sur 20 ne doit pas écraser un critère noté sur 10.
        $c1 = JuryCriteria::create(['election_id' => $election->id, 'name' => 'C1', 'weight' => 2, 'max_score' => 10]);
        $c2 = JuryCriteria::create(['election_id' => $election->id, 'name' => 'C2', 'weight' => 1, 'max_score' => 20]);
        $jury = User::factory()->create();

        JuryScore::create(['election_id' => $election->id, 'candidate_id' => $a->id, 'jury_user_id' => $jury->id, 'criteria_id' => $c1->id, 'score' => 8]);
        JuryScore::create(['election_id' => $election->id, 'candidate_id' => $a->id, 'jury_user_id' => $jury->id, 'criteria_id' => $c2->id, 'score' => 10]);
        JuryScore::create(['election_id' => $election->id, 'candidate_id' => $b->id, 'jury_user_id' => $jury->id, 'criteria_id' => $c1->id, 'score' => 4]);
        JuryScore::create(['election_id' => $election->id, 'candidate_id' => $b->id, 'jury_user_id' => $jury->id, 'criteria_id' => $c2->id, 'score' => 16]);

        $this->resultService->calculateResults($election);

        $results = Result::where('election_id', $election->id)->orderBy('rank')->get()->keyBy('candidate_id');

        // Note jury A : (8/10*10)*2 + (10/20*10)*1 = 16+5 = 21 / 3 = 7
        // final A = (80/10)*0.6 + 7*0.4 = 4.8 + 2.8 = 7.6
        $this->assertEqualsWithDelta(7.6, (float) $results[$a->id]->final_score, 0.01);

        // Note jury B : (4/10*10)*2 + (16/20*10)*1 = 8+8 = 16 / 3 = 5.333...
        // final B = (20/10)*0.6 + 5.333*0.4 = 1.2 + 2.1333 = 3.333...
        $this->assertEqualsWithDelta(3.33, (float) $results[$b->id]->final_score, 0.01);

        $this->assertEquals(1, $results[$a->id]->rank);
    }

    public function test_calculateResults_jury_weight_naffecte_pas_un_type_de_vote_autre_que_weighted(): void
    {
        // Bug latent corrigé : avant, le blending jury se déclenchait dès que
        // jury_weight > 0, peu importe le vote_type. Ici, jury_weight est
        // explicitement non nul sur une élection "single" — le résultat ne
        // doit dépendre que des voix publiques.
        $election = Election::factory()->closed()->create([
            'vote_type' => 'single',
            'public_weight' => 0.6,
            'jury_weight' => 0.4,
        ]);
        $winner = Candidate::factory()->approved()->create(['election_id' => $election->id]);
        $loser = Candidate::factory()->approved()->create(['election_id' => $election->id]);

        $this->castSingleVoteGroup($election, $winner, 7);
        $this->castSingleVoteGroup($election, $loser, 3);

        $this->resultService->calculateResults($election);

        $results = Result::where('election_id', $election->id)->orderBy('rank')->get();

        $this->assertEquals($winner->id, $results->first()->candidate_id);
        $this->assertEquals(7, (float) $results->first()->final_score);
        $this->assertEquals(0, (float) $results->first()->jury_votes);
    }

    public function test_calculateResults_types_non_ranked_ne_sont_pas_impactes(): void
    {
        $election = Election::factory()->closed()->create(['vote_type' => 'single']);
        $winner = Candidate::factory()->approved()->create(['election_id' => $election->id]);
        $loser = Candidate::factory()->approved()->create(['election_id' => $election->id]);

        $this->castBallotGroup($election, [$winner], 7);
        $this->castBallotGroup($election, [$loser], 3);

        $this->resultService->calculateResults($election);

        $results = Result::where('election_id', $election->id)->orderBy('rank')->get();

        $this->assertEquals($winner->id, $results->first()->candidate_id);
        $this->assertEquals(7, $results->first()->total_votes);
        $this->assertEquals(70.0, (float) $results->first()->percentage);

        // Le snapshot d'un type non-ranked garde le format plat existant (pas d'enveloppe "irv").
        $snapshot = $election->resultSnapshots()->latest()->first()->snapshot;
        $this->assertArrayNotHasKey('irv', $snapshot);
    }
}

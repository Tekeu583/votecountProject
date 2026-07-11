<?php

namespace Tests\Feature;

use App\DTOs\VoteDTO;
use App\Events\LiveResultsUpdated;
use App\Events\VoteCast;
use App\Exceptions\VoteException;
use App\Models\Candidate;
use App\Models\Election;
use App\Models\Elector;
use App\Models\Vote;
use App\Models\VoterSession;
use App\Services\VotingService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Str;
use Tests\TestCase;

/**
 * Tests de régression pour VotingService::submitVote().
 *
 * Cette méthode est le cœur du système de vote — elle a concentré le plus
 * de bugs découverts et corrigés pendant cette session (collision de
 * vote_sequence, calcul de quantité pour le vote payant, incrément du
 * compteur de voix, quota par électeur). Chaque test ci-dessous correspond
 * à un bug réellement rencontré en production, pour empêcher qu'il ne
 * revienne silencieusement lors d'une future modification.
 *
 * Prérequis : une base de test PostgreSQL dédiée doit exister.
 *   createdb votecount_test
 * (voir phpunit.xml pour la configuration de connexion)
 */
class VotingServiceTest extends TestCase
{
    use RefreshDatabase;

    protected VotingService $votingService;

    protected function setUp(): void
    {
        parent::setUp();

        $this->votingService = app(VotingService::class);

       
        Queue::fake();
        Event::fake([VoteCast::class, LiveResultsUpdated::class]);
    }

    /** Construit une session votant valide pour un électeur donné. */
    private function makeSession(Election $election, Elector $elector): VoterSession
    {
        return VoterSession::create([
            'uuid' => Str::uuid()->toString(),
            'election_id' => $election->id,
            'elector_id' => $elector->id,
            'ip_address' => '127.0.0.1',
            'session_token' => Str::random(40),
            'started_at' => now(),
            'status' => 'active',
        ]);
    }

    /** Construit un VoteDTO minimal pour un candidat donné, avec un idempotency_key unique. */
    private function makeDto(array $items): VoteDTO
    {
        return new VoteDTO(
            items: $items,
            idempotencyKey: (string) Str::uuid(),
            ipAddress: '127.0.0.1',
        );
    }

    public function test_un_vote_gratuit_cree_un_vote_complete_avec_une_seule_voix(): void
    {
        $election = Election::factory()->ongoing()->create([
            'payment_type' => 'free',
            'vote_price' => 0,
            'max_votes_per_user' => 1,
        ]);
        $candidate = Candidate::factory()->approved()->create(['election_id' => $election->id]);
        $elector = Elector::factory()->create(['election_id' => $election->id]);
        $session = $this->makeSession($election, $elector);

        $vote = $this->votingService->submitVote(
            $elector,
            $election,
            $session,
            $this->makeDto([['candidate_id' => $candidate->uuid]])
        );

        $this->assertEquals('completed', $vote->status);
        $this->assertFalse($vote->is_paid);
        $this->assertEquals(0, (float) $vote->total_amount);
        $this->assertCount(1, $vote->items);
        $this->assertEquals(1, $vote->items->first()->quantity);
        $this->assertEquals(1, $candidate->fresh()->vote_count);
    }

    public function test_un_montant_multiple_exact_du_prix_calcule_la_bonne_quantite_de_voix(): void
    {
        // Régression : vérifie le calcul quantity = amount / vote_price,
        // introduit pour le modèle "achat de voix en bloc".
        $election = Election::factory()->ongoing()->create([
            'payment_type' => 'paid',
            'vote_price' => 5,
            'max_votes_per_user' => 50,
        ]);
        $candidate = Candidate::factory()->approved()->create(['election_id' => $election->id]);
        $elector = Elector::factory()->create(['election_id' => $election->id]);
        $session = $this->makeSession($election, $elector);

        $vote = $this->votingService->submitVote(
            $elector,
            $election,
            $session,
            $this->makeDto([['candidate_id' => $candidate->uuid, 'amount' => 25]])
        );

        // Un vote payant reste NON complété tant que le paiement n'est pas
        // vérifié — submitVote ne doit pas le finaliser lui-même.
        $this->assertEquals('pending', $vote->status);
        $this->assertTrue($vote->is_paid);
        $this->assertEquals(25, (float) $vote->total_amount);
        $this->assertEquals(5, $vote->items->first()->quantity);

        // Le compteur du candidat ne doit PAS bouger tant que le vote n'est
        // pas complété (le paiement n'a pas encore été confirmé).
        $this->assertEquals(0, $candidate->fresh()->vote_count);
    }

    public function test_un_montant_non_multiple_du_prix_est_rejete_et_ne_cree_aucun_vote(): void
    {
        // Régression : protège contre un électeur qui perdrait de l'argent
        // sur un montant mal aligné (ex: 17 XAF pour un prix de 5 XAF/voix).
        $election = Election::factory()->ongoing()->create([
            'payment_type' => 'paid',
            'vote_price' => 5,
            'max_votes_per_user' => 50,
        ]);
        $candidate = Candidate::factory()->approved()->create(['election_id' => $election->id]);
        $elector = Elector::factory()->create(['election_id' => $election->id]);
        $session = $this->makeSession($election, $elector);

        $threw = false;
        try {
            $this->votingService->submitVote(
                $elector,
                $election,
                $session,
                $this->makeDto([['candidate_id' => $candidate->uuid, 'amount' => 17]])
            );
        } catch (VoteException $e) {
            $threw = true;
            $this->assertEquals(400, $e->getHttpStatusCode());
        }

        $this->assertTrue($threw, 'Un montant non multiple du prix aurait dû lever VoteException.');

        // La transaction DB doit avoir été annulée entièrement — aucun vote
        // "à moitié créé" ne doit traîner en base.
        $this->assertDatabaseCount('votes', 0);
    }

    public function test_un_montant_absent_retombe_sur_une_seule_voix_au_prix_plein(): void
    {
        // Rétrocompatibilité : le flux privé n'envoie pas encore "amount" —
        // ce cas ne doit jamais lever d'exception, juste défaut à 1 voix.
        $election = Election::factory()->ongoing()->create([
            'payment_type' => 'paid',
            'vote_price' => 5,
            'max_votes_per_user' => 50,
        ]);
        $candidate = Candidate::factory()->approved()->create(['election_id' => $election->id]);
        $elector = Elector::factory()->create(['election_id' => $election->id]);
        $session = $this->makeSession($election, $elector);

        $vote = $this->votingService->submitVote(
            $elector,
            $election,
            $session,
            $this->makeDto([['candidate_id' => $candidate->uuid]]) // pas de 'amount'
        );

        $this->assertEquals(1, $vote->items->first()->quantity);
        $this->assertEquals(5, (float) $vote->total_amount);
    }

    public function test_deux_votes_payants_successifs_du_meme_electeur_ne_collisionnent_pas(): void
    {
        
        $election = Election::factory()->ongoing()->create([
            'payment_type' => 'paid',
            'vote_price' => 5,
            'max_votes_per_user' => 50,
        ]);
        $candidateA = Candidate::factory()->approved()->create(['election_id' => $election->id]);
        $candidateB = Candidate::factory()->approved()->create(['election_id' => $election->id]);
        $elector = Elector::factory()->create(['election_id' => $election->id]);

        $vote1 = $this->votingService->submitVote(
            $elector,
            $election,
            $this->makeSession($election, $elector),
            $this->makeDto([['candidate_id' => $candidateA->uuid, 'amount' => 25]])
        );

        // Le 2e vote ne doit lever AUCUNE exception de contrainte unique.
        $vote2 = $this->votingService->submitVote(
            $elector,
            $election,
            $this->makeSession($election, $elector),
            $this->makeDto([['candidate_id' => $candidateB->uuid, 'amount' => 10]])
        );

        $this->assertNotEquals($vote1->vote_sequence, $vote2->vote_sequence);
        $this->assertDatabaseCount('votes', 2);
    }

    public function test_le_quota_max_votes_per_user_se_base_sur_les_votes_completes_uniquement(): void
    {
        $election = Election::factory()->ongoing()->create([
            'payment_type' => 'free',
            'vote_price' => 0,
            'max_votes_per_user' => 1,
        ]);
        $candidate = Candidate::factory()->approved()->create(['election_id' => $election->id]);
        $elector = Elector::factory()->create(['election_id' => $election->id]);

        // 1er vote (gratuit → complété immédiatement) : consomme le quota.
        $this->votingService->submitVote(
            $elector,
            $election,
            $this->makeSession($election, $elector),
            $this->makeDto([['candidate_id' => $candidate->uuid]])
        );

        $this->expectException(VoteException::class);

        // 2e tentative : quota déjà atteint → doit être bloquée.
        $this->votingService->submitVote(
            $elector,
            $election,
            $this->makeSession($election, $elector),
            $this->makeDto([['candidate_id' => $candidate->uuid]])
        );
    }

    public function test_completer_un_vote_incremente_le_candidat_de_la_quantite_pas_dun_fixe(): void
    {
        $election = Election::factory()->ongoing()->create([
            'payment_type' => 'paid',
            'vote_price' => 5,
            'max_votes_per_user' => 50,
        ]);
        $candidate = Candidate::factory()->approved()->create(['election_id' => $election->id]);
        $elector = Elector::factory()->create(['election_id' => $election->id]);
        $session = $this->makeSession($election, $elector);

        // amount=20, vote_price=5 → quantité attendue = 4.
        $vote = $this->votingService->submitVote(
            $elector,
            $election,
            $session,
            $this->makeDto([['candidate_id' => $candidate->uuid, 'amount' => 20]])
        );

        $this->assertEquals(0, $candidate->fresh()->vote_count, 'Le compteur ne doit pas bouger avant complétion.');

        // Simule la confirmation du paiement (normalement déclenchée par
        // PaymentService::verifyPayment après réponse du provider CamPay).
        $vote->fresh()->markAsCompleted();

        $this->assertEquals(4, $candidate->fresh()->vote_count);
    }
}
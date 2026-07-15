<?php

namespace Tests\Feature;

use App\Events\LiveResultsUpdated;
use App\Models\Candidate;
use App\Models\Election;
use App\Models\Elector;
use App\Models\Vote;
use App\Models\VoteItem;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

/**
 * Régression : LiveResultsUpdated::computeLiveScores() calculait le champ
 * "score" d'une élection weighted à partir de SUM(vote_items.weight) — une
 * colonne jamais renseignée (toujours 1 par défaut), qui divergeait donc du
 * vrai nombre de voix (vote_count) dès qu'un vote payant en bloc (quantity
 * > 1) était acheté. Corrigé pour retomber sur vote_count comme "single".
 */
class LiveResultsWeightedScoreTest extends TestCase
{
    use RefreshDatabase;

    public function test_le_score_live_dune_election_weighted_correspond_au_nombre_reel_de_voix(): void
    {
        $election = Election::factory()->ongoing()->create([
            'vote_type' => 'weighted',
            'payment_type' => 'paid',
            'vote_price' => 10,
        ]);
        $candidate = Candidate::factory()->approved()->create(['election_id' => $election->id]);
        $elector = Elector::factory()->create(['election_id' => $election->id]);

        // Un seul bulletin (une seule ligne vote_items => weight par défaut
        // = 1 côté ancien calcul), mais 5 voix achetées en bloc (quantity=5).
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
            'quantity' => 5,
        ]);

        $result = LiveResultsUpdated::computeScores($election);
        $score = collect($result['scores'])->firstWhere('candidate_uuid', $candidate->uuid);

        $this->assertEquals(5, $score['vote_count']);
        $this->assertEquals(5, $score['score']);
    }
}

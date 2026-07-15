<?php

namespace Tests\Feature;

use App\Models\Election;
use App\Models\Elector;
use App\Models\Organization;
use App\Models\PaymentTransaction;
use App\Models\User;
use App\Services\RoleService;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * Aucun endpoint de liste/historique de transactions n'existait avant ce
 * chantier (PaymentController ne gère que le flux initiate/verify d'une
 * transaction individuelle) — RevenueController::index()/stats() sont
 * entièrement nouveaux.
 */
class RevenueControllerTest extends TestCase
{
    use RefreshDatabase;

    private function actingOrgOwner(): User
    {
        $this->seed(RolesAndPermissionsSeeder::class);
        $user = User::factory()->create();
        RoleService::assignRoleToUser($user, 'organization_owner');
        Sanctum::actingAs($user);

        return $user;
    }

    private function makeVoteTransaction(Election $election, Elector $elector, array $overrides = []): PaymentTransaction
    {
        return PaymentTransaction::create(array_merge([
            'election_id' => $election->id,
            'elector_id' => $elector->id,
            'type' => 'vote',
            'provider' => 'campay',
            'provider_reference' => 'ref-' . Str::random(8),
            'transaction_reference' => (string) Str::uuid(),
            'currency' => 'XAF',
            'amount' => 1000,
            'fees' => 50,
            'net_amount' => 950,
            'payment_method' => 'mobile_money',
            'status' => 'completed',
        ], $overrides));
    }

    public function test_index_scope_les_transactions_de_vote_via_lelection(): void
    {
        $this->actingOrgOwner();
        $orgA = Organization::factory()->create();
        $orgB = Organization::factory()->create();
        $electionA = Election::factory()->create(['organization_id' => $orgA->id]);
        $electionB = Election::factory()->create(['organization_id' => $orgB->id]);
        $electorA = Elector::factory()->create(['election_id' => $electionA->id]);
        $electorB = Elector::factory()->create(['election_id' => $electionB->id]);

        $this->makeVoteTransaction($electionA, $electorA);
        $this->makeVoteTransaction($electionB, $electorB);

        $response = $this->getJson("/api/v1/payments/transactions?organization_uuid={$orgA->uuid}");

        $response->assertOk();
        $this->assertCount(1, $response->json('data'));
    }

    public function test_index_scope_les_transactions_dabonnement_via_organization_id_direct(): void
    {
        $this->actingOrgOwner();
        $org = Organization::factory()->create();

        PaymentTransaction::create([
            'organization_id' => $org->id,
            'type' => 'subscription',
            'provider' => 'campay',
            'provider_reference' => 'ref-sub',
            'transaction_reference' => (string) Str::uuid(),
            'currency' => 'XAF',
            'amount' => 5000,
            'fees' => 0,
            'net_amount' => 5000,
            'payment_method' => 'mobile_money',
            'status' => 'completed',
        ]);

        $response = $this->getJson("/api/v1/payments/transactions?organization_uuid={$org->uuid}");

        $response->assertOk();
        $this->assertCount(1, $response->json('data'));
        $this->assertEquals('subscription', $response->json('data.0.type'));
    }

    public function test_stats_calcule_le_revenu_total_et_la_moyenne_par_votant(): void
    {
        $this->actingOrgOwner();
        $org = Organization::factory()->create();
        $election = Election::factory()->create(['organization_id' => $org->id]);
        $electorA = Elector::factory()->create(['election_id' => $election->id]);
        $electorB = Elector::factory()->create(['election_id' => $election->id]);

        $this->makeVoteTransaction($election, $electorA, ['net_amount' => 950]);
        $this->makeVoteTransaction($election, $electorB, ['net_amount' => 450]);
        // Transaction échouée — ne doit pas compter.
        $this->makeVoteTransaction($election, $electorA, ['net_amount' => 1000, 'status' => 'failed', 'transaction_reference' => (string) Str::uuid()]);

        $response = $this->getJson("/api/v1/payments/transactions/stats?organization_uuid={$org->uuid}");

        $response->assertOk();
        $this->assertEquals(1400.0, (float) $response->json('data.total_revenue'));
        $this->assertEquals(700.0, (float) $response->json('data.average_per_voter'));
    }
}

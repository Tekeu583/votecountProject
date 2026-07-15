<?php

namespace Tests\Feature;

use App\Models\Election;
use App\Models\Elector;
use App\Models\Organization;
use App\Models\PaymentTransaction;
use App\Models\User;
use App\Models\Vote;
use App\Services\RoleService;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * Régression : AnalyticsController::dashboard() scopait sur
 * $request->get('current_organization'), toujours null car TenantMiddleware
 * n'est branché sur aucune route — total_elections/active_elections
 * comptaient donc 0 (ou toutes les organisations mélangées), et
 * total_votes/total_revenue/participation_rate étaient des zéros en dur.
 */
class AnalyticsDashboardTest extends TestCase
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

    public function test_dashboard_scope_les_elections_par_organisation(): void
    {
        $this->actingOrgOwner();
        $orgA = Organization::factory()->create();
        $orgB = Organization::factory()->create();

        Election::factory()->count(2)->create(['organization_id' => $orgA->id]);
        Election::factory()->count(5)->create(['organization_id' => $orgB->id]);

        $response = $this->getJson("/api/v1/analytics/dashboard?organization_uuid={$orgA->uuid}");

        $response->assertOk();
        $this->assertEquals(2, $response->json('data.total_elections'));
    }

    public function test_dashboard_calcule_le_total_des_votes(): void
    {
        $this->actingOrgOwner();
        $org = Organization::factory()->create();
        Election::factory()->create(['organization_id' => $org->id, 'total_votes' => 12]);
        Election::factory()->create(['organization_id' => $org->id, 'total_votes' => 8]);

        $response = $this->getJson("/api/v1/analytics/dashboard?organization_uuid={$org->uuid}");

        $this->assertEquals(20, $response->json('data.total_votes'));
    }

    public function test_dashboard_calcule_le_revenu_total_y_compris_les_votes_payants(): void
    {
        $this->actingOrgOwner();
        $org = Organization::factory()->create();
        $election = Election::factory()->create(['organization_id' => $org->id]);
        $elector = Elector::factory()->create(['election_id' => $election->id]);

        // Transaction de type "vote" — organization_id reste NULL sur cette
        // table (seul les abonnements le renseignent directement), il faut
        // remonter via election.organization_id.
        PaymentTransaction::create([
            'election_id' => $election->id,
            'elector_id' => $elector->id,
            'type' => 'vote',
            'provider' => 'campay',
            'provider_reference' => 'ref-1',
            'transaction_reference' => (string) Str::uuid(),
            'currency' => 'XAF',
            'amount' => 1000,
            'fees' => 50,
            'net_amount' => 950,
            'payment_method' => 'mobile_money',
            'status' => 'completed',
        ]);
        // Une transaction non complétée ne doit pas compter.
        PaymentTransaction::create([
            'election_id' => $election->id,
            'elector_id' => $elector->id,
            'type' => 'vote',
            'provider' => 'campay',
            'provider_reference' => 'ref-2',
            'transaction_reference' => (string) Str::uuid(),
            'currency' => 'XAF',
            'amount' => 500,
            'fees' => 0,
            'net_amount' => 500,
            'payment_method' => 'mobile_money',
            'status' => 'pending',
        ]);

        $response = $this->getJson("/api/v1/analytics/dashboard?organization_uuid={$org->uuid}");

        $this->assertEquals(950.0, (float) $response->json('data.total_revenue'));
    }

    /**
     * Régression : AnalyticsService::getRecentActivity() interroge via
     * DB::table() (query builder brut, pas Eloquent) — created_at revient
     * en chaîne, pas en Carbon, donc pas de $casts. Un ->toIso8601String()
     * direct plantait dès qu'il y avait au moins un vote complété. Jamais
     * détecté avant car aucun test précédent ne créait de vote réel.
     */
    public function test_dashboard_expose_lactivite_recente_sans_planter(): void
    {
        $this->actingOrgOwner();
        $org = Organization::factory()->create();
        $election = Election::factory()->create(['organization_id' => $org->id]);
        $elector = Elector::factory()->create(['election_id' => $election->id]);

        Vote::create([
            'election_id' => $election->id,
            'elector_id' => $elector->id,
            'ip_address' => '127.0.0.1',
            'status' => 'completed',
            'vote_sequence' => 1,
            'idempotency_key' => (string) Str::uuid(),
            'submitted_at' => now(),
        ]);

        $response = $this->getJson("/api/v1/analytics/dashboard?organization_uuid={$org->uuid}");

        $response->assertOk();
        $this->assertCount(1, $response->json('data.recent_activity'));
        $this->assertEquals($election->title, $response->json('data.recent_activity.0.election_title'));
        $this->assertNotNull($response->json('data.recent_activity.0.timestamp'));
    }
}

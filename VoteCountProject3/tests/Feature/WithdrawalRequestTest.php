<?php

namespace Tests\Feature;

use App\Enums\OrganizationKycStatus;
use App\Models\Organization;
use App\Models\PaymentTransaction;
use App\Models\User;
use App\Models\WithdrawalRequest;
use App\Services\RoleService;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class WithdrawalRequestTest extends TestCase
{
    use RefreshDatabase;

    private function actingOrgOwner(Organization $organization): User
    {
        $this->seed(RolesAndPermissionsSeeder::class);
        $user = User::factory()->create();
        $organization->update(['owner_user_id' => $user->id]);
        // owner_user_id seul ne suffit pas : User::canAccessOrganization()
        // (utilisé par OrganizationPolicy::view()) vérifie le pivot
        // organization_user, pas cette colonne — même chose que fait
        // OrganizationService::create() pour un vrai propriétaire.
        $organization->users()->attach($user->id, [
            'role_slug' => 'owner',
            'status' => 'active',
            'joined_at' => now(),
        ]);
        RoleService::assignRoleToUser($user, 'organization_owner');
        Sanctum::actingAs($user);

        return $user;
    }

    private function actingSuperAdmin(): User
    {
        $this->seed(RolesAndPermissionsSeeder::class);
        $user = User::factory()->create();
        RoleService::assignRoleToUser($user, 'super_admin');
        Sanctum::actingAs($user);

        return $user;
    }

    private function makeCompletedSubscriptionRevenue(Organization $organization, float $netAmount): PaymentTransaction
    {
        return PaymentTransaction::create([
            'organization_id' => $organization->id,
            'type' => 'subscription',
            'provider' => 'campay',
            'provider_reference' => 'ref-'.Str::random(8),
            'transaction_reference' => (string) Str::uuid(),
            'currency' => 'XAF',
            'amount' => $netAmount,
            'fees' => 0,
            'net_amount' => $netAmount,
            'payment_method' => 'mobile_money',
            'status' => 'completed',
        ]);
    }

    public function test_creation_bloquee_si_kyc_non_verifie(): void
    {
        $organization = Organization::factory()->create(['kyc_status' => OrganizationKycStatus::NOT_SUBMITTED]);
        $this->actingOrgOwner($organization);
        $this->makeCompletedSubscriptionRevenue($organization, 10000);

        $response = $this->postJson('/api/v1/withdrawals', [
            'organization_uuid' => $organization->uuid,
            'amount' => 1000,
            'phone_number' => '+237600000000',
        ]);

        // PaymentException a un httpStatusCode fixe (400) au niveau classe,
        // indépendant du code passé à chaque factory statique (kycNotVerified()
        // passe 403 au constructeur mais render() utilise toujours 400) —
        // même comportement que les factories déjà existantes de cette classe.
        $response->assertStatus(400);
    }

    public function test_solde_disponible_inclut_les_transactions_completees_et_exclut_les_retraits_rejetes(): void
    {
        $organization = Organization::factory()->create(['kyc_status' => OrganizationKycStatus::VERIFIED]);
        $this->actingOrgOwner($organization);
        $this->makeCompletedSubscriptionRevenue($organization, 10000);
        $this->makeCompletedSubscriptionRevenue($organization, 5000);
        // Transaction échouée — ne doit pas compter.
        $this->makeCompletedSubscriptionRevenue($organization, 999999)->update(['status' => 'failed']);

        $response = $this->getJson("/api/v1/withdrawals/balance?organization_uuid={$organization->uuid}");

        $response->assertOk();
        $this->assertEquals(15000.0, (float) $response->json('data.available_balance'));
    }

    public function test_une_demande_en_attente_reserve_deja_son_montant_du_solde(): void
    {
        $organization = Organization::factory()->create(['kyc_status' => OrganizationKycStatus::VERIFIED]);
        $this->actingOrgOwner($organization);
        $this->makeCompletedSubscriptionRevenue($organization, 10000);

        $this->postJson('/api/v1/withdrawals', [
            'organization_uuid' => $organization->uuid,
            'amount' => 4000,
            'phone_number' => '+237600000000',
        ])->assertCreated();

        $response = $this->getJson("/api/v1/withdrawals/balance?organization_uuid={$organization->uuid}");

        $response->assertOk();
        $this->assertEquals(6000.0, (float) $response->json('data.available_balance'));
    }

    public function test_une_deuxieme_demande_qui_depasse_le_solde_restant_est_rejetee(): void
    {
        $organization = Organization::factory()->create(['kyc_status' => OrganizationKycStatus::VERIFIED]);
        $this->actingOrgOwner($organization);
        $this->makeCompletedSubscriptionRevenue($organization, 10000);

        $this->postJson('/api/v1/withdrawals', [
            'organization_uuid' => $organization->uuid,
            'amount' => 4000,
            'phone_number' => '+237600000000',
        ])->assertCreated();

        // Une demande est déjà pending pour cette organisation — bloqué avant
        // même de vérifier le solde (anti-spam : une seule demande à la fois).
        $response = $this->postJson('/api/v1/withdrawals', [
            'organization_uuid' => $organization->uuid,
            'amount' => 1000,
            'phone_number' => '+237600000000',
        ]);

        $response->assertStatus(400);
    }

    public function test_membre_viewer_ne_peut_pas_demander_de_retrait(): void
    {
        $this->seed(RolesAndPermissionsSeeder::class);
        $organization = Organization::factory()->create(['kyc_status' => OrganizationKycStatus::VERIFIED]);
        $this->makeCompletedSubscriptionRevenue($organization, 10000);

        $viewer = User::factory()->create();
        $organization->users()->attach($viewer->id, [
            'role_slug' => 'viewer',
            'status' => 'active',
            'joined_at' => now(),
        ]);
        Sanctum::actingAs($viewer);

        $response = $this->postJson('/api/v1/withdrawals', [
            'organization_uuid' => $organization->uuid,
            'amount' => 1000,
            'phone_number' => '+237600000000',
        ]);

        $response->assertStatus(403);
    }

    public function test_membre_admin_peut_demander_un_retrait(): void
    {
        $this->seed(RolesAndPermissionsSeeder::class);
        $organization = Organization::factory()->create(['kyc_status' => OrganizationKycStatus::VERIFIED]);
        $this->makeCompletedSubscriptionRevenue($organization, 10000);

        $admin = User::factory()->create();
        $organization->users()->attach($admin->id, [
            'role_slug' => 'admin',
            'status' => 'active',
            'joined_at' => now(),
        ]);
        Sanctum::actingAs($admin);

        $response = $this->postJson('/api/v1/withdrawals', [
            'organization_uuid' => $organization->uuid,
            'amount' => 1000,
            'phone_number' => '+237600000000',
        ]);

        $response->assertCreated();
    }

    public function test_approve_sur_une_demande_non_pending_echoue(): void
    {
        $organization = Organization::factory()->create(['kyc_status' => OrganizationKycStatus::VERIFIED]);
        $this->actingOrgOwner($organization);
        $this->makeCompletedSubscriptionRevenue($organization, 10000);

        $created = $this->postJson('/api/v1/withdrawals', [
            'organization_uuid' => $organization->uuid,
            'amount' => 1000,
            'phone_number' => '+237600000000',
        ])->json('data.uuid');

        $superAdmin = $this->actingSuperAdmin();
        $this->postJson("/api/v1/withdrawals/{$created}/approve")->assertOk();

        // Deuxième approve sur une demande déjà approuvée doit échouer.
        $response = $this->postJson("/api/v1/withdrawals/{$created}/approve");
        $response->assertStatus(400);
    }

    public function test_mark_paid_sur_une_demande_non_approuvee_echoue(): void
    {
        $organization = Organization::factory()->create(['kyc_status' => OrganizationKycStatus::VERIFIED]);
        $this->actingOrgOwner($organization);
        $this->makeCompletedSubscriptionRevenue($organization, 10000);

        $created = $this->postJson('/api/v1/withdrawals', [
            'organization_uuid' => $organization->uuid,
            'amount' => 1000,
            'phone_number' => '+237600000000',
        ])->json('data.uuid');

        $this->actingSuperAdmin();
        $response = $this->postJson("/api/v1/withdrawals/{$created}/mark-paid", [
            'payment_reference' => 'REF-1',
        ]);

        $response->assertStatus(400);
    }

    public function test_cycle_complet_approve_puis_mark_paid(): void
    {
        $organization = Organization::factory()->create(['kyc_status' => OrganizationKycStatus::VERIFIED]);
        $this->actingOrgOwner($organization);
        $this->makeCompletedSubscriptionRevenue($organization, 10000);

        $created = $this->postJson('/api/v1/withdrawals', [
            'organization_uuid' => $organization->uuid,
            'amount' => 1000,
            'phone_number' => '+237600000000',
        ])->json('data.uuid');

        $this->actingSuperAdmin();
        $this->postJson("/api/v1/withdrawals/{$created}/approve")->assertOk();

        $response = $this->postJson("/api/v1/withdrawals/{$created}/mark-paid", [
            'payment_reference' => 'REF-XYZ',
        ]);

        $response->assertOk();
        $this->assertEquals('paid', $response->json('data.status'));
        $this->assertEquals('REF-XYZ', $response->json('data.payment_reference'));

        $withdrawal = WithdrawalRequest::where('uuid', $created)->first();
        $this->assertNotNull($withdrawal->paid_at);
    }

    public function test_rejet_libere_le_montant_reserve_du_solde(): void
    {
        $organization = Organization::factory()->create(['kyc_status' => OrganizationKycStatus::VERIFIED]);
        $owner = $this->actingOrgOwner($organization);
        $this->makeCompletedSubscriptionRevenue($organization, 10000);

        $created = $this->postJson('/api/v1/withdrawals', [
            'organization_uuid' => $organization->uuid,
            'amount' => 4000,
            'phone_number' => '+237600000000',
        ])->json('data.uuid');

        $this->actingSuperAdmin();
        $this->postJson("/api/v1/withdrawals/{$created}/reject", [
            'rejection_reason' => 'Numéro invalide',
        ])->assertOk();

        Sanctum::actingAs($owner);
        $response = $this->getJson("/api/v1/withdrawals/balance?organization_uuid={$organization->uuid}");

        $response->assertOk();
        $this->assertEquals(10000.0, (float) $response->json('data.available_balance'));
    }
}

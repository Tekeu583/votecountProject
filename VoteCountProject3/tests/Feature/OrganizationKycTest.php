<?php

namespace Tests\Feature;

use App\Enums\OrganizationKycStatus;
use App\Models\Organization;
use App\Models\User;
use App\Services\RoleService;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class OrganizationKycTest extends TestCase
{
    use RefreshDatabase;

    private function actingOrgOwner(Organization $organization): User
    {
        $this->seed(RolesAndPermissionsSeeder::class);
        $user = User::factory()->create();
        $organization->update(['owner_user_id' => $user->id]);
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

    public function test_soumission_kyc_requiert_les_deux_documents(): void
    {
        $organization = Organization::factory()->create();
        $this->actingOrgOwner($organization);

        $response = $this->postJson("/api/v1/organizations/{$organization->uuid}/kyc", [
            'identity_document_type' => 'national_id',
            'legal_representative_name' => 'Jean Test',
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['identity_document', 'business_document']);
    }

    public function test_soumission_kyc_passe_le_statut_a_pending(): void
    {
        $organization = Organization::factory()->create();
        $this->actingOrgOwner($organization);

        $response = $this->postJson("/api/v1/organizations/{$organization->uuid}/kyc", [
            'identity_document_type' => 'national_id',
            'identity_document' => UploadedFile::fake()->create('cni.pdf', 500, 'application/pdf'),
            'business_document' => UploadedFile::fake()->create('rccm.pdf', 500, 'application/pdf'),
            'legal_representative_name' => 'Jean Test',
        ]);

        $response->assertOk();
        $this->assertEquals(OrganizationKycStatus::PENDING, $organization->fresh()->kyc_status);
        $this->assertNotNull($organization->fresh()->kyc_submitted_at);
    }

    public function test_un_membre_non_owner_non_admin_ne_peut_pas_soumettre_le_kyc(): void
    {
        $this->seed(RolesAndPermissionsSeeder::class);
        $organization = Organization::factory()->create();

        $member = User::factory()->create();
        $organization->users()->attach($member->id, [
            'role_slug' => 'member',
            'status' => 'active',
            'joined_at' => now(),
        ]);
        Sanctum::actingAs($member);

        $response = $this->postJson("/api/v1/organizations/{$organization->uuid}/kyc", [
            'identity_document_type' => 'national_id',
            'identity_document' => UploadedFile::fake()->create('cni.pdf', 500, 'application/pdf'),
            'business_document' => UploadedFile::fake()->create('rccm.pdf', 500, 'application/pdf'),
            'legal_representative_name' => 'Jean Test',
        ]);

        $response->assertStatus(403);
    }

    public function test_seul_le_super_admin_peut_revoir_un_kyc(): void
    {
        $organization = Organization::factory()->create(['kyc_status' => OrganizationKycStatus::PENDING]);
        $this->actingOrgOwner($organization);

        $response = $this->postJson("/api/v1/organizations/{$organization->uuid}/kyc/review", [
            'decision' => 'verified',
        ]);

        $response->assertStatus(403);
    }

    public function test_approbation_kyc_par_le_super_admin(): void
    {
        $organization = Organization::factory()->create(['kyc_status' => OrganizationKycStatus::PENDING]);
        $superAdmin = $this->actingSuperAdmin();

        $response = $this->postJson("/api/v1/organizations/{$organization->uuid}/kyc/review", [
            'decision' => 'verified',
        ]);

        $response->assertOk();
        $organization->refresh();
        $this->assertEquals(OrganizationKycStatus::VERIFIED, $organization->kyc_status);
        $this->assertEquals($superAdmin->id, $organization->kyc_reviewed_by);
        $this->assertNotNull($organization->kyc_reviewed_at);
    }

    public function test_rejet_kyc_requiert_un_motif(): void
    {
        $organization = Organization::factory()->create(['kyc_status' => OrganizationKycStatus::PENDING]);
        $this->actingSuperAdmin();

        $response = $this->postJson("/api/v1/organizations/{$organization->uuid}/kyc/review", [
            'decision' => 'rejected',
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['rejection_reason']);
    }

    public function test_liste_des_kyc_en_attente_reservee_au_super_admin(): void
    {
        Organization::factory()->create(['kyc_status' => OrganizationKycStatus::PENDING]);
        $organization = Organization::factory()->create();
        $this->actingOrgOwner($organization);

        $response = $this->getJson('/api/v1/organizations/kyc/pending');

        $response->assertStatus(403);
    }
}

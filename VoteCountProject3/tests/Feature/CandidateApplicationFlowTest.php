<?php

namespace Tests\Feature;

use App\Models\Candidate;
use App\Models\CandidateApplication;
use App\Models\Election;
use App\Models\Organization;
use App\Models\User;
use App\Services\RoleService;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Str;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * Flux complet des candidatures publiques (candidate_applications), câblé de
 * bout en bout (2026-07-20) :
 *   1. dépôt public → ligne pending
 *   2. l'admin la voit via l'endpoint org-level getApplications
 *   3. approbation → crée un Candidate + statut approved
 *   4. rejet → statut rejected + motif
 * Corrige aussi CandidateApplicationPolicy qui exigeait une permission
 * inexistante ('manage candidates') → seul le super_admin pouvait approuver.
 */
class CandidateApplicationFlowTest extends TestCase
{
    use RefreshDatabase;

    private function ownerWithOpenElection(): array
    {
        $this->seed(RolesAndPermissionsSeeder::class);
        $owner = User::factory()->create();
        $org = Organization::factory()->create(['owner_user_id' => $owner->id]);
        $org->users()->attach($owner->id, ['role_slug' => 'owner', 'status' => 'active', 'joined_at' => now()]);
        RoleService::assignRoleToUser($owner, 'organization_owner');

        $election = Election::factory()->create([
            'organization_id' => $org->id,
            'created_by' => $owner->id,
            'election_mode' => 'public',
            'accepts_candidates' => true,
            'candidacy_start_at' => now()->subDay(),
            'candidacy_end_at' => now()->addWeek(),
        ]);

        return [$owner, $org, $election];
    }

    public function test_depot_public_cree_une_candidature_pending(): void
    {
        Queue::fake();
        [, , $election] = $this->ownerWithOpenElection();

        $response = $this->postJson("/api/v1/elections/{$election->uuid}/candidate-applications", [
            'first_name' => 'Awa',
            'last_name' => 'Nkeng',
            'email' => 'awa@example.com',
        ]);

        $response->assertCreated();
        $this->assertDatabaseHas('candidate_applications', [
            'election_id' => $election->id,
            'email' => 'awa@example.com',
            'application_status' => 'pending',
        ]);
    }

    public function test_admin_voit_la_candidature_dans_endpoint_org(): void
    {
        [$owner, $org, $election] = $this->ownerWithOpenElection();
        CandidateApplication::create([
            'uuid' => (string) Str::uuid(),
            'election_id' => $election->id,
            'first_name' => 'Awa', 'last_name' => 'Nkeng',
            'email' => 'awa@example.com', 'phone' => '600000000',
            'application_status' => 'pending',
        ]);

        Sanctum::actingAs($owner);
        $response = $this->getJson("/api/v1/organizations/{$org->uuid}/candidate-applications?status=pending");

        $response->assertOk();
        $data = collect($response->json('data'));
        $this->assertSame(1, $data->count());
        $this->assertSame('awa@example.com', $data->first()['email']);
        $this->assertSame($election->uuid, $data->first()['election']['uuid']);
    }

    public function test_owner_approuve_et_un_candidat_est_cree(): void
    {
        [$owner, , $election] = $this->ownerWithOpenElection();
        $application = CandidateApplication::create([
            'uuid' => (string) Str::uuid(),
            'election_id' => $election->id,
            'first_name' => 'Awa', 'last_name' => 'Nkeng',
            'email' => 'awa@example.com', 'phone' => '600000000',
            'application_status' => 'pending',
        ]);

        Sanctum::actingAs($owner);
        $response = $this->postJson("/api/v1/elections/{$election->uuid}/candidate-applications/{$application->uuid}/approve");

        $response->assertOk();
        $this->assertSame('approved', $application->fresh()->application_status);
        $this->assertDatabaseHas('candidates', [
            'election_id' => $election->id,
            'email' => 'awa@example.com',
        ]);
    }

    public function test_owner_rejette_avec_motif(): void
    {
        [$owner, , $election] = $this->ownerWithOpenElection();
        $application = CandidateApplication::create([
            'uuid' => (string) Str::uuid(),
            'election_id' => $election->id,
            'first_name' => 'Awa', 'last_name' => 'Nkeng',
            'email' => 'awa@example.com', 'phone' => '600000000',
            'application_status' => 'pending',
        ]);

        Sanctum::actingAs($owner);
        $response = $this->postJson("/api/v1/elections/{$election->uuid}/candidate-applications/{$application->uuid}/reject", [
            'reason' => 'Dossier incomplet',
        ]);

        $response->assertOk();
        $fresh = $application->fresh();
        $this->assertSame('rejected', $fresh->application_status);
        $this->assertSame('Dossier incomplet', $fresh->rejection_reason);
        $this->assertDatabaseMissing('candidates', ['email' => 'awa@example.com']);
    }

    public function test_un_tiers_ne_peut_pas_approuver(): void
    {
        [, , $election] = $this->ownerWithOpenElection();
        $application = CandidateApplication::create([
            'uuid' => (string) Str::uuid(),
            'election_id' => $election->id,
            'first_name' => 'Awa', 'last_name' => 'Nkeng',
            'email' => 'awa@example.com', 'phone' => '600000000',
            'application_status' => 'pending',
        ]);

        $stranger = User::factory()->create();
        Sanctum::actingAs($stranger);
        $response = $this->postJson("/api/v1/elections/{$election->uuid}/candidate-applications/{$application->uuid}/approve");

        $response->assertStatus(403);
    }
}

<?php

namespace Tests\Feature;

use App\Models\AuditLog;
use App\Models\Organization;
use App\Models\User;
use App\Services\RoleService;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * AuditController::index() n'avait ni scoping par organisation, ni filtre
 * de date, ni recherche texte — et retournait le modèle Eloquent brut
 * (entity_type = "App\Models\Election", pas de nom/initiales d'utilisateur).
 */
class AuditControllerTest extends TestCase
{
    use RefreshDatabase;

    private function actingWithPermission(): User
    {
        $this->seed(RolesAndPermissionsSeeder::class);
        $user = User::factory()->create();
        RoleService::assignRoleToUser($user, 'organization_owner');
        Sanctum::actingAs($user);

        return $user;
    }

    private function makeLog(array $overrides = []): AuditLog
    {
        return AuditLog::create(array_merge([
            'action' => 'created',
            'entity_type' => 'App\\Models\\Election',
            'entity_id' => 1,
            'created_at' => now(),
        ], $overrides));
    }

    public function test_index_scope_par_organisation(): void
    {
        $this->actingWithPermission();
        $orgA = Organization::factory()->create();
        $orgB = Organization::factory()->create();
        $this->makeLog(['organization_id' => $orgA->id]);
        $this->makeLog(['organization_id' => $orgB->id]);

        $response = $this->getJson("/api/v1/audit-logs?organization_uuid={$orgA->uuid}");

        $response->assertOk();
        $this->assertCount(1, $response->json('data'));
    }

    public function test_index_filtre_par_plage_de_dates(): void
    {
        $this->actingWithPermission();
        $this->makeLog(['created_at' => now()->subDays(10)]);
        $this->makeLog(['created_at' => now()]);

        $response = $this->getJson('/api/v1/audit-logs?date_from=' . now()->subDay()->toDateString());

        $response->assertOk();
        $this->assertCount(1, $response->json('data'));
    }

    public function test_index_formatte_le_libelle_daction_et_dentite(): void
    {
        $this->actingWithPermission();
        $this->makeLog(['action' => 'deleted', 'entity_type' => 'App\\Models\\Candidate']);

        $response = $this->getJson('/api/v1/audit-logs');

        $response->assertOk();
        $this->assertEquals('Supprimé', $response->json('data.0.action_label'));
        $this->assertEquals('Candidate', $response->json('data.0.entity_label'));
    }
}

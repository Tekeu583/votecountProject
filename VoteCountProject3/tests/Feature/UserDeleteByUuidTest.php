<?php

namespace Tests\Feature;

use App\Models\User;
use App\Services\RoleService;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * Régression : UserController::show/update/destroy faisaient
 * User::findOrFail($id) alors que la clé de route est l'uuid (HasUuid) et que
 * le frontend envoie l'uuid → recherche par clé primaire bigint = erreur SQL
 * PostgreSQL, la suppression/édition d'un utilisateur échouait (2026-07-23).
 */
class UserDeleteByUuidTest extends TestCase
{
    use RefreshDatabase;

    private function actingSuperAdmin(): User
    {
        $this->seed(RolesAndPermissionsSeeder::class);
        $admin = User::factory()->create();
        RoleService::assignRoleToUser($admin, 'super_admin');
        Sanctum::actingAs($admin);

        return $admin;
    }

    public function test_suppression_par_uuid_fonctionne(): void
    {
        $this->actingSuperAdmin();
        $cible = User::factory()->create();

        $response = $this->deleteJson("/api/v1/users/{$cible->uuid}");

        $response->assertOk();
        $this->assertSoftDeleted('users', ['id' => $cible->id]);
    }

    public function test_affichage_par_uuid_fonctionne(): void
    {
        $this->actingSuperAdmin();
        $cible = User::factory()->create();

        $this->getJson("/api/v1/users/{$cible->uuid}")->assertOk();
    }

    public function test_uuid_inexistant_renvoie_404(): void
    {
        $this->actingSuperAdmin();

        $this->deleteJson('/api/v1/users/00000000-0000-0000-0000-000000000000')
            ->assertStatus(404);
    }

    public function test_un_non_super_admin_ne_peut_pas_supprimer_un_compte(): void
    {
        $this->seed(RolesAndPermissionsSeeder::class);
        $orgOwner = User::factory()->create();
        RoleService::assignRoleToUser($orgOwner, 'organization_owner');
        Sanctum::actingAs($orgOwner);

        $cible = User::factory()->create();

        $response = $this->deleteJson("/api/v1/users/{$cible->uuid}");

        $response->assertStatus(403);
        $this->assertDatabaseHas('users', ['id' => $cible->id, 'deleted_at' => null]);
    }
}

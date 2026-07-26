<?php

namespace Tests\Feature;

use App\Models\User;
use App\Services\RoleService;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * Fonctionnalité de suspension de compte (2026-07-23) :
 *  - endpoints suspend/activate réservés au super_admin ;
 *  - le login bloque suspended ET banned ;
 *  - le middleware 'active' coupe immédiatement une session en cours ;
 *  - on ne peut pas suspendre son propre compte.
 */
class UserSuspensionTest extends TestCase
{
    use RefreshDatabase;

    private function superAdmin(): User
    {
        $this->seed(RolesAndPermissionsSeeder::class);
        $admin = User::factory()->create(['status' => 'active']);
        RoleService::assignRoleToUser($admin, 'super_admin');

        return $admin;
    }

    public function test_super_admin_peut_suspendre_un_compte(): void
    {
        Sanctum::actingAs($this->superAdmin());
        $cible = User::factory()->create(['status' => 'active']);

        $response = $this->postJson("/api/v1/users/{$cible->uuid}/suspend", [
            'reason' => 'Comportement frauduleux',
        ]);

        $response->assertOk();
        $cible->refresh();
        $this->assertSame('suspended', $cible->status->value);
        $this->assertSame('Comportement frauduleux', $cible->suspension_reason);
        $this->assertNotNull($cible->suspended_at);
    }

    public function test_reactivation_remet_le_compte_actif(): void
    {
        Sanctum::actingAs($this->superAdmin());
        $cible = User::factory()->create(['status' => 'suspended', 'suspended_at' => now(), 'suspension_reason' => 'x']);

        $this->postJson("/api/v1/users/{$cible->uuid}/activate")->assertOk();

        $cible->refresh();
        $this->assertSame('active', $cible->status->value);
        $this->assertNull($cible->suspended_at);
        $this->assertNull($cible->suspension_reason);
    }

    public function test_on_ne_peut_pas_suspendre_son_propre_compte(): void
    {
        $admin = $this->superAdmin();
        Sanctum::actingAs($admin);

        $this->postJson("/api/v1/users/{$admin->uuid}/suspend")
            ->assertStatus(422);
    }

    public function test_un_non_super_admin_ne_peut_pas_suspendre(): void
    {
        $this->seed(RolesAndPermissionsSeeder::class);
        $owner = User::factory()->create(['status' => 'active']);
        RoleService::assignRoleToUser($owner, 'organization_owner');
        Sanctum::actingAs($owner);

        $cible = User::factory()->create(['status' => 'active']);

        $this->postJson("/api/v1/users/{$cible->uuid}/suspend")
            ->assertStatus(403);
        $this->assertSame('active', $cible->fresh()->status->value);
    }

    public function test_login_bloque_un_compte_suspendu(): void
    {
        User::factory()->create([
            'email' => 'sus@example.com',
            'password' => bcrypt('password123'),
            'status' => 'suspended',
            'email_verified_at' => now(),
        ]);

        $this->postJson('/api/v1/auth/login', [
            'email' => 'sus@example.com',
            'password' => 'password123',
        ])->assertStatus(403);
    }

    public function test_login_bloque_un_compte_banni(): void
    {
        User::factory()->create([
            'email' => 'ban@example.com',
            'password' => bcrypt('password123'),
            'status' => 'banned',
            'email_verified_at' => now(),
        ]);

        $this->postJson('/api/v1/auth/login', [
            'email' => 'ban@example.com',
            'password' => 'password123',
        ])->assertStatus(403);
    }

    public function test_middleware_coupe_une_session_en_cours_apres_suspension(): void
    {
        $user = User::factory()->create(['status' => 'active']);
        Sanctum::actingAs($user);

        // Requête authentifiée normale → OK
        $this->getJson('/api/v1/auth/me')->assertOk();

        // Suspension pendant la session, puis nouvelle requête → 403 immédiat
        $user->suspend('test');
        $this->getJson('/api/v1/auth/me')->assertStatus(403);
    }
}

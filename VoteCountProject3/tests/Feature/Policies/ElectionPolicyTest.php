<?php

namespace Tests\Feature\Policies;

use App\Models\Election;
use App\Models\Organization;
use App\Models\User;
use App\Services\RoleService;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class ElectionPolicyTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // Create roles
        Role::firstOrCreate(['name' => 'super_admin', 'guard_name' => 'web']);
        Role::firstOrCreate(['name' => 'organization_owner', 'guard_name' => 'web']);
    }

    public function test_super_admin_can_do_anything()
    {
        $user = User::factory()->create();
        RoleService::assignRoleToUser($user, 'super_admin');
        $organization = Organization::factory()->create();
        $election = Election::factory()->create(['organization_id' => $organization->id]);

        $this->assertTrue($user->can('view', $election));
        $this->assertTrue($user->can('update', $election));
        $this->assertTrue($user->can('delete', $election));
    }

    public function test_creator_can_update_election()
    {
        $user = User::factory()->create();
        $election = Election::factory()->create(['created_by' => $user->id]);

        $this->assertTrue($user->can('update', $election));
    }

    public function test_regular_user_cannot_update_election()
    {
        $user = User::factory()->create();
        $organization = Organization::factory()->create();
        $election = Election::factory()->create([
            'organization_id' => $organization->id,
        ]);

        $this->assertFalse($user->can('update', $election));
    }

    /**
     * Régression : organization_owner détenait 'edit elections'/'delete
     * elections' GLOBALEMENT (pas par organisation) — update()/delete()
     * retombaient sur ce check permission quand creator/owner/pivot
     * échouaient, autorisant à tort la modification d'élections d'une
     * organisation tierce. Voir ElectionCategoryCrossOrgAuthorizationTest
     * pour le cas découvert côté endpoint catégories (2026-07-18).
     */
    public function test_owner_dune_autre_organisation_ne_peut_pas_modifier_ou_supprimer()
    {
        // Seed complet (pas juste Role::firstOrCreate du setUp()) : il faut
        // que organization_owner détienne réellement 'edit elections'/
        // 'delete elections' pour que ce test prouve quelque chose — sinon
        // il passerait de toute façon, permission ou pas.
        $this->seed(RolesAndPermissionsSeeder::class);
        $owner = User::factory()->create();
        RoleService::assignRoleToUser($owner, 'organization_owner');
        Organization::factory()->create(['owner_user_id' => $owner->id]);

        $otherOrg = Organization::factory()->create();
        $election = Election::factory()->create(['organization_id' => $otherOrg->id]);

        $this->assertFalse($owner->can('update', $election));
        $this->assertFalse($owner->can('delete', $election));
    }
}

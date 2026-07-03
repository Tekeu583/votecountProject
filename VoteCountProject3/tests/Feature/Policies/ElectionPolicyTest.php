<?php

namespace Tests\Feature\Policies;

use App\Models\Election;
use App\Models\Organization;
use App\Models\User;
use App\Services\RoleService;
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
}

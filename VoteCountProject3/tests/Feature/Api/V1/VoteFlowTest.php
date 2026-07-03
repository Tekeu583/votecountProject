<?php

namespace Tests\Feature\Api\V1;

use App\Models\Candidate;
use App\Models\Election;
use App\Models\Elector;
use App\Models\Organization;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class VoteFlowTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // Configurer l'environnement de test
        config()->set('queue.default', 'sync');
        config()->set('mail.default', 'array');
        config()->set('cache.default', 'array');
        $this->seedRoles();
        // Créer les données de base
        $this->artisan('migrate:fresh', ['--env' => 'testing', '--force' => true]);
        $this->artisan('db:seed', ['--env' => 'testing', '--force' => true]);
    }

    protected function seedRoles(): void
    {
        // Créer les rôles manuellement pour les tests
        Role::firstOrCreate(['name' => 'super_admin', 'guard_name' => 'web']);
        Role::firstOrCreate(['name' => 'organization_owner', 'guard_name' => 'web']);
        Role::firstOrCreate(['name' => 'user', 'guard_name' => 'web']);
    }

    public function test_complete_vote_flow(): void
    {
        $user = User::factory()->create([
            'uuid' => Str::uuid()->toString(),
            'first_name' => 'Admin',
            'last_name' => 'User',
            'email' => 'admin_'.Str::random(8).'@example.com',
            'password' => bcrypt('password'),
            'email_verified_at' => now(),
            'status' => 'active',
        ]);
        \App\Services\RoleService::assignRoleToUser($user, 'organization_owner');

        // Create organization
        $organization = Organization::create([
            'uuid' => Str::uuid()->toString(),
            'name' => 'Test Organization',
            'slug' => 'test-org',
            'email' => 'org_'.Str::random(8).'@example.com',
            'owner_user_id' => $user->id,
            'status' => 'active',
            'verified_at' => now(),
        ]);

        // Link user to organization
        $organization->users()->attach($user->id, [
            'role_slug' => 'owner',
            'joined_at' => now(),
            'status' => 'active',
        ]);

        // Update organization owner
        $organization->owner_user_id = $user->id;
        $organization->save();
        $election = Election::factory()->create([
            'created_by' => $user->id,
            'status' => 'published',
            'start_at' => now()->subHour(),
            'end_at' => now()->addHour(),
        ]);

        // Create election
        $election = Election::create([
            'uuid' => Str::uuid()->toString(),
            'organization_id' => $organization->id,
            'created_by' => $user->id,
            'title' => 'Test Election',
            'slug' => 'test-election',
            'status' => 'published',
            'start_at' => now()->subHour(),
            'end_at' => now()->addHours(2),
            'vote_type' => 'single',
            'max_votes_per_user' => 1,
            'otp_required' => false,
            'public_results' => true,
        ]);

        // Create candidate
        $candidate = Candidate::create([
            'uuid' => Str::uuid()->toString(),
            'election_id' => $election->id,
            'full_name' => 'Test Candidate',
            'slug' => 'test-candidate',
            'status' => 'approved',
            'approved_at' => now(),
            'position' => 1,
            'candidate_number' => 1,
        ]);

        // Create elector
        $voterCode = 'VOTER_'.strtoupper(Str::random(8));
        $elector = Elector::create([
            'uuid' => Str::uuid()->toString(),
            'election_id' => $election->id,
            'full_name' => 'Test Voter',
            'email' => 'voter_'.Str::random(8).'@example.com',
            'voter_code' => $voterCode,
            'status' => 'active',
            'verification_status' => 'verified',
            'verified_at' => now(),
            'has_voted' => false,
        ]);

        // Submit vote
        $response = $this->postJson("/api/v1/elections/{$election->uuid}/vote", [
            'voter_code' => $elector->voter_code,
            'items' => [
                [
                    'candidate_id' => $candidate->uuid,
                ],
            ],
            'idempotency_key' => 'test_'.uniqid(),
        ]);

        // Debug output if fails
        if ($response->getStatusCode() !== 201) {
            dump('Response Status: '.$response->getStatusCode());
            dump('Response Body: '.$response->getContent());
        }

        $response->assertStatus(201);
        $response->assertJsonStructure([
            'success',
            'data' => [
                'uuid',
                'status',
            ],
        ]);

        // Verify vote was recorded
        $this->assertDatabaseHas('votes', [
            'election_id' => $election->id,
            'elector_id' => $elector->id,
            'status' => 'completed',
        ]);

        // Check elector has voted
        $elector->refresh();
        $this->assertTrue($elector->has_voted);

        // Verify election vote count increased
        $election->refresh();
        $this->assertEquals(1, $election->total_votes);
    }
}

<?php

namespace Tests\Unit;

use App\Enums\ElectionStatus;
use App\Enums\UserStatus;
use App\Models\Election;
use App\Models\User;
use Illuminate\Support\Str;
use Tests\TestCase;

class ModelsTest extends TestCase
{
    public function test_user_has_uuid_on_create()
    { // Utiliser un email unique à chaque test
        $uniqueEmail = 'test_' . Str::random(10) . '@example.com';
        $user = User::create([
            'first_name' => 'tekeu',
            'last_name' => 'arsene',
            'email' => $uniqueEmail,
            'password' => bcrypt('password'),
        ]);

        $this->assertNotNull($user->uuid);
        $this->assertEquals(UserStatus::PENDING_VERIFICATION, $user->status);
    }

    public function test_user_full_name_accessor()
    {
        $user = new User([
            'first_name' => 'tekeu',
            'last_name' => 'arsene',
        ]);

        $this->assertEquals('tekeu arsene', $user->full_name);
    }

    public function test_election_has_votable_status()
    {
        $election = new Election;
        $election->status = ElectionStatus::ONGOING;
        $election->start_at = now()->subHour();
        $election->end_at = now()->addHour();

        $this->assertTrue($election->is_votable);
    }

    public function test_election_progress_percentage()
    {
        $election = new Election;
        $election->start_at = now()->subHours(2);
        $election->end_at = now()->addHours(2);

        $this->assertEquals(50, round($election->progress_percentage));
    }
}

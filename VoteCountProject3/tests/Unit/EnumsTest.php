<?php

namespace Tests\Unit;

use App\Enums\ElectionStatus;
use App\Enums\UserStatus;
use App\Enums\VoteType;
use Tests\TestCase;

class EnumsTest extends TestCase
{
    public function test_user_status_has_labels()
    {
        $this->assertEquals('Actif', UserStatus::ACTIVE->label());
        $this->assertEquals('success', UserStatus::ACTIVE->color());
    }

    public function test_election_status_is_votable()
    {
        $this->assertFalse(ElectionStatus::PUBLISHED->isVotable());
        $this->assertTrue(ElectionStatus::ONGOING->isVotable());
        $this->assertFalse(ElectionStatus::CLOSED->isVotable());
    }

    public function test_vote_type_requires_ranking()
    {
        $this->assertTrue(VoteType::RANKED->requiresRanking());
        $this->assertFalse(VoteType::SINGLE->requiresRanking());
    }
}
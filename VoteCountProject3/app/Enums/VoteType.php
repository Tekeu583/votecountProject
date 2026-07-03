<?php

namespace App\Enums;

enum VoteType: string
{
    case SINGLE = 'single';
    case MULTIPLE = 'multiple';
    case RANKED = 'ranked';
    case SCORE = 'score';
    case WEIGHTED = 'weighted';

    public function label(): string
    {
        return match ($this) {
            self::SINGLE => 'Vote unique',
            self::MULTIPLE => 'Vote multiple',
            self::RANKED => 'Vote par classement',
            self::SCORE => 'Vote par score',
            self::WEIGHTED => 'Vote pondéré',
        };
    }

    public function requiresRanking(): bool
    {
        return $this === self::RANKED;
    }

    public function requiresScore(): bool
    {
        return $this === self::SCORE;
    }
}

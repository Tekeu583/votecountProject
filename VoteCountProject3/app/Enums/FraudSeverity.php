<?php

namespace App\Enums;

enum FraudSeverity: string
{
    case LOW = 'low';
    case MEDIUM = 'medium';
    case HIGH = 'high';
    case CRITICAL = 'critical';

    public function label(): string
    {
        return match ($this) {
            self::LOW => 'Faible',
            self::MEDIUM => 'Moyenne',
            self::HIGH => 'Élevée',
            self::CRITICAL => 'Critique',
        };
    }

    public function threshold(): float
    {
        return match ($this) {
            self::LOW => 0.3,
            self::MEDIUM => 0.6,
            self::HIGH => 0.8,
            self::CRITICAL => 0.95,
        };
    }

    public function requiresManualReview(): bool
    {
        return in_array($this, [self::HIGH, self::CRITICAL]);
    }
}

<?php

namespace App\Enums;

enum OrganizationKycStatus: string
{
    case NOT_SUBMITTED = 'not_submitted';
    case PENDING = 'pending';
    case VERIFIED = 'verified';
    case REJECTED = 'rejected';

    public function label(): string
    {
        return match ($this) {
            self::NOT_SUBMITTED => 'Non soumis',
            self::PENDING => 'En attente de vérification',
            self::VERIFIED => 'Vérifié',
            self::REJECTED => 'Rejeté',
        };
    }

    public function isVerified(): bool
    {
        return $this === self::VERIFIED;
    }
}

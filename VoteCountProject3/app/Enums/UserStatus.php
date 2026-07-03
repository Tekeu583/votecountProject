<?php

namespace App\Enums;

enum UserStatus: string
{
    case ACTIVE = 'active';
    case INACTIVE = 'inactive';
    case SUSPENDED = 'suspended';
    case BANNED = 'banned';
    case PENDING_VERIFICATION = 'pending_verification';

    public function label(): string
    {
        return match ($this) {
            self::ACTIVE => 'Actif',
            self::INACTIVE => 'Inactif',
            self::SUSPENDED => 'Suspendu',
            self::BANNED => 'Banni',
            self::PENDING_VERIFICATION => 'En attente de vérification',
        };
    }

    public function color(): string
    {
        return match ($this) {
            self::ACTIVE => 'success',
            self::INACTIVE => 'secondary',
            self::SUSPENDED => 'warning',
            self::BANNED => 'danger',
            self::PENDING_VERIFICATION => 'info',
        };
    }

    public static function toArray(): array
    {
        return array_column(self::cases(), 'value');
    }
}

<?php

namespace App\Enums;

enum ElectionStatus: string
{
    case DRAFT = 'draft';
    case PENDING = 'pending';
    case PUBLISHED = 'published';
    case ONGOING = 'ongoing';
    case PAUSED = 'paused';
    case CLOSED = 'closed';
    case COMPLETED = 'completed';
    case CANCELLED = 'cancelled';
    case ARCHIVED = 'archived';

    public function label(): string
    {
        return match ($this) {
            self::DRAFT => 'Brouillon',
            self::PENDING => 'En attente de validation',
            self::PUBLISHED => 'publiée mais pas encore ouverte',
            self::ONGOING => ' vote en cours',
            self::PAUSED => 'suspendue',
            self::CLOSED => 'vote terminé',
            self::COMPLETED => 'résultats calculés et finalisés',
            self::CANCELLED => 'Annulée',
            self::ARCHIVED => 'Archivée',
        };
    }

    public function isEditable(): bool
    {
        return in_array($this, [
            self::DRAFT,
            self::PENDING,
            self::PUBLISHED,
        ]);
    }

    public function isVotable(): bool
    {
        return $this === self::ONGOING;
    }
    public function isTerminal(): bool
    {
        return in_array($this, [
            self::CLOSED,
            self::COMPLETED,
            self::CANCELLED,
            self::ARCHIVED,
        ]);
    }
    /**
     * Statuts considérés "finis" pour les stats et filtres.
     * CLOSED + COMPLETED sont tous deux des fins d'élection.
     */
    public static function finishedValues(): array
    {
        return [self::CLOSED->value, self::COMPLETED->value];
    }
}

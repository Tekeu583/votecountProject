<?php

namespace App\Enums;

enum WithdrawalStatus: string
{
    case PENDING = 'pending';
    case APPROVED = 'approved';
    case REJECTED = 'rejected';
    case PAID = 'paid';
    case CANCELLED = 'cancelled';

    public function label(): string
    {
        return match ($this) {
            self::PENDING => 'En attente',
            self::APPROVED => 'Approuvée',
            self::REJECTED => 'Rejetée',
            self::PAID => 'Payée',
            self::CANCELLED => 'Annulée',
        };
    }

    public function isFinal(): bool
    {
        return in_array($this, [self::REJECTED, self::PAID, self::CANCELLED]);
    }

    /**
     * Les demandes dans ces statuts bloquent déjà leur montant du solde
     * disponible de l'organisation — une demande en attente réserve son
     * montant, pas seulement une fois approuvée (choix métier confirmé :
     * évite qu'un admin_org cumule plusieurs demandes au-delà de son solde
     * réel).
     */
    public function reservesBalance(): bool
    {
        return in_array($this, [self::PENDING, self::APPROVED, self::PAID]);
    }
}

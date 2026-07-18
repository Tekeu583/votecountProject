<?php

namespace App\Services;

use App\Enums\WithdrawalStatus;
use App\Models\Organization;
use App\Models\PaymentTransaction;
use App\Models\WithdrawalRequest;


class RevenueService
{
    public function totalCompletedRevenue(Organization $organization): float
    {
        return (float) PaymentTransaction::forOrganization($organization->id)
            ->where('status', 'completed')
            ->sum('net_amount');
    }

    /**
     * Montant déjà réservé par des demandes de retrait en cours ou payées —
     * cf. WithdrawalStatus::reservesBalance() pour la liste des statuts
     * concernés (une demande en attente réserve déjà son montant).
     */
    public function totalReserved(Organization $organization): float
    {
        return (float) WithdrawalRequest::forOrganization($organization->id)
            ->whereIn('status', [
                WithdrawalStatus::PENDING->value,
                WithdrawalStatus::APPROVED->value,
                WithdrawalStatus::PAID->value,
            ])
            ->sum('amount');
    }

    public function availableBalance(Organization $organization): float
    {
        return round(
            $this->totalCompletedRevenue($organization) - $this->totalReserved($organization),
            2
        );
    }
}

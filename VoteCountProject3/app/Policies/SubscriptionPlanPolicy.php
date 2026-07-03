<?php

namespace App\Policies;

use App\Models\User;
use App\Models\SubscriptionPlan;

class SubscriptionPlanPolicy
{
    public function before(User $user, string $ability): ?bool
    {
        if ($user->isSuperAdmin()) {
            return true;
        }
        return null;
    }

    public function viewAny(User $user): bool
    {
        return true; // Tout le monde peut voir les plans
    }

    public function view(User $user, SubscriptionPlan $plan): bool
    {
        return true;
    }

    public function create(User $user): bool
    {
        return $user->can('manage subscription plans');
    }

    public function update(User $user, SubscriptionPlan $plan): bool
    {
        return $user->can('manage subscription plans');
    }

    public function delete(User $user, SubscriptionPlan $plan): bool
    {
        return $user->can('manage subscription plans');
    }
}

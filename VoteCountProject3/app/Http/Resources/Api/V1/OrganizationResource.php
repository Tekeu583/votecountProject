<?php

namespace App\Http\Resources\Api\V1;

use App\Http\Resources\Api\V1\UserResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrganizationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'uuid' => $this->uuid,
            'name' => $this->name,
            'slug' => $this->slug,
            'logo' => $this->logo_url,
            'banner' => $this->banner_url,
            'description' => $this->description,
            'email' => $this->email,
            'phone' => $this->phone,
            'website' => $this->website,
            'country' => $this->country,
            'city' => $this->city,
            'address' => $this->address,
            'status' => $this->status,
            'is_verified' => $this->is_verified,

            'subscription' => [
                'plan' => $this->relationLoaded('subscriptionPlan')
                    ? $this->subscriptionPlan?->name
                    : null,
                // hasActiveSubscription()/getCurrentSubscription() lancent chacune
                // leur propre requête à chaque appel — coûteux dès qu'une même
                // organisation ressort sur plusieurs lignes (ex: candidats/élections
                // d'une même org). Si 'subscriptions' a été eager-loadée par
                // l'appelant, on la réutilise en mémoire sans requête supplémentaire.
                'has_active' => $this->relationLoaded('subscriptions')
                    ? $this->activeSubscriptionFromLoaded() !== null
                    : $this->hasActiveSubscription(),
                'current' => $this->relationLoaded('subscriptions')
                    ? $this->activeSubscriptionFromLoaded()
                    : $this->getCurrentSubscription(),
            ],

            'statistics' => [
                'elections_count' => $this->elections_count ?? $this->elections()->count(),
                'users_count' => $this->users_count ?? $this->users()->count(),
            ],

            'owner' => $this->when(
                $this->relationLoaded('owner'),
                fn() => new UserResource($this->owner)
            ),

            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }

    /**
     * Équivalent de Organization::getCurrentSubscription() mais calculé sur la
     * collection 'subscriptions' déjà chargée en mémoire, sans requête.
     */
    private function activeSubscriptionFromLoaded(): mixed
    {
        return $this->subscriptions
            ->filter(fn ($s) => $s->status === 'active' && $s->end_at?->isFuture())
            ->sortByDesc('created_at')
            ->first();
    }
}

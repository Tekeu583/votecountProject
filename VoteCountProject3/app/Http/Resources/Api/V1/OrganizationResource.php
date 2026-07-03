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
                'has_active' => $this->hasActiveSubscription(),
                'current' => $this->getCurrentSubscription(),
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
}

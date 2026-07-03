<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SubscriptionPlanResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'uuid' => $this->uuid,
            'name' => $this->name,
            'slug' => $this->slug,
            'description' => $this->description,
            'price' => $this->price,
            'currency' => $this->currency,
            'formatted_price' => $this->formatted_price,
            'duration_days' => $this->duration_days,
            'duration_label' => $this->duration_label,
            'max_elections' => $this->max_elections,
            'max_elections_label' => $this->max_elections === -1 ? 'Illimité' : $this->max_elections,
            'max_votes' => $this->max_votes,
            'max_votes_label' => $this->max_votes === -1 ? 'Illimité' : number_format($this->max_votes),
            'max_candidates' => $this->max_candidates,
            'max_candidates_label' => $this->max_candidates === -1 ? 'Illimité' : $this->max_candidates,
            'max_storage_gb' => $this->max_storage_gb,
            'features' => $this->features,
            'status' => $this->status,
            'is_active' => $this->status === 'active',
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}

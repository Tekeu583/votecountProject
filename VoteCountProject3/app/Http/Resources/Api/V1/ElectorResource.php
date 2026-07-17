<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ElectorResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'uuid' => $this->uuid,
            'full_name' => $this->full_name,
            'email' => $this->email,
            'phone' => $this->phone,
            'has_voted' => $this->has_voted,
            'status' => $this->status,
            'verification_status' => $this->verification_status,
            'verified_at' => $this->verified_at?->toIso8601String(),
            'created_at' => $this->created_at?->toIso8601String(),

            'election' => $this->whenLoaded('election', fn () => [
                'uuid' => $this->election->uuid,
                'title' => $this->election->title,
                'election_mode' => $this->election->election_mode,
            ]),
        ];
    }
}

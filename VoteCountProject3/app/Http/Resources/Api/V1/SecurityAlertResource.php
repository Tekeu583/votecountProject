<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SecurityAlertResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'uuid' => $this->uuid,
            'type' => $this->type,
            'severity' => $this->severity->value,
            'severity_label' => $this->severity->label(),
            'ip_address' => $this->ip_address,
            'device' => $this->device,
            'location' => $this->location,
            'metadata' => $this->metadata,
            'is_resolved' => ! is_null($this->resolved_at),
            'resolved_at' => $this->resolved_at?->toIso8601String(),
            'created_at' => $this->created_at?->toIso8601String(),

            'election' => $this->whenLoaded('election', fn () => $this->election ? [
                'uuid' => $this->election->uuid,
                'title' => $this->election->title,
            ] : null),

            'user' => $this->whenLoaded('user', fn () => $this->user ? [
                'uuid' => $this->user->uuid,
                'full_name' => $this->user->full_name,
                'email' => $this->user->email,
            ] : null),

            'resolver' => $this->whenLoaded('resolver', fn () => $this->resolver ? [
                'uuid' => $this->resolver->uuid,
                'full_name' => $this->resolver->full_name,
            ] : null),
        ];
    }
}

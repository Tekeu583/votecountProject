<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class WithdrawalRequestResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'uuid' => $this->uuid,
            'amount' => $this->amount,
            'currency' => $this->currency,
            'phone_number' => $this->phone_number,
            'payout_provider' => $this->payout_provider,
            'status' => $this->status->value,
            'status_label' => $this->status->label(),
            'rejection_reason' => $this->rejection_reason,
            'payment_reference' => $this->payment_reference,
            'admin_notes' => $this->admin_notes,
            'reviewed_at' => $this->reviewed_at?->toIso8601String(),
            'paid_at' => $this->paid_at?->toIso8601String(),
            'created_at' => $this->created_at?->toIso8601String(),

            'organization' => $this->whenLoaded('organization', fn () => [
                'uuid' => $this->organization->uuid,
                'name' => $this->organization->name,
            ]),
            'requester' => $this->whenLoaded('requester', fn () => $this->requester ? [
                'uuid' => $this->requester->uuid,
                'full_name' => $this->requester->full_name,
            ] : null),
            'reviewer' => $this->whenLoaded('reviewer', fn () => $this->reviewer ? [
                'uuid' => $this->reviewer->uuid,
                'full_name' => $this->reviewer->full_name,
            ] : null),
        ];
    }
}

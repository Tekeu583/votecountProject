<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class VoteResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'uuid' => $this->uuid,
            'status' => $this->status,
            'is_completed' => $this->is_completed,
            'vote_type' => $this->vote_type,

            'is_paid' => $this->is_paid,
            'total_amount' => $this->total_amount,
            'currency' => $this->election?->currency,

            'items' => VoteItemResource::collection($this->whenLoaded('items')),

            'receipt' => new VoteReceiptResource($this->whenLoaded('receipt')),
            'payment' => new PaymentTransactionResource($this->whenLoaded('paymentTransaction')),

            'submitted_at' => $this->submitted_at?->toIso8601String(),
            'validated_at' => $this->validated_at?->toIso8601String(),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}

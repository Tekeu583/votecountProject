<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PaymentTransactionResource extends JsonResource
{
    private const TYPE_LABELS = [
        'vote' => 'Vote payant',
        'subscription' => 'Abonnement',
    ];

    public function toArray(Request $request): array
    {
        return [
            'uuid' => $this->uuid,
            'type' => $this->type,
            'type_label' => self::TYPE_LABELS[$this->type] ?? $this->type,
            'provider' => $this->provider,
            'transaction_reference' => $this->transaction_reference,
            'amount' => $this->amount,
            'fees' => $this->fees,
            'net_amount' => $this->net_amount,
            'currency' => $this->currency,
            'status' => $this->status->value,
            'status_label' => $this->status->label(),
            'paid_at' => $this->paid_at?->toIso8601String(),
            'created_at' => $this->created_at?->toIso8601String(),
            'election' => $this->whenLoaded('election', fn () => $this->election ? [
                'uuid' => $this->election->uuid,
                'title' => $this->election->title,
            ] : null),
        ];
    }
}

<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class VoteReceiptResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'receipt_code' => $this->receipt_code,
            'qr_code' => $this->qr_code,
            'issued_at' => $this->issued_at?->toIso8601String(),
        ];
    }
}

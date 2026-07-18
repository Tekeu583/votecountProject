<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrganizationKycResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'uuid' => $this->uuid,
            'name' => $this->name,
            'email' => $this->email,
            'logo' => $this->logo_url,
            'kyc_status' => $this->kyc_status->value,
            'kyc_status_label' => $this->kyc_status->label(),
            'kyc_identity_document_type' => $this->kyc_identity_document_type,
            'kyc_identity_document_url' => $this->kyc_identity_document_url,
            'kyc_business_document_url' => $this->kyc_business_document_url,
            'kyc_legal_representative_name' => $this->kyc_legal_representative_name,
            'kyc_submitted_at' => $this->kyc_submitted_at?->toIso8601String(),
            'kyc_reviewed_at' => $this->kyc_reviewed_at?->toIso8601String(),
            'kyc_rejection_reason' => $this->kyc_rejection_reason,
        ];
    }
}

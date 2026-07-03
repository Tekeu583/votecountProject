<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CandidateDocumentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'uuid' => $this->uuid,
            'type' => $this->type,
            'type_label' => $this->getTypeLabel(),
            'file_name' => $this->file_name,
            'file_url' => $this->file_url,
            'file_size' => $this->file_size_human,
            'file_extension' => $this->file_extension,
            'is_image' => $this->isImage(),
            'is_pdf' => $this->isPdf(),
            'uploaded_at' => $this->uploaded_at?->toIso8601String(),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }

    private function getTypeLabel(): string
    {
        return match ($this->type) {
            'identity_card' => 'Carte d\'identité',
            'passport' => 'Passeport',
            'diploma' => 'Diplôme',
            'resume' => 'CV',
            'cover_letter' => 'Lettre de motivation',
            'certificate' => 'Certificat',
            'photo' => 'Photo d\'identité',
            default => ucfirst($this->type),
        };
    }
}
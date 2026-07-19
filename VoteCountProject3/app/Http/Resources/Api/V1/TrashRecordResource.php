<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TrashRecordResource extends JsonResource
{
    private const TYPE_LABELS = [
        'App\\Models\\Election' => 'Scrutin',
        'App\\Models\\Candidate' => 'Candidat',
    ];

    public function toArray(Request $request): array
    {
        $snapshot = $this->entity_snapshot ?? [];

        return [
            'uuid' => $this->uuid,
            'entity_type' => $this->entity_type,
            'entity_label' => self::TYPE_LABELS[$this->entity_type] ?? class_basename($this->entity_type),
            'name' => $snapshot['full_name'] ?? $snapshot['title'] ?? '—',
            'deleted_at' => $this->deleted_at?->toIso8601String(),
            'expires_at' => $this->expires_at?->toIso8601String(),
            'is_expired' => $this->is_expired,
            'deleted_by' => $this->whenLoaded('deleter', fn () => $this->deleter?->full_name),
        ];
    }
}

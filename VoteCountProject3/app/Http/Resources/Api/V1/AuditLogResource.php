<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AuditLogResource extends JsonResource
{
    private const ACTION_LABELS = [
        'created' => 'Créé',
        'updated' => 'Modifié',
        'deleted' => 'Supprimé',
        'restored' => 'Restauré',
        'forceDeleted' => 'Supprimé définitivement',
    ];

    public function toArray(Request $request): array
    {
        return [
            'uuid' => $this->uuid,
            'action' => $this->action,
            'action_label' => self::ACTION_LABELS[$this->action] ?? $this->action,
            'entity_type' => $this->entity_type,
            'entity_label' => class_basename($this->entity_type),
            'entity_id' => $this->entity_id,
            'old_values' => $this->old_values,
            'new_values' => $this->new_values,
            'ip_address' => $this->ip_address,
            'user_agent' => $this->user_agent,
            'created_at' => $this->created_at?->toIso8601String(),

            'user' => $this->whenLoaded('user', fn () => $this->user ? [
                'uuid' => $this->user->uuid,
                'name' => $this->user->full_name,
                'initials' => $this->userInitials(),
            ] : null),
        ];
    }

    private function userInitials(): string
    {
        $parts = array_filter(explode(' ', trim($this->user->full_name ?? '')));

        return strtoupper(implode('', array_map(fn ($p) => mb_substr($p, 0, 1), array_slice($parts, 0, 2))));
    }
}

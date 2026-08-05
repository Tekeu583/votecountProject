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

    /**
     * Libellés lisibles des colonnes les plus consultées. Toute colonne absente
     * de cette liste retombe sur son nom formaté (« start_at » → « Start at »).
     */
    private const FIELD_LABELS = [
        'title'            => 'Titre',
        'full_name'        => 'Nom complet',
        'name'             => 'Nom',
        'email'            => 'E-mail',
        'phone'            => 'Téléphone',
        'status'           => 'Statut',
        'start_at'         => 'Date de début',
        'end_at'           => 'Date de fin',
        'description'      => 'Description',
        'vote_price'       => 'Prix du vote',
        'payment_type'     => 'Type de paiement',
        'election_mode'    => 'Mode de scrutin',
        'vote_type'        => 'Type de vote',
        'visibility_type'  => 'Visibilité',
        'published_at'     => 'Publiée le',
        'closed_at'        => 'Clôturée le',
        'total_votes'      => 'Total des votes',
        'rank'             => 'Rang',
        'vote_count'       => 'Nombre de voix',
        'password'         => 'Mot de passe',
        'suspended_at'     => 'Suspendu le',
        'suspension_reason' => 'Motif de suspension',
        'voter_code'       => 'Code de vote',
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
            'changes' => $this->changes(),
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

    /**
     * Champs réellement touchés, prêts à l'affichage.
     *
     * Le journal indiquait seulement « Créé » ou « Modifié » sans jamais dire
     * QUOI : les valeurs étaient bien stockées, mais l'interface aurait dû
     * recalculer elle-même l'écart entre old_values et new_values. On le fait
     * ici, une fois, avec des libellés lisibles.
     *
     * @return array<int, array{field: string, label: string, old: mixed, new: mixed}>
     */
    private function changes(): array
    {
        // Pour une suppression, l'information utile est l'état d'avant ;
        // pour tout le reste, l'état d'après.
        $reference = $this->new_values ?: $this->old_values;

        if (empty($reference) || ! is_array($reference)) {
            return [];
        }

        $old = is_array($this->old_values) ? $this->old_values : [];
        $new = is_array($this->new_values) ? $this->new_values : [];

        $changes = [];

        foreach (array_keys($reference) as $field) {
            $changes[] = [
                'field' => $field,
                'label' => self::FIELD_LABELS[$field] ?? ucfirst(str_replace('_', ' ', $field)),
                'old'   => $this->displayable($old[$field] ?? null),
                'new'   => $this->displayable($new[$field] ?? null),
            ];
        }

        return $changes;
    }

    /**
     * Rend une valeur affichable : les colonnes JSON et les relations
     * sérialisées seraient sinon rendues comme « Array » côté interface.
     */
    private function displayable(mixed $value): ?string
    {
        if ($value === null || $value === '') {
            return null;
        }

        if (is_bool($value)) {
            return $value ? 'Oui' : 'Non';
        }

        if (is_array($value)) {
            return json_encode($value, JSON_UNESCAPED_UNICODE);
        }

        return (string) $value;
    }

    private function userInitials(): string
    {
        $parts = array_filter(explode(' ', trim($this->user->full_name ?? '')));

        return strtoupper(implode('', array_map(fn ($p) => mb_substr($p, 0, 1), array_slice($parts, 0, 2))));
    }
}

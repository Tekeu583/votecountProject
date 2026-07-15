<?php

namespace App\Http\Requests\Api\V1\Votes;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SubmitPublicVoteRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $election = $this->route('election');
        // Nombre d'items autorisés selon le vote_type
        $maxItems = match ($election?->vote_type?->value ?? 'single') {
            'single'   => 1,
            'multiple' => $election->max_choices ?? 50,
            'ranked'   => $election->candidates()->approved()->count(),
            'score'    => $election->candidates()->approved()->count(),
            'weighted' => 1,
            default    => 1,
        };

        $minItems = match ($election?->vote_type?->value ?? 'single') {
            'single'  => 1,
            default   => 1,
        };

        return [
            'items' => [
                'required',
                'array',
                "min:{$minItems}",
                "max:{$maxItems}",
            ],

            // candidate_id doit être un UUID existant dans cette élection
            'items.*.candidate_id' => [
                'required',
                'string',
                Rule::exists('candidates', 'uuid')->where(function ($query) use ($election) {
                    $query->where('election_id', $election?->id)
                        ->where('status', 'approved');
                }),
            ],

            // Champs spécifiques selon le vote_type
            'items.*.rank_position' => [
                Rule::requiredIf(fn() => $election?->vote_type?->value === 'ranked'),
                'nullable',
                'integer',
                'min:1',
            ],

            'items.*.score' => [
                Rule::requiredIf(fn() => $election?->vote_type?->value === 'score'),
                'nullable',
                'numeric',
                'min:0',
                'max:10',
            ],

            'items.*.amount' => [
                Rule::requiredIf(fn() => $election?->vote_type?->value === 'multiple'),
                'nullable',
                'numeric',
                'min:0.01',
            ],
            'idempotency_key' => [
                'required',
                'string',
                'max:100',
                'unique:votes,idempotency_key',
            ],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            $election = $this->route('election');
            if (($election?->vote_type?->value ?? null) !== 'ranked') {
                return;
            }

            $items = $this->input('items', []);
            $ranks = collect($items)
                ->pluck('rank_position')
                ->filter(fn ($r) => $r !== null && $r !== '')
                ->map(fn ($r) => (int) $r);

            // Un rank_position manquant est déjà signalé par la règle "required" ci-dessus.
            if ($ranks->count() !== count($items)) {
                return;
            }

            if ($ranks->unique()->count() !== $ranks->count()) {
                $validator->errors()->add('items', 'Chaque position de classement doit être unique (pas de doublon).');
                return;
            }

            if ($ranks->sort()->values()->all() !== range(1, $ranks->count())) {
                $validator->errors()->add('items', 'Le classement doit être une séquence continue commençant à 1, sans trou.');
            }
        });
    }

    public function messages(): array
    {
        return [
            'items.required'              => 'Vous devez sélectionner au moins un candidat.',
            'items.min'                   => 'Vous devez sélectionner au moins :min candidat(s).',
            'items.max'                   => 'Vous ne pouvez pas sélectionner plus de :max candidat(s).',
            'items.*.candidate_id.required' => 'L\'identifiant du candidat est requis.',
            'items.*.candidate_id.exists'   => 'Ce candidat n\'existe pas ou n\'est pas approuvé dans cette élection.',
            'items.*.rank_position.required' => 'La position de classement est requise pour ce type de vote.',
            'items.*.rank_position.integer'  => 'La position de classement doit être un entier.',
            'items.*.score.required'         => 'Le score est requis pour ce type de vote.',
            'items.*.score.min'              => 'Le score doit être entre 0 et 10.',
            'items.*.score.max'              => 'Le score doit être entre 0 et 10.',
            'items.*.amount.required'        => 'Vous devez indiquer un montant pour chaque candidat sélectionné.',
            'items.*.amount.min'              => 'Le montant doit être supérieur à 0.',
            'idempotency_key.required'       => 'La clé d\'idempotence est requise.',
            'idempotency_key.unique'         => 'Ce vote a déjà été soumis.',
        ];
    }
}

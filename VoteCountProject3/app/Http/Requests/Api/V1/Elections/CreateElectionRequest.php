<?php

namespace App\Http\Requests\Api\V1\Elections;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;

class CreateElectionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Auth::check() && Auth::user()->can('create elections');
    }

    public function rules(): array
    {
        return [
            'organization_id'    => ['required', 'exists:organizations,uuid'],

            'title' => ['required', 'string', 'max:200'],
            'short_description' => ['nullable', 'string', 'max:500'],
            'description' => ['nullable', 'string'],
            'banner' => ['nullable', 'image', 'max:5120', 'mimes:jpeg,png,jpg'],

            'election_mode' => ['required', 'in:public,private,restricted'],
            'vote_type' => ['required', 'in:single,multiple,ranked,weighted'],

            'visibility_type' => ['required', 'in:public,private,unlisted'],
            'payment_type' => ['required', 'in:free,paid'],
            'verification_mode'  => ['sometimes', 'in:none,email,sms,both'],
            'timezone' => ['sometimes', 'string', 'timezone'],
            'fraud_detection_enabled' => ['sometimes', 'boolean'],

            'start_at' => ['required', 'date', 'after:now'],
            'end_at' => ['required', 'date', 'after:start_at'],

            'max_votes_per_user' => ['integer', 'min:1', 'max:50'],
            'max_choices' => ['nullable', 'integer', 'min:1', 'max:50'],

            'ranking_enabled' => ['sometimes', 'boolean'],
            'otp_required' => ['sometimes', 'boolean'],
            'public_results' => ['sometimes', 'boolean'],
            'real_time_results' => ['sometimes', 'boolean'],
            'allow_guest_vote' => ['sometimes', 'boolean'],

            'vote_price' => ['required_if:payment_type,paid', 'numeric', 'min:0'],
            'currency' => ['required_with:vote_price', 'string', 'size:3'],

            'accepts_candidates' => ['sometimes', 'boolean'],
            'candidacy_start_at' => ['nullable', 'date', 'required_if:accepts_candidates,true'],
            'candidacy_end_at'   => [
                'nullable',
                'date',
                'required_if:accepts_candidates,true',
                'before:start_at',
            ],
            'max_candidates'     => ['sometimes', 'integer', 'min:0'],
            'has_categories'     => ['sometimes', 'boolean'],

            'public_weight' => ['sometimes', 'numeric', 'min:0', 'max:1'],
            'jury_weight'   => ['sometimes', 'numeric', 'min:0', 'max:1'],
        ];
    }


    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            if ($this->input('vote_type') === 'multiple' && $this->input('payment_type') !== 'paid') {
                $validator->errors()->add('vote_type', 'Le vote multiple nécessite une élection payante.');
            }

            // Une élection payante avec vote_price = 0 casse le calcul de
            // quantité (amount / vote_price) — required_if seul laisse
            // passer 0, il faut explicitement exiger > 0.
            if ($this->input('payment_type') === 'paid' && (float) $this->input('vote_price') <= 0) {
                $validator->errors()->add('vote_price', 'Le prix du vote doit être supérieur à 0 pour une élection payante.');
            }

            // public_weight/jury_weight sont des fractions 0–1 qui doivent
            // sommer à 1 pour que la formule de score pondéré ait un sens.
            if ($this->input('vote_type') === 'weighted') {
                $publicWeight = (float) ($this->input('public_weight') ?? 1.0);
                $juryWeight = (float) ($this->input('jury_weight') ?? 0);
                if (abs(($publicWeight + $juryWeight) - 1.0) > 0.001) {
                    $validator->errors()->add('jury_weight', 'La somme de public_weight et jury_weight doit être égale à 1.');
                }
            }
        });
    }

    public function messages(): array
    {
        return [
            'organization_id.required'    => 'L\'organisation est requise.',
            'organization_id.exists'      => 'Organisation introuvable.',
            'title.required'              => 'Le titre est requis.',
            'banner.max'                  => 'L\'image doit avoir une taille maximale de 5Mo.',
            'election_mode.required'      => 'Le mode d\'élection est requis.',
            'election_mode.in'            => 'Mode invalide. Valeurs : public, private, restricted.',
            'vote_type.required'          => 'Le type de vote est requis.',
            'vote_type.in'                => 'Type invalide. Valeurs : single, multiple, ranked, weighted.',
            'visibility_type.required'    => 'La visibilité est requise.',
            'visibility_type.in'          => 'Visibilité invalide. Valeurs : public, private, unlisted.',
            'payment_type.required'       => 'Le type de paiement est requis.',
            'payment_type.in'             => 'Type de paiement invalide. Valeurs : free, paid.',
            'verification_mode.in'        => 'Mode de vérification invalide. Valeurs : none, email, sms, both.',
            'start_at.required'           => 'La date de début est requise.',
            'start_at.after'              => 'La date de début doit être dans le futur.',
            'end_at.required'             => 'La date de fin est requise.',
            'end_at.after'                => 'La date de fin doit être après la date de début.',
            'vote_price.required_if'      => 'Le prix du vote est requis pour une élection payante.',
            'vote_price.min'              => 'Le prix du vote ne peut pas être négatif.',
            'currency.required_if'        => 'La devise est requise pour une élection payante.',
            'currency.size'               => 'La devise doit être un code ISO 3 lettres (ex: XAF, EUR).',
            'candidacy_start_at.required_if' => 'La date de début des candidatures est requise.',
            'candidacy_end_at.required_if'   => 'La date de fin des candidatures est requise.',
            'candidacy_end_at.before'        => 'La phase de candidature doit se terminer avant le début du vote.',
        ];
    }
}

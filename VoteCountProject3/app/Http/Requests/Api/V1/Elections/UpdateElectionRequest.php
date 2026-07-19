<?php

namespace App\Http\Requests\Api\V1\Elections;

use App\Enums\ElectionStatus;
use Illuminate\Foundation\Http\FormRequest;

class UpdateElectionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title' => ['sometimes', 'string', 'max:200'],
            'short_description' => ['nullable', 'string', 'max:500'],
            'description' => ['nullable', 'string'],
            'start_at' => ['sometimes', 'date'],
            'end_at' => ['sometimes', 'date', 'after:start_at'],
            'max_votes_per_user' => ['sometimes', 'integer', 'min:1'],
            'max_choices' => ['nullable', 'integer', 'min:1', 'max:50'],
            'vote_price' => ['sometimes', 'numeric', 'min:0'],
            'public_weight' => ['sometimes', 'numeric', 'min:0', 'max:1'],
            'jury_weight'   => ['sometimes', 'numeric', 'min:0', 'max:1'],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            $election = $this->route('election');

            if ($this->has('start_at')
                && $election?->status !== ElectionStatus::ONGOING
                && \Carbon\Carbon::parse($this->input('start_at'))->isPast()) {
                $validator->errors()->add('start_at', 'La date de début doit être dans le futur.');
            }

            if ($this->has('vote_price') && $election?->payment_type === 'paid' && (float) $this->input('vote_price') <= 0) {
                $validator->errors()->add('vote_price', 'Le prix du vote doit être supérieur à 0 pour une élection payante.');
            }

            if (($this->has('public_weight') || $this->has('jury_weight')) && $election?->vote_type?->value === 'weighted') {
                $publicWeight = (float) ($this->input('public_weight') ?? $election->public_weight);
                $juryWeight = (float) ($this->input('jury_weight') ?? $election->jury_weight);
                if (abs(($publicWeight + $juryWeight) - 1.0) > 0.001) {
                    $validator->errors()->add('jury_weight', 'La somme de public_weight et jury_weight doit être égale à 1.');
                }
            }
        });
    }
}

<?php

namespace App\Http\Requests\Api\V1\Votes;

use Illuminate\Foundation\Http\FormRequest;

class SubmitVoteRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'voter_code' => ['required', 'string', 'exists:electors,voter_code'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.candidate_id' => ['required', 'string', 'exists:candidates,uuid'],
            'items.*.rank_position' => ['sometimes', 'integer', 'min:1'],
            'items.*.score' => ['sometimes', 'numeric', 'min:0', 'max:10'],
            'items.*.weight' => ['sometimes', 'numeric', 'min:0', 'max:1'],
            'otp_code' => ['sometimes', 'string', 'size:6'],
            'idempotency_key' => ['required', 'string', 'max:100', 'unique:votes,idempotency_key'],
        ];
    }

    public function messages(): array
    {
        return [
            'voter_code.required' => 'Le code électeur est requis',
            'voter_code.exists' => 'Code électeur invalide',
            'items.required' => 'Au moins un choix est requis',
            'items.*.candidate_id.required' => 'ID du candidat requis',
            'items.*.candidate_id.exists' => 'Candidat invalide',
            'idempotency_key.unique' => 'Cette requête a déjà été traitée',
        ];
    }
}

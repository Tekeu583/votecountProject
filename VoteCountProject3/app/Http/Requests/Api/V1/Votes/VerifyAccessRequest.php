<?php

namespace App\Http\Requests\Api\V1\Votes;

use Illuminate\Foundation\Http\FormRequest;

class VerifyAccessRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'voter_code' => ['required', 'string', 'exists:elections,voter_code'],
            'email' => ['required', 'email'],
        ];
    }

    public function messages(): array
    {
        return [
            'voter_code.exists' => 'Code d\'accès invalide.',
            'email.required' => 'Votre adresse email est requise.',
            'email.email' => 'Adresse email invalide.',
        ];
    }
}

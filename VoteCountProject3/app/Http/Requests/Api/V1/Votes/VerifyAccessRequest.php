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
        // Pas de règle exists sur voter_code : elle renverrait un 422 distinct
        // qui révélerait si le code existe (incohérent avec l'anti-énumération
        // du contrôleur). VoteController::verifyAccess() gère l'invalidité de
        // façon uniforme (404 « Code d'accès invalide »).
        return [
            'voter_code' => ['required', 'string'],
            'email' => ['required', 'email'],
        ];
    }

    public function messages(): array
    {
        return [
            'email.required' => 'Votre adresse email est requise.',
            'email.email' => 'Adresse email invalide.',
        ];
    }
}

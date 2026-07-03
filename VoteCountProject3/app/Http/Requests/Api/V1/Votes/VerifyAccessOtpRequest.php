<?php

namespace App\Http\Requests\Api\V1\Votes;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Étape 2 du vote privé : vérification de l'OTP envoyé à l'email
 * de l'électeur, après validation du voter_code (étape 1).
 */
class VerifyAccessOtpRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'access_token' => ['required', 'string'],
            'otp' => ['required', 'string', 'size:6'],
        ];
    }

    public function messages(): array
    {
        return [
            'access_token.required' => 'Session invalide. Recommencez la vérification.',
            'otp.required' => 'Le code reçu par email est requis.',
            'otp.size' => 'Le code doit contenir 6 chiffres.',
        ];
    }
}

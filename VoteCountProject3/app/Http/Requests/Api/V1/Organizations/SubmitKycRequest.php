<?php

namespace App\Http\Requests\Api\V1\Organizations;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;

class SubmitKycRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Auth::check() && Auth::user()->can('submitKyc', $this->route('organization'));
    }

    public function rules(): array
    {
        return [
            'identity_document_type' => ['required', 'string', 'in:national_id,passport'],
            'identity_document' => ['required', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:5120'],
            'business_document' => ['required', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:5120'],
            'legal_representative_name' => ['required', 'string', 'max:200'],
        ];
    }

    public function messages(): array
    {
        return [
            'identity_document.required' => "La pièce d'identité est requise.",
            'business_document.required' => "Le justificatif d'entreprise est requis.",
        ];
    }
}

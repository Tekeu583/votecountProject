<?php

namespace App\Http\Requests\Api\V1\CandidateDocuments;

use Illuminate\Foundation\Http\FormRequest;

class UploadDocumentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'file' => ['required', 'file', 'max:10240'], // 10MB max
            'type' => ['required', 'string', 'in:identity_card,passport,diploma,resume,cover_letter,certificate,photo,other'],
            'description' => ['nullable', 'string', 'max:500'],
        ];
    }

    public function messages(): array
    {
        return [
            'file.required' => 'Le fichier est requis',
            'file.max' => 'Le fichier ne doit pas dépasser 10MB',
            'type.required' => 'Le type de document est requis',
            'type.in' => 'Type de document invalide',
        ];
    }
}
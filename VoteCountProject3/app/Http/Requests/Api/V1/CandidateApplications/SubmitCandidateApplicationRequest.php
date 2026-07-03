<?php

namespace App\Http\Requests\Api\V1\CandidateApplications;

use Illuminate\Foundation\Http\FormRequest;

class SubmitCandidateApplicationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'first_name' => ['required', 'string', 'max:100'],
            'last_name' => ['required', 'string', 'max:100'],
            'email' => ['required', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:20'],
            'gender' => ['nullable', 'in:male,female,other'],
            'photo' => ['nullable', 'image', 'max:5120', 'mimes:jpeg,png,jpg'],
            'manifesto' => ['nullable', 'string', 'max:5000'],
            'slogan' => ['nullable', 'string', 'max:200'],
            'bio' => ['nullable', 'string', 'max:500'],
            'identity_document' => ['nullable', 'file', 'max:5120', 'mimes:jpeg,png,jpg,pdf'],
        ];
    }

    public function messages(): array
    {
        return [
            'first_name.required' => 'Le prénom est requis',
            'last_name.required' => 'Le nom est requis',
            'email.required' => 'L\'email est requis',
            'email.email' => 'Format d\'email invalide',
            'photo.image' => 'La photo doit être une image',
            'photo.max' => 'La photo ne doit pas dépasser 5MB',
            'manifesto.max' => 'Le manifeste ne doit pas dépasser 5000 caractères',
            'slogan.max' => 'Le slogan ne doit pas dépasser 200 caractères',
            'bio.max' => 'La bio ne doit pas dépasser 500 caractères',
        ];
    }
}
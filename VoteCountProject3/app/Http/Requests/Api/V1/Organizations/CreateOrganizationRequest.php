<?php

namespace App\Http\Requests\Api\V1\Organizations;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;

class CreateOrganizationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Auth::check();
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:200', 'unique:organizations,name'],
            'logo' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:3072'],
            'banner' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:4096'],
            'description' => ['nullable', 'string'],
            'email' => ['nullable', 'email', 'max:200', 'unique:organizations,email'],
            'phone' => ['nullable', 'string', 'max:20'],
            'website' => ['nullable', 'url'],
            'country' => ['nullable', 'string', 'max:100'],
            'city' => ['nullable', 'string', 'max:100'],
            'address' => ['nullable', 'string'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.unique' => 'Organization with this name already exists.',
            'email.unique' => 'Organization with this email already exists.',
        ];
    }
}

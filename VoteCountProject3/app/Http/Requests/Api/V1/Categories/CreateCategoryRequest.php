<?php

namespace App\Http\Requests\Api\V1\Categories;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;

class CreateCategoryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Auth::user()->can('manage categories');
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:100'],
            'description' => ['nullable', 'string'],
            'icon' => ['nullable', 'string', 'max:50'],
            'banner' => ['nullable', 'image', 'max:3072', 'mimes:jpeg,png,jpg'],
            'color' => ['nullable', 'string', 'max:7', 'regex:/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/'],
            'status' => ['sometimes', 'in:active,inactive'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Le nom de la catégorie est requis',
            'color.regex' => 'La couleur doit être au format hexadécimal (#RRGGBB ou #RGB)',
        ];
    }
}

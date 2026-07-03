<?php

namespace App\Http\Requests\Api\V1\Electors;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;

class ImportElectorsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Auth::check() && Auth::user()->can('import electors');
    }

    public function rules(): array
    {
        return [
            'file' => ['required', 'file', 'mimes:xlsx,csv,xls', 'max:10240'], // 10MB max
            'has_header' => ['boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'file.required' => 'Le fichier est requis',
            'file.mimes' => 'Le fichier doit être au format Excel ou CSV',
            'file.max' => 'Le fichier ne doit pas dépasser 10MB',
        ];
    }
}

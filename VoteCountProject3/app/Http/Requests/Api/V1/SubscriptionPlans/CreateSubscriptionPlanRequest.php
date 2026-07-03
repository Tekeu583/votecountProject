<?php

namespace App\Http\Requests\Api\V1\SubscriptionPlans;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;

class CreateSubscriptionPlanRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Auth::user()->can('manage subscription plans');
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:100', 'unique:subscription_plans,name'],
            'description' => ['nullable', 'string'],
            'price' => ['required', 'numeric', 'min:0'],
            'currency' => ['required', 'string', 'size:3'],
            'duration_days' => ['required', 'integer', 'min:1', 'max:365'],
            'max_elections' => ['required', 'integer', 'min:-1'], // -1 = illimité
            'max_votes' => ['required', 'integer', 'min:-1'],
            'max_candidates' => ['required', 'integer', 'min:-1'],
            'max_storage_gb' => ['required', 'integer', 'min:0'],
            'features' => ['nullable', 'array'],
            'status' => ['sometimes', 'in:active,inactive'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Le nom du plan est requis',
            'name.unique' => 'Un plan avec ce nom existe déjà',
            'price.required' => 'Le prix est requis',
            'duration_days.required' => 'La durée est requise',
            'max_elections.min' => '-1 signifie illimité',
        ];
    }
}

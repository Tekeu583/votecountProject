<?php

namespace App\Http\Requests\Api\V1\SubscriptionPlans;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;

class UpdateSubscriptionPlanRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Auth::user()->can('manage subscription plans');
    }

    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'string', 'max:100', 'unique:subscription_plans,name,' . $this->route('subscription_plan')?->id],
            'description' => ['nullable', 'string'],
            'price' => ['sometimes', 'numeric', 'min:0'],
            'currency' => ['sometimes', 'string', 'size:3'],
            'duration_days' => ['sometimes', 'integer', 'min:1', 'max:365'],
            'max_elections' => ['sometimes', 'integer', 'min:-1'],
            'max_votes' => ['sometimes', 'integer', 'min:-1'],
            'max_candidates' => ['sometimes', 'integer', 'min:-1'],
            'max_storage_gb' => ['sometimes', 'integer', 'min:0'],
            'features' => ['nullable', 'array'],
            'status' => ['sometimes', 'in:active,inactive'],
        ];
    }
    public function messages()
    {
        return [
            'name.unique' => 'le nom du plan doit etre unique.',
            'price.required' => 'Le prix est requis',
            'duration_days.required' => 'La durée est requise',
            'max_elections.min' => '-1 signifie illimity',
            'max_votes.min' => '-1 signifie illimity',
            'max_candidates.min' => '-1 signifie illimity',
            'max_storage_gb.min' => '0 signifie illimity',

        ];
    }
}

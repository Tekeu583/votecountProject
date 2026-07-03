<?php

namespace App\Http\Requests\Api\V1\Organizations;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;

class UpdateOrganizationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Auth::check() && Auth::user()->can('edit organizations', $this->route('organization'));
    }

    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'string', 'max:200', 'unique:organizations,name,'.$this->route('organization')->id],
            'description' => ['nullable', 'string'],
            'email' => ['nullable', 'email', 'max:200'],
            'phone' => ['nullable', 'string', 'max:20'],
            'website' => ['nullable', 'url'],
            'country' => ['nullable', 'string', 'max:100'],
            'city' => ['nullable', 'string', 'max:100'],
            'address' => ['nullable', 'string'],
            'status' => ['sometimes', 'in:active,inactive,suspended'],
        ];
    }
}

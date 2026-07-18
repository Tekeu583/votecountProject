<?php

namespace App\Http\Requests\Api\V1\Payments;

use App\Models\Organization;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;

class StoreWithdrawalRequest extends FormRequest
{
    public function authorize(): bool
    {
        if (! Auth::check() || ! $this->filled('organization_uuid')) {
            return false;
        }

        $organization = Organization::where('uuid', $this->input('organization_uuid'))->first();

        return $organization && Auth::user()->can('requestWithdrawal', $organization);
    }

    public function rules(): array
    {
        return [
            'organization_uuid' => ['required', 'exists:organizations,uuid'],
            'amount' => ['required', 'numeric', 'min:1000'],
            'phone_number' => ['required', 'string', 'max:20'],
            'payout_provider' => ['nullable', 'string', 'in:orange_money,mtn_money,other'],
        ];
    }
}

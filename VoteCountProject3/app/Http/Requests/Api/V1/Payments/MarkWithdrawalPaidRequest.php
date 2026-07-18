<?php

namespace App\Http\Requests\Api\V1\Payments;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;

class MarkWithdrawalPaidRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Auth::check() && Auth::user()->can('approve withdrawals');
    }

    public function rules(): array
    {
        return [
            'payment_reference' => ['required', 'string', 'max:200'],
            'admin_notes' => ['nullable', 'string', 'max:1000'],
        ];
    }
}

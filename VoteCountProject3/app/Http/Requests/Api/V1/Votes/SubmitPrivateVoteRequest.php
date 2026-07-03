<?php

namespace App\Http\Requests\Api\V1\Votes;

use Illuminate\Foundation\Http\FormRequest;

class SubmitPrivateVoteRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'session_token' => ['required', 'string'],
            'otp_code' => ['required', 'string', 'size:6'],
            'idempotency_key' => ['required', 'string', 'max:100', 'unique:votes,idempotency_key'],
        ];
    }
}

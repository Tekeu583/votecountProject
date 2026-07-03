<?php

namespace App\Http\Requests\Api\V1\Elections;

use Illuminate\Foundation\Http\FormRequest;

class UpdateElectionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title' => ['sometimes', 'string', 'max:200'],
            'short_description' => ['nullable', 'string', 'max:500'],
            'description' => ['nullable', 'string'],
            'start_at' => ['sometimes', 'date', 'after:now'],
            'end_at' => ['sometimes', 'date', 'after:start_at'],
            'max_votes_per_user' => ['sometimes', 'integer', 'min:1', 'max:10'],
            'max_choices' => ['nullable', 'integer', 'min:1', 'max:50'],
            'vote_price' => ['sometimes', 'numeric', 'min:0'],
        ];
    }
}

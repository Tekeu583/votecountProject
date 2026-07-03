<?php

namespace App\Http\Requests\Api\V1\Candidates;

use App\Models\Category;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;


class UpdateCandidateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $election = $this->route('election');
        $candidate = $this->route('candidate');

        return [
            'full_name' => ['sometimes', 'required', 'string', 'max:200'],
            'email' => [
                'sometimes',
                'nullable',
                'email',
                'max:255',
                Rule::unique('candidates', 'email')
                    ->where(fn ($query) => $query->where('election_id', $election->id))
                    ->ignore($candidate?->id),
            ],
            'phone' => ['nullable', 'string'],
            'bio' => ['nullable', 'string'],
            'manifesto' => ['nullable', 'string'],
            'slogan' => ['nullable', 'string', 'max:200'],
            'photo' => ['nullable', 'image', 'max:5120'],
            'cover_photo' => ['nullable', 'image', 'max:5120'],
            'position' => ['nullable', 'integer', 'min:0'],
            'category_id' => [
                'nullable',
                function ($attribute, $value, $fail) {
                    if (empty($value)) {
                        return;
                    }

                    if (Str::isUuid($value)) {
                        $category = Category::where('uuid', $value)->first();
                        if (!$category) {
                            $fail('La catégorie sélectionnée n\'existe pas.');
                        }
                        return;
                    }

                    if (is_numeric($value)) {
                        $exists = Category::where('id', (int)$value)->exists();
                        if (!$exists) {
                            $fail('La catégorie sélectionnée n\'existe pas.');
                        }
                        return;
                    }

                    $exists = Category::where('name', $value)
                        ->orWhere('slug', Str::slug($value))
                        ->exists();
                    if (!$exists) {
                        $fail('La catégorie sélectionnée n\'existe pas.');
                    }
                },
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'full_name.required'  => 'Le nom complet du candidat est requis.',
            'photo.image'         => 'La photo doit être une image (JPG, PNG, etc.).',
            'photo.max'           => 'La photo ne doit pas dépasser 5 Mo.',
            'cover_photo.max'     => 'La photo de couverture ne doit pas dépasser 5 Mo.',
            'category_id.exists'  => 'La catégorie sélectionnée n\'existe pas.',
        ];
    }

    /**
     * Résoudre l'ID de la catégorie (retourne un BIGINT pour la base),
     * même logique que CreateCandidateRequest::resolveCategoryId().
     */
    public function resolveCategoryId(): ?int
    {
        $input = $this->input('category_id');

        if (empty($input)) {
            return null;
        }

        if (Str::isUuid($input)) {
            $category = Category::where('uuid', $input)->first();
            return $category?->id;
        }

        if (is_numeric($input)) {
            return (int) $input;
        }

        $category = Category::where('name', $input)
            ->orWhere('slug', Str::slug($input))
            ->first();

        return $category?->id;
    }
}
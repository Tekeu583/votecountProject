<?php

namespace App\Http\Requests\Api\V1\Candidates;

use App\Models\Category;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;


class CreateCandidateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }


    public function rules(): array
    {
    $election = $this->route('election');
        return [
            'full_name' => ['required', 'string', 'max:200'],
            'email' => ['required', 'email', 'max:255', Rule::unique('candidates', 'email')->where(function ($query) use ($election) {
                return $query->where('election_id', $election->id);
            })],
            'phone' => ['nullable', 'string'],
            'bio' => ['nullable', 'string'],
            'manifesto' => ['nullable', 'string'],
            'slogan' => ['nullable', 'string', 'max:200'],
            'photo' => ['nullable', 'image', 'max:5120'],
            'cover_photo' => ['nullable', 'image', 'max:5120'],
            'position' => ['nullable', 'integer', 'min:0'],
            'category_id' => [
                'nullable',
                function ($attribute, $value, $fail) use ($election) {
                    if (empty($value)) {
                        return;
                    }

                    // Une catégorie appartient toujours à une élection précise —
                    // vérifier qu'elle existe ET qu'elle appartient à CETTE élection,
                    // pas seulement qu'elle existe quelque part sur la plateforme.

                    // Si c'est un UUID → vérifier qu'il existe et récupérer l'ID
                    if (Str::isUuid($value)) {
                        $category = Category::where('uuid', $value)->where('election_id', $election->id)->first();
                        if (!$category) {
                            $fail('La catégorie sélectionnée n\'existe pas pour ce scrutin.');
                        }
                        return;
                    }

                    // Si c'est un ID numérique → vérifier qu'il existe
                    if (is_numeric($value)) {
                        $exists = Category::where('id', (int) $value)->where('election_id', $election->id)->exists();
                        if (!$exists) {
                            $fail('La catégorie sélectionnée n\'existe pas pour ce scrutin.');
                        }
                        return;
                    }

                    // Si c'est un nom → chercher par nom ou slug
                    $exists = Category::where('election_id', $election->id)
                        ->where(fn ($q) => $q->where('name', $value)->orWhere('slug', Str::slug($value)))
                        ->exists();
                    if (!$exists) {
                        $fail('La catégorie sélectionnée n\'existe pas pour ce scrutin.');
                    }
                },
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'full_name.required'   => 'Le nom complet du candidat est requis.',
            'photo.image'          => 'La photo doit être une image (JPG, PNG, etc.).',
            'photo.max'            => 'La photo ne doit pas dépasser 5 Mo.',
            'cover_photo.max'      => 'La photo de couverture ne doit pas dépasser 5 Mo.',
            'category_id.exists' => 'La catégorie sélectionnée n\'existe pas.',
            'category_id.id' => 'Le format de la catégorie est invalide.',
        ];
    }

    /**
     * Résoudre l'ID de la catégorie (retourne un BIGINT pour la base)
     */
    public function resolveCategoryId(): ?int
    {
        $input = $this->input('category_id');

        if (empty($input)) {
            return null;
        }

        $election = $this->route('election');

        // 1. UUID → trouver la catégorie et retourner son ID (BIGINT)
        if (Str::isUuid($input)) {
            $category = Category::where('uuid', $input)->where('election_id', $election->id)->first();
            return $category?->id; // ✅ Retourne un BIGINT
        }

        // 2. ID numérique → vérifier qu'il appartient à cette élection avant de le retourner
        if (is_numeric($input)) {
            $category = Category::where('id', (int) $input)->where('election_id', $election->id)->first();
            return $category?->id; // ✅ Retourne un BIGINT
        }

        // 3. Nom → chercher par nom ou slug, dans cette élection
        $category = Category::where('election_id', $election->id)
            ->where(fn ($q) => $q->where('name', $input)->orWhere('slug', Str::slug($input)))
            ->first();

        return $category?->id; // ✅ Retourne un BIGINT
    }
}

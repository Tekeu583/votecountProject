<?php

namespace App\Imports;

use App\Models\Candidate;
use App\Models\Category;
use App\Models\Election;
use App\Models\ImportJob;
use App\Services\CandidateService;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\WithValidation;

class CandidatesImport implements ToCollection, WithHeadingRow, WithValidation
{
    protected Election $election;
    protected ImportJob $importJob;
    protected CandidateService $candidateService;
    protected int $rowIndex = 0;

    public function __construct(Election $election, ImportJob $importJob)
    {
        $this->election = $election;
        $this->importJob = $importJob;
        $this->candidateService = app(CandidateService::class);
    }

    public function collection(Collection $rows)
    {
        $this->importJob->update(['total_rows' => $rows->count()]);

        foreach ($rows as $row) {
            $this->rowIndex++;

            DB::beginTransaction();
            try {
                $this->validateRow($row);

                $candidate = $this->candidateService->create($this->election, [
                    'full_name' => $row['full_name'] ?? $row['nom_complet'] ?? $row['name'],
                    'email' => $row['email'] ?? null,
                    'phone' => $row['phone'] ?? $row['telephone'] ?? null,
                    'bio' => $row['bio'] ?? $row['biographie'] ?? null,
                    'manifesto' => $row['manifesto'] ?? $row['programme'] ?? $row['manifeste'] ?? null,
                    'slogan' => $row['slogan'] ?? null,
                    'position' => $row['position'] ?? null,
                    'category_id' => $this->getCategoryId($row['category'] ?? null),
                ]);

                $this->importJob->addSuccess();
                DB::commit();
            } catch (\Exception $e) {
                DB::rollBack();
                $this->importJob->addError($this->rowIndex + 1, $e->getMessage(), $row->toArray());
            }
        }
    }

    public function rules(): array
    {
        return [
            'full_name' => 'required|string|max:200',
            'email' => 'required|email|unique:candidates,email,NULL,id,election_id,' . $this->election->id,
            'category'  => $this->election->has_categories ? 'required|string' : 'nullable|string',
            'phone' => 'nullable|string|max:20',
        ];
    }

    protected function validateRow(Collection $row): void
    {
        $fullName = $row['full_name'] ?? $row['nom_complet'] ?? $row['name'] ?? null;
        $email = $row['email'] ?? null;

        if (empty($fullName)) {
            throw new \Exception('Le nom complet est requis');
        }
        if (empty($email)) {
            throw new \Exception('L\'email est obligatoire');
        }
        //uniciter de l'email par candidat par election
        if ($email) {
            $exists = Candidate::where('election_id', $this->election->id)
                ->where('email', $email)
                ->exists();

            if ($exists) {
                throw new \Exception("L'email {$email} est déjà utilisé dans cette élection");
            }
        }


        if ($this->election->has_categories) {
            $categoryName = $row['category'] ?? null;
            if (empty($categoryName)) {
                throw new \Exception('La catégorie est obligatoire pour cette élection');
            }

            // Vérifier que la catégorie existe dans cette élection
            $categoryExists = \App\Models\Category::where('election_id', $this->election->id)
                ->where(function ($q) use ($categoryName) {
                    $q->where('name', 'ilike', $categoryName)
                        ->orWhere('slug', 'ilike', \Illuminate\Support\Str::slug($categoryName));
                })->exists();

            if (!$categoryExists) {
                throw new \Exception("La catégorie \"{$categoryName}\" n'existe pas dans cette élection");
            }
        }

        // Vérifier les doublons dans l'élection
        $exists = Candidate::where('election_id', $this->election->id)
            ->where('full_name', $fullName)
            ->exists();

        if ($exists) {
            throw new \Exception('Ce candidat existe déjà dans cette élection');
        }
    }



    /**
     * ✅ CORRECTION : Résoudre la catégorie par NOM ou ID (PAS par UUID)
     */
    protected function getCategoryId(?string $input): ?int
    {
        if (empty($input)) {
            return null;
        }

        // 1. Si c'est un ID numérique
        if (is_numeric($input)) {
            $category = Category::where('id', (int)$input)
                ->where(function ($q) {
                    $q->where('election_id', $this->election->id)
                        ->orWhereNull('election_id');
                })
                ->first();
            if ($category) {
                return $category->id;
            }
        }

        // 2. Si c'est un nom ou slug
        $category = Category::where(function ($q) use ($input) {
            $q->where('name', 'ilike', $input)
                ->orWhere('slug', 'ilike', Str::slug($input));
        })
            ->where(function ($q) {
                $q->where('election_id', $this->election->id)
                    ->orWhereNull('election_id');
            })
            ->first();

        return $category?->id;
    }
}

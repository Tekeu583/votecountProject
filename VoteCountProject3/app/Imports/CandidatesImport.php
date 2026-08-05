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

/**
 * Import des candidats depuis un fichier Excel/CSV.
 *
 * Volontairement SANS le concern WithValidation : celui-ci valide tout le
 * fichier AVANT d'exécuter collection(), et lève une ValidationException au
 * premier manquement. Résultat, une seule ligne vide en fin de feuille — cas
 * très courant avec Excel — annulait l'import complet, y compris les lignes
 * parfaitement valides, sans qu'aucun candidat ne soit créé.
 *
 * La validation se fait donc ligne par ligne dans validateRow() : les lignes
 * valides sont importées, les autres rejetées individuellement avec leur
 * numéro de ligne réel et un motif lisible (voir ImportJob::addError()).
 */
class CandidatesImport implements ToCollection, WithHeadingRow
{
    /** Nombre de lignes d'en-tête, pour retrouver le numéro de ligne du tableur. */
    private const HEADING_OFFSET = 2;

    protected Election $election;
    protected ImportJob $importJob;
    protected CandidateService $candidateService;

    public function __construct(Election $election, ImportJob $importJob)
    {
        $this->election = $election;
        $this->importJob = $importJob;
        $this->candidateService = app(CandidateService::class);
    }

    public function collection(Collection $rows)
    {
        $considered = 0;

        foreach ($rows->values() as $index => $row) {
            // Numéro de ligne tel qu'affiché dans le tableur, pour que le
            // rapport d'erreurs soit directement exploitable par l'utilisateur.
            $lineNumber = $index + self::HEADING_OFFSET;

            $row = $this->normalize($row);

            // Excel conserve des lignes vides en fin de feuille : elles ne sont
            // ni importées ni comptées ni signalées comme erreurs.
            if ($this->isBlank($row)) {
                continue;
            }

            $considered++;

            DB::beginTransaction();
            try {
                $this->validateRow($row);

                $this->candidateService->create($this->election, [
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
                $this->importJob->addError($lineNumber, $e->getMessage(), $row->toArray());
            }
        }

        $this->importJob->update(['total_rows' => $considered]);
    }

    /**
     * Nettoie une ligne avant traitement : espaces superflus (fréquents dans
     * les e-mails copiés-collés) et apostrophe initiale ajoutée par Excel pour
     * forcer un format texte (ex. '+237...).
     */
    protected function normalize(Collection $row): Collection
    {
        return $row->map(function ($value) {
            if (! is_string($value)) {
                return $value;
            }

            $value = trim($value);

            if ($value !== '' && $value[0] === "'") {
                $value = ltrim(substr($value, 1));
            }

            return $value === '' ? null : $value;
        });
    }

    protected function isBlank(Collection $row): bool
    {
        return $row->filter(fn ($value) => $value !== null && $value !== '')->isEmpty();
    }

    protected function validateRow(Collection $row): void
    {
        $fullName = $row['full_name'] ?? $row['nom_complet'] ?? $row['name'] ?? null;
        $email = $row['email'] ?? null;

        if (empty($fullName)) {
            throw new \Exception('Le nom complet est requis');
        }

        // Un copier-coller entre classeurs laisse des formules non résolues
        // (ex. « =[1]Electeurs!A89 ») : sans ce contrôle, elles seraient
        // enregistrées telles quelles comme nom de candidat.
        if (str_starts_with($fullName, '=')) {
            throw new \Exception("Formule Excel non résolue dans le nom : « {$fullName} » — collez les valeurs, pas les formules");
        }

        if (mb_strlen($fullName) > 200) {
            throw new \Exception('Le nom complet dépasse 200 caractères');
        }

        if (empty($email)) {
            throw new \Exception('L\'email est obligatoire');
        }

        // Contrôle assuré auparavant par rules() (concern WithValidation),
        // retiré car il annulait l'import entier à la première ligne fautive.
        if (! filter_var($email, FILTER_VALIDATE_EMAIL)) {
            throw new \Exception("Adresse e-mail invalide : « {$email} »");
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

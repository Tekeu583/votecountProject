<?php

namespace App\Services;

use App\Models\Candidate;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Service dédié à la génération sécurisée du candidate_number.
 *
 * Extrait dans une classe séparée parce que DEUX services en ont besoin :
 * - CandidateService::create()            (admin insère un candidat)
 * - CandidateApplicationService::approve() (candidature approuvée → candidat)
 *
 * Centraliser ici évite de dupliquer la logique de verrouillage et garantit
 * un comportement identique dans les deux flux.
 *
 * POURQUOI lockForUpdate() :
 * ─────────────────────────────────────────────────────────────────────────
 * Sans verrou :
 *   Transaction A : SELECT MAX(candidate_number) = 3 → candidateNumber = 4
 *   Transaction B : SELECT MAX(candidate_number) = 3 → candidateNumber = 4
 *   Transaction A : INSERT candidate_number = 4 ✅
 *   Transaction B : INSERT candidate_number = 4 ❌ UNIQUE violation → 500
 *
 * Avec lockForUpdate() :
 *   Transaction A : SELECT MAX ... FOR UPDATE → pose verrou → candidateNumber = 4
 *   Transaction B : attend que A soit commitée
 *   Transaction A : INSERT candidate_number = 4, COMMIT, libère verrou ✅
 *   Transaction B : SELECT MAX = 4 → candidateNumber = 5, INSERT ✅
 *
 * OBLIGATION : doit être appelé à l'intérieur d'une DB::transaction().
 * lockForUpdate() sans transaction n'a aucun effet.
 */
class CandidateNumberService
{
    /**
     * Génère le prochain candidate_number pour une élection.
     * Thread-safe grâce au verrou pessimiste.
     *
     * @param  int $electionId  - ID interne (pas UUID) de l'élection
     * @return int              - Prochain numéro disponible (commence à 1)
     *
     * @throws \RuntimeException si appelé hors transaction
     */

    public static function next(int $electionId): int
    {
        // Vérification : doit être dans une transaction active
        if (! DB::transactionLevel()) {
            throw new \RuntimeException(
                'CandidateNumberService::next() doit être appelé dans une DB::transaction().'
            );
        }

        try {
            // ✅ SOLUTION SANS MIGRATION : Verrouiller une ligne factice
            // 1. Essayer de verrouiller la ligne avec le numéro max
            $maxCandidate = Candidate::where('election_id', $electionId)
                ->orderBy('candidate_number', 'desc')
                ->lockForUpdate()
                ->first();

            // 2. Si des candidats existent, prendre le max + 1
            if ($maxCandidate) {
                $nextNumber = $maxCandidate->candidate_number + 1;

                Log::debug('Candidate number generated from max', [
                    'election_id' => $electionId,
                    'max_candidate_number' => $maxCandidate->candidate_number,
                    'next_number' => $nextNumber,
                ]);

                return $nextNumber;
            }

            // 3. Aucun candidat → commencer à 1
            Log::debug('First candidate for election', [
                'election_id' => $electionId,
                'next_number' => 1,
            ]);

            return 1;
        } catch (\Exception $e) {
            Log::error('Failed to generate candidate number', [
                'election_id' => $electionId,
                'error' => $e->getMessage(),
            ]);
            throw $e;
        }
    }
}

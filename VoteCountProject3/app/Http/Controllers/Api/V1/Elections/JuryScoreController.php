<?php

namespace App\Http\Controllers\Api\V1\Elections;

use App\Http\Controllers\Api\V1\BaseApiController;
use App\Models\Candidate;
use App\Models\Election;
use App\Models\JuryCriteria;
use App\Models\JuryScore;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

/**
 * Soumission des notes du jury (vote_type = weighted).
 *
 * Routes :
 *   GET  /elections/{election}/jury/candidates                    → candidats + statut de notation du juré connecté
 *   GET  /elections/{election}/jury/candidates/{candidate}/scores → notes déjà soumises par le juré connecté
 *   POST /elections/{election}/jury/scores                        → soumettre/mettre à jour les notes d'un candidat
 */
class JuryScoreController extends BaseApiController
{
    public function candidates(Election $election): JsonResponse
    {
        $this->authorize('scoreCandidates', $election);

        $juryUserId = Auth::id();
        $criteriaCount = $election->juryCriteria()->count();

        // Un seul GROUP BY plutôt qu'un count() par candidat approuvé.
        $scoredCounts = JuryScore::where('election_id', $election->id)
            ->where('jury_user_id', $juryUserId)
            ->selectRaw('candidate_id, count(*) as total')
            ->groupBy('candidate_id')
            ->pluck('total', 'candidate_id');

        $candidates = $election->candidates()->approved()->get()->map(function (Candidate $candidate) use ($scoredCounts, $criteriaCount) {
            $scoredCount = $scoredCounts[$candidate->id] ?? 0;

            return [
                'uuid' => $candidate->uuid,
                'full_name' => $candidate->full_name,
                'photo' => $candidate->photo ? asset('storage/' . $candidate->photo) : null,
                'candidate_number' => $candidate->candidate_number,
                'scored' => $criteriaCount > 0 && $scoredCount >= $criteriaCount,
            ];
        });

        return $this->success($candidates);
    }

    public function candidateScores(Election $election, Candidate $candidate): JsonResponse
    {
        $this->authorize('scoreCandidates', $election);

        if ($candidate->election_id !== $election->id) {
            return $this->error('Ce candidat n\'appartient pas à cette élection.', null, 403);
        }

        $scores = JuryScore::where('candidate_id', $candidate->id)
            ->where('jury_user_id', Auth::id())
            ->with('criteria')
            ->get(['id', 'criteria_id', 'score', 'comment'])
            ->map(fn (JuryScore $s) => [
                'criteria_id' => $s->criteria?->uuid,
                'score' => $s->score,
                'comment' => $s->comment,
            ]);

        return $this->success($scores);
    }

    public function store(Request $request, Election $election): JsonResponse
    {
        $this->authorize('scoreCandidates', $election);

        $request->validate([
            'candidate_id' => ['required', 'string', 'exists:candidates,uuid'],
            'scores' => ['required', 'array', 'min:1'],
            'scores.*.criteria_id' => ['required', 'string'],
            'scores.*.score' => ['required', 'numeric', 'min:0'],
            'comment' => ['nullable', 'string'],
        ]);

        $candidate = Candidate::where('uuid', $request->input('candidate_id'))->firstOrFail();
        if ($candidate->election_id !== $election->id) {
            return $this->error('Ce candidat n\'appartient pas à cette élection.', null, 403);
        }

        $juryUserId = Auth::id();
        $comment = $request->input('comment');

        // Un seul whereIn plutôt qu'un where()->first() par critère soumis.
        // Le filtre election_id remplace la vérification $criteria->election_id
        // faite précédemment après coup : un critère d'une autre élection est
        // simplement absent de la collection, donc rejeté pareil ci-dessous.
        $criteriaByUuid = JuryCriteria::where('election_id', $election->id)
            ->whereIn('uuid', collect($request->input('scores'))->pluck('criteria_id'))
            ->get()
            ->keyBy('uuid');

        foreach ($request->input('scores') as $entry) {
            $criteria = $criteriaByUuid->get($entry['criteria_id']);
            if (! $criteria) {
                throw ValidationException::withMessages(['scores' => 'Critère invalide pour cette élection.']);
            }

            if ((float) $entry['score'] > $criteria->max_score) {
                throw ValidationException::withMessages([
                    'scores' => "La note pour \"{$criteria->name}\" ne peut pas dépasser {$criteria->max_score}.",
                ]);
            }

            // uuid n'est PAS dans les valeurs : HasUuid le génère uniquement
            // à la création (event "creating"), une valeur ici écraserait
            // l'uuid existant à chaque renotation (update).
            JuryScore::updateOrCreate(
                [
                    'candidate_id' => $candidate->id,
                    'jury_user_id' => $juryUserId,
                    'criteria_id' => $criteria->id,
                ],
                [
                    'election_id' => $election->id,
                    'score' => $entry['score'],
                    'comment' => $comment,
                ]
            );
        }

        return $this->success(null, 'Notes enregistrées.');
    }
}

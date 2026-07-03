<?php

namespace App\Http\Controllers\Api\V1\Candidates;

use App\Http\Controllers\Api\V1\BaseApiController;
use App\Http\Resources\Api\V1\CandidateResource;
use App\Models\Election;
use App\Models\Candidate;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FinalistController extends BaseApiController
{
    /**
     * Promouvoir un candidat en finaliste
     */
    public function promote(Request $request, Election $election, Candidate $candidate): JsonResponse
    {
        $this->authorize('update', $election);

        // Vérifier que le candidat appartient bien à l'élection
        if ($candidate->election_id !== $election->id) {
            return $this->error('Ce candidat n\'appartient pas à cette élection', null, 400);
        }

        // Vérifier que le candidat n'est pas déjà finaliste
        if ($candidate->is_finalist) {
            return $this->error('Ce candidat est déjà finaliste', null, 400);
        }

        // Attribuer le prochain rang
        $rank = $request->input('rank') ?? $election->getNextFinalistRank();

        // Promouvoir le candidat
        $candidate->promoteToFinalist($rank);

        return $this->success(
            new CandidateResource($candidate),
            'Candidat promu finaliste avec le rang ' . $rank
        );
    }

    /**
     * Rétrograder un finaliste
     */
    public function demote(Election $election, Candidate $candidate): JsonResponse
    {
        $this->authorize('update', $election);

        // Vérifier que le candidat est bien un finaliste
        if (!$candidate->is_finalist) {
            return $this->error('Ce candidat n\'est pas finaliste', null, 400);
        }

        $candidate->demoteFromFinalist();

        return $this->success(null, 'Candidat retiré des finalistes');
    }

    /**
     * Récupérer la liste des finalistes
     */
    public function index(Election $election): JsonResponse
    {
        $finalists = $election->getFinalists();

        return $this->success(CandidateResource::collection($finalists));
    }

    /**
     * Élire le gagnant
     */
    public function electWinner(Request $request, Election $election): JsonResponse
    {
        $this->authorize('update', $election);

        $request->validate([
            'candidate_id' => 'required|exists:candidates,id',
        ]);

        $candidate = Candidate::find($request->candidate_id);

        // Vérifier que le candidat est un finaliste
        if (!$candidate->is_finalist) {
            return $this->error('Ce candidat n\'est pas finaliste', null, 400);
        }

        // Vérifier que le candidat appartient à l'élection
        if ($candidate->election_id !== $election->id) {
            return $this->error('Ce candidat n\'appartient pas à cette élection', null, 400);
        }

        // Élire le gagnant
        $election->electWinner($candidate);

        return $this->success(
            new CandidateResource($candidate),
            'Gagnant élu avec succès'
        );
    }

    /**
     * Obtenir le gagnant de l'élection
     */
    public function getWinner(Election $election): JsonResponse
    {
        $winner = $election->getWinner();

        if (!$winner) {
            return $this->success(null, 'Aucun gagnant pour cette élection');
        }

        return $this->success(new CandidateResource($winner));
    }
}

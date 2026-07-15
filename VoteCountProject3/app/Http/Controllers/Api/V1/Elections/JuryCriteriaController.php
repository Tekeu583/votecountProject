<?php

namespace App\Http\Controllers\Api\V1\Elections;

use App\Http\Controllers\Api\V1\BaseApiController;
use App\Models\Election;
use App\Models\JuryCriteria;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

/**
 * Gestion des critères de notation du jury (vote_type = weighted).
 *
 * Routes :
 *   GET    /elections/{election}/jury-criteria             → lister
 *   POST   /elections/{election}/jury-criteria             → créer (organisateur)
 *   PUT    /elections/{election}/jury-criteria/{criteria}  → modifier (organisateur)
 *   DELETE /elections/{election}/jury-criteria/{criteria}  → supprimer (organisateur)
 */
class JuryCriteriaController extends BaseApiController
{
    public function index(Election $election): JsonResponse
    {
        $this->authorize('scoreCandidates', $election);

        $criteria = $election->juryCriteria()->orderBy('name')->get();

        return $this->success($criteria);
    }

    public function store(Request $request, Election $election): JsonResponse
    {
        $this->authorize('update', $election);

        $request->validate([
            'name' => ['required', 'string', 'max:150'],
            'description' => ['nullable', 'string'],
            'weight' => ['sometimes', 'numeric', 'min:0.01'],
            'max_score' => ['sometimes', 'integer', 'min:1'],
        ]);

        $criteria = JuryCriteria::create([
            'uuid' => Str::uuid()->toString(),
            'election_id' => $election->id,
            'name' => $request->input('name'),
            'description' => $request->input('description'),
            'weight' => $request->input('weight', 1.0),
            'max_score' => $request->input('max_score', 10),
        ]);

        return $this->created($criteria, 'Critère créé.');
    }

    public function update(Request $request, Election $election, JuryCriteria $criteria): JsonResponse
    {
        $this->authorize('update', $election);

        if ($criteria->election_id !== $election->id) {
            return $this->error('Ce critère n\'appartient pas à cette élection.', null, 403);
        }

        $request->validate([
            'name' => ['sometimes', 'string', 'max:150'],
            'description' => ['nullable', 'string'],
            'weight' => ['sometimes', 'numeric', 'min:0.01'],
            'max_score' => ['sometimes', 'integer', 'min:1'],
        ]);

        $criteria->update($request->only(['name', 'description', 'weight', 'max_score']));

        return $this->success($criteria, 'Critère mis à jour.');
    }

    public function destroy(Election $election, JuryCriteria $criteria): JsonResponse
    {
        $this->authorize('update', $election);

        if ($criteria->election_id !== $election->id) {
            return $this->error('Ce critère n\'appartient pas à cette élection.', null, 403);
        }

        $criteria->delete();

        return $this->success(null, 'Critère supprimé. Les notes associées ont été supprimées.');
    }
}

<?php

namespace App\Repositories\Contracts;

use App\Models\Election;
use App\Repositories\Contracts\BaseRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;

interface ElectionRepositoryInterface extends BaseRepositoryInterface
{
    public function findBySlug(int $organizationId, string $slug): ?Election;

    public function getByOrganization(int $organizationId, int $perPage = 15): LengthAwarePaginator;

    public function getActiveVotable(): Collection;

    public function updateStatistics(int $electionId): void;

    //  getPublicElections : liste paginée des élections publiques publiées/en cours.
    // Centralise la logique de filtrage public dans le repository
    // au lieu de la dupliquer dans ElectionController::publicIndex().
    public function getPublicElections(Request $request): LengthAwarePaginator;

    //getOpenForCandidacy : liste paginée des élections acceptant des candidatures.
    // Extrait la logique de ElectionController::openForCandidacy().
    public function getOpenForCandidacy(Request $request): LengthAwarePaginator;

    //getGlobalStats : statistiques globales pour le super admin.
    // Extrait les Election::count() / Election::where()... directs de ElectionController::stats().
    public function getGlobalStats(): array;

    //getFilteredElections : liste paginée avec filtres (org, status, search, date).
    // Extrait la logique de ElectionController::index().
    public function getFilteredElections(Request $request): LengthAwarePaginator;
}

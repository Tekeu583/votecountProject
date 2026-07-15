<?php

namespace App\Repositories\Eloquent;

use App\Enums\ElectionStatus;
use App\Models\Candidate;
use App\Models\Election;
use App\Models\Elector;
use App\Models\Vote;
use App\Repositories\Contracts\ElectionRepositoryInterface;
use App\Repositories\Eloquent\BaseRepository;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;

class ElectionRepository extends BaseRepository implements ElectionRepositoryInterface
{
    public function __construct(Election $model)
    {
        parent::__construct($model);
    }

    public function findBySlug(int $organizationId, string $slug): ?Election
    {
        return $this->model->where('organization_id', $organizationId)
            ->where('slug', $slug)
            ->first();
    }

    public function getByOrganization(int $organizationId, int $perPage = 15): LengthAwarePaginator
    {
        return $this->model->where('organization_id', $organizationId)
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);
    }

    public function getActiveVotable(): Collection
    {
        return $this->model->whereIn('status', ['published', 'ongoing'])
            ->where('start_at', '<=', now())
            ->where('end_at', '>=', now())
            ->get();
    }

    public function updateStatistics(int $electionId): void
    {
        $election = $this->findOrFail($electionId);

        $totalVotes = $election->votes()->where('status', 'completed')->count();
        $totalRevenue = $election->votes()->where('status', 'completed')->sum('total_amount');

        $this->update($electionId, [
            'total_votes' => $totalVotes,
            'total_revenue' => $totalRevenue,
        ]);
    }

    public function getPublicElections(Request $request): LengthAwarePaginator
    {
        $query = $this->model->query()
            ->where('election_mode', 'public')
            ->whereIn('status', [
                ElectionStatus::PUBLISHED->value,
                ElectionStatus::ONGOING->value,
                ElectionStatus::CLOSED->value,
                ElectionStatus::COMPLETED->value,
            ]);

        if ($request->filled('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('title', 'ilike', "%{$request->search}%")
                    ->orWhere('short_description', 'ilike', "%{$request->search}%");
            });
        }

        $allowedPublicStatuses = [
            ElectionStatus::PUBLISHED->value,
            ElectionStatus::ONGOING->value,
            ElectionStatus::CLOSED->value,
            ElectionStatus::COMPLETED->value,
        ];

        if ($request->filled('status') && in_array($request->status, $allowedPublicStatuses)) {
            $query->where('status', $request->status);
        }

        return $query
            ->with([
                'organization',
                'organization.subscriptionPlan',
                'creator',
                'creator.roles.permissions',
            ])
            ->withCount(['candidates', 'electors'])
            ->orderBy('created_at', 'desc')
            ->paginate($request->integer('per_page', 15));
    }

    public function getOpenForCandidacy(Request $request): LengthAwarePaginator
    {
        $query = $this->model->query()->openForCandidacy();

        if ($request->filled('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('title', 'ilike', "%{$request->search}%")
                    ->orWhere('short_description', 'ilike', "%{$request->search}%");
            });
        }

        if ($request->filled('organization_id')) {
            $query->whereHas('organization', function ($q) use ($request) {
                $q->where('uuid', $request->organization_id);
            });
        }

        return $query
            ->with(['organization', 'creator'])
            ->withCount(['candidates'])
            ->orderByRaw('candidacy_end_at ASC NULLS LAST')
            ->paginate($request->integer('per_page', 15));
    }

    //Implémentation de getGlobalStats.
    public function getGlobalStats(): array
    {
        return [
            'total'     => $this->model->count(),
            'draft'     => $this->model->where('status', ElectionStatus::DRAFT->value)->count(),
            'published' => $this->model->where('status', ElectionStatus::PUBLISHED->value)->count(),
            'ongoing'   => $this->model->where('status', ElectionStatus::ONGOING->value)->count(),
            'closed'    => $this->model->whereIn('status', ElectionStatus::finishedValues())->count(),
            'cancelled' => $this->model->where('status', ElectionStatus::CANCELLED->value)->count(),

            'new_this_month' => $this->model
                ->whereMonth('created_at', now()->month)
                ->whereYear('created_at', now()->year)
                ->count(),

            'total_candidates' => Candidate::count(),
            'total_votes'      => Vote::count(),
            'total_electors'   => Elector::count(),
        ];
    }

    // Implémentation de getFilteredElections.
    public function getFilteredElections(Request $request): LengthAwarePaginator
    {
        $query = $this->model->query();
        $user  = $request->user();

        // • Tous les autres : ne voient que les élections de leurs organisations.
        //   Si organization_id est passé, on vérifie qu'il appartient bien à l'user.
        // organization_id est un reliquat de deux anciens appels frontend
        // (CreateScrutin.jsx, SubscriptionPage.jsx) — organization_uuid est
        // la convention utilisée partout ailleurs (Scrutins.jsx, DashboardHome,
        // Electeurs, Jurys, Equipe, Corbeille, Resultats...). On accepte les
        // deux pour ne rien casser côté frontend.
        $organizationUuid = $request->input('organization_uuid', $request->input('organization_id'));

        if ($user && $user->hasRole('super_admin')) {
            // Super admin — filtre optionnel par uuid d'organisation. Sans ce
            // filtre, un super admin qui bascule sur le dashboard de SA PROPRE
            // organisation voyait toutes les élections de la plateforme, faute
            // de restriction par défaut (contrairement à la branche "sinon").
            if ($organizationUuid) {
                $query->whereHas('organization', function ($q) use ($organizationUuid) {
                    $q->where('uuid', $organizationUuid);
                });
            }
        } else {
            // Utilisateur normal — restreint à ses organisations
            $userOrgIds = $user?->organizations()->pluck('organizations.id') ?? collect();

            if ($organizationUuid) {
                // Filtre sur une org spécifique — vérifier qu'elle appartient à l'user
                $query->whereHas('organization', function ($q) use ($organizationUuid) {
                    $q->where('uuid', $organizationUuid);
                })->whereIn('organization_id', $userOrgIds);
            } else {
                // Pas de filtre explicite — toutes les élections de ses organisations
                $query->whereIn('organization_id', $userOrgIds);
            }
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('title', 'ilike', "%{$request->search}%")
                    ->orWhere('description', 'ilike', "%{$request->search}%");
            });
        }

        if ($request->filled('date')) {
            $query->whereDate('created_at', $request->date);
        }

        if ($request->filled('vote_type')) {
            $query->where('vote_type', $request->vote_type);
        }

        return $query
            ->with([
                'organization.subscriptionPlan',
                'organization.owner.roles.permissions',
                'creator.roles.permissions',
                'candidates',
                'candidates.category',
            ])
            ->withCount(['votes', 'candidates', 'electors'])
            ->orderBy('created_at', 'desc')
            ->paginate($request->integer('per_page', 15));
    }
}

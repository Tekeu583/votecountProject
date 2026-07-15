<?php

namespace App\Http\Controllers\Api\V1\Elections;

use App\Http\Controllers\Api\V1\BaseApiController;
use App\Http\Resources\Api\V1\ElectionResource;
use App\Models\Election;
use App\Models\User;
use App\Services\ElectionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

/**
 * Gestion du staff d'une élection : gestionnaires (manager) et observateurs
 * (observer).
 *
 * Réutilise le mécanisme générique "staff d'élection" (election_user,
 * role_slug='manager'|'observer') — même principe que JuryController
 * (role_slug='jury'), pas de table d'affectation dédiée.
 *
 * Routes :
 *   GET    /elections/{election}/staff         → lister le staff (filtrable par ?role=)
 *   POST   /elections/{election}/staff         → affecter (par email, utilisateur existant)
 *   DELETE /elections/{election}/staff/{user}  → retirer
 *   GET    /manager/elections                  → élections où l'utilisateur connecté est gestionnaire
 */
class ElectionStaffController extends BaseApiController
{
    private const ROLES = ['manager', 'observer'];

    public function __construct(private ElectionService $electionService)
    {
    }

    public function index(Request $request, Election $election): JsonResponse
    {
        $this->authorize('update', $election);

        $request->validate([
            'role' => 'sometimes|string|in:manager,observer',
        ]);

        $roles = $request->filled('role') ? [$request->input('role')] : self::ROLES;

        $staff = $election->users()
            ->wherePivotIn('role_slug', $roles)
            ->get()
            ->map(fn (User $user) => [
                'uuid' => $user->uuid,
                'full_name' => $user->full_name,
                'email' => $user->email,
                'photo' => $user->avatar_url,
                'role_slug' => $user->pivot->role_slug,
                'status' => $user->pivot->status,
                'joined_at' => $user->pivot->joined_at,
            ]);

        return $this->success($staff);
    }

    public function store(Request $request, Election $election): JsonResponse
    {
        $this->authorize('update', $election);

        $request->validate([
            'email' => ['required', 'email'],
            'role' => ['required', 'string', 'in:manager,observer'],
        ]);

        $user = User::where('email', $request->input('email'))->first();
        if (! $user) {
            return $this->error('Aucun utilisateur avec cet email. Le membre doit déjà posséder un compte.', null, 404);
        }

        $existingPivot = $election->users()->where('user_id', $user->id)->first()?->pivot;
        if ($existingPivot) {
            // Un utilisateur ne peut avoir qu'UN SEUL rôle par élection
            // (contrainte unique election_id+user_id en base) — préciser
            // lequel évite de laisser croire à tort qu'il n'a aucun rôle.
            return $this->error(
                "Cet utilisateur a déjà un rôle sur cette élection ({$this->roleLabel($existingPivot->role_slug)}). Un utilisateur ne peut avoir qu'un seul rôle par élection.",
                null,
                422
            );
        }

        $this->electionService->addManager($election, $user, $request->input('role'));

        return $this->success(null, 'Membre affecté avec succès.');
    }

    private function roleLabel(string $roleSlug): string
    {
        return match ($roleSlug) {
            'creator' => 'créateur',
            'admin' => 'administrateur',
            'manager' => 'gestionnaire',
            'observer' => 'observateur',
            'jury' => 'juré',
            'candidat' => 'candidat',
            default => $roleSlug,
        };
    }

    public function destroy(Election $election, User $user): JsonResponse
    {
        $this->authorize('update', $election);

        $this->electionService->removeManager($election, $user);

        return $this->success(null, 'Membre retiré avec succès.');
    }

    public function myElections(): JsonResponse
    {
        $elections = Auth::user()->elections()
            ->wherePivot('role_slug', 'manager')
            ->get();

        return $this->success(ElectionResource::collection($elections));
    }
}

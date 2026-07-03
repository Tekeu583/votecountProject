<?php

namespace App\Http\Controllers\Api\V1\CandidateApplications;

use App\Http\Controllers\Api\V1\BaseApiController;
use App\Http\Requests\Api\V1\CandidateApplications\SubmitCandidateApplicationRequest;
use App\Http\Resources\Api\V1\CandidateApplicationResource;
use App\Models\Election;
use App\Models\CandidateApplication;
use App\Services\CandidateApplicationService;
use App\Events\CandidateApplicationSubmitted;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class CandidateApplicationController extends BaseApiController
{
    protected CandidateApplicationService $applicationService;

    public function __construct(CandidateApplicationService $applicationService)
    {
        $this->applicationService = $applicationService;
    }

    /**
     * Soumettre une candidature (public - sans authentification)
     */
    public function store(SubmitCandidateApplicationRequest $request, Election $election): JsonResponse
    {
        // ── Validation 1 : election_mode = public uniquement ──────────
        if ($election->election_mode !== 'public') {
            return $this->error(
                'Cette élection n\'accepte pas de candidatures publiques. '
                    . 'Contactez l\'organisateur pour soumettre votre candidature.',
                null,
                403
            );
        }

        // ── Validation 2 : status = published (pas ongoing, pas draft) ─
        if ($election->status->value !== 'published') {
            $message = match ($election->status->value) {
                'ongoing'   => 'Le vote est déjà en cours. Les candidatures sont closes.',
                'draft'     => 'Cette élection n\'est pas encore publiée.',
                'closed'    => 'Cette élection est terminée.',
                'cancelled' => 'Cette élection a été annulée.',
                default     => 'Les candidatures ne sont pas ouvertes pour cette élection.',
            };

            return $this->error($message, null, 422);
        }

        // ── Validation 3 : accepts_candidates activé ──────────────────
        if (! $election->accepts_candidates) {
            return $this->error(
                'Les candidatures ne sont pas activées pour cette élection.',
                null,
                422
            );
        }

        // ── Validation 4 : fenêtre temporelle ─────────────────────────
        $now = now();

        if ($election->candidacy_start_at && $election->candidacy_start_at > $now) {
            return $this->error(
                'Les candidatures ne sont pas encore ouvertes. '
                    . 'Ouverture le ' . $election->candidacy_start_at->translatedFormat('d F Y à H:i'),
                null,
                422
            );
        }

        if ($election->candidacy_end_at && $election->candidacy_end_at < $now) {
            return $this->error(
                'La période de candidature est expirée depuis le '
                    . $election->candidacy_end_at->translatedFormat('d F Y à H:i') . '.',
                null,
                422
            );
        }

        // ── Validation 5 : places disponibles ─────────────────────────
        if ($election->max_candidates > 0) {
            $currentCount = $election->candidates()->count();

            if ($currentCount >= $election->max_candidates) {
                return $this->error(
                    'Le nombre maximum de candidats a été atteint pour cette élection.',
                    null,
                    422
                );
            }
        }

        // Vérifier si le candidat a déjà postulé avec cet email
        $existingApplication = CandidateApplication::where('election_id', $election->id)
            ->where('email', $request->email)
            ->first();

        if ($existingApplication) {
            return $this->error('Vous avez déjà soumis une candidature pour cette élection', null, 400);
        }

        $application = $this->applicationService->submit($election, $request->validated());

        event(new CandidateApplicationSubmitted($application));

        return $this->created(new CandidateApplicationResource($application), 'Candidature soumise avec succès. Elle est en attente de validation par l\'organisateur.');
    }

    /**
     * Liste des candidatures (admin)
     */
    public function index(Request $request, Election $election): JsonResponse
    {
        $this->authorize('viewAny', CandidateApplication::class);

        $query = $election->candidateApplications();

        if ($request->has('status')) {
            $query->where('application_status', $request->status);
        }

        $applications = $query->orderBy('created_at', 'desc')
            ->paginate($request->get('per_page', 15));

        return $this->paginated($applications, CandidateApplicationResource::class);
    }

    /**
     * Détail d'une candidature (admin)
     */
    public function show(Election $election, CandidateApplication $candidateApplication): JsonResponse
    {
        $this->authorize('view', $candidateApplication);

        return $this->success(new CandidateApplicationResource($candidateApplication));
    }

    /**
     * Approuver une candidature (admin)
     */
    public function approve(Request $request, Election $election, CandidateApplication $candidateApplication): JsonResponse
    {
        $this->authorize('approve', $candidateApplication);

        $this->applicationService->approve($candidateApplication, Auth::user()->id);

        return $this->success(null, 'Candidature approuvée avec succès');
    }

    /**
     * Rejeter une candidature (admin)
     */
    public function reject(Request $request, Election $election, CandidateApplication $candidateApplication): JsonResponse
    {
        $this->authorize('reject', $candidateApplication);

        $request->validate(['reason' => 'required|string|max:500']);

        $this->applicationService->reject($candidateApplication, Auth::user()->id, $request->reason);

        return $this->success(null, 'Candidature rejetée');
    }

    /**
     * Vérifier le statut de sa candidature (public)
     */
    public function checkStatus(Request $request, Election $election): JsonResponse
    {
        $request->validate(['email' => 'required|email']);

        $application = CandidateApplication::where('election_id', $election->id)
            ->where('email', $request->email)
            ->first();

        if (!$application) {
            return $this->notFound('Aucune candidature trouvée pour cet email');
        }

        return $this->success([
            'status' => $application->application_status,
            'status_label' => $this->getStatusLabel($application->application_status),
            'submitted_at' => $application->created_at,
            'reviewed_at' => $application->approved_at ?? $application->rejected_at,
            'rejection_reason' => $application->rejection_reason,
        ]);
    }

    private function getStatusLabel(string $status): string
    {
        return match ($status) {
            'pending' => 'En attente de validation',
            'approved' => 'Approuvée',
            'rejected' => 'Rejetée',
            default => $status,
        };
    }
}

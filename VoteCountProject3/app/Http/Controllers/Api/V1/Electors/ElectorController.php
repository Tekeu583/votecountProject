<?php

namespace App\Http\Controllers\Api\V1\Electors;

use App\Http\Controllers\Api\V1\BaseApiController;
use App\Http\Requests\Api\V1\Electors\ImportElectorsRequest;
use App\Http\Resources\Api\V1\ElectorResource;
use App\Jobs\ProcessElectorImport;
use App\Models\Election;
use App\Models\Elector;
use App\Models\ImportJob;
use App\Services\ElectorService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use App\Notifications\VoterCodeNotification;

class ElectorController extends BaseApiController
{
    protected ElectorService $electorService;


    public function __construct(ElectorService $electorService)
    {
        $this->electorService = $electorService;
    }

    public function index(Election $election, Request $request): JsonResponse
    {
        $query = $election->electors();

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('has_voted')) {
            $query->where('has_voted', $request->boolean('has_voted'));
        }

        if ($request->has('verification_status')) {
            $query->where('verification_status', $request->verification_status);
        }
        if ($request->has('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('full_name', 'ilike', "%{$request->search}%")
                    ->orWhere('email', 'ilike', "%{$request->search}%")
                    ->orWhere('phone', 'ilike', "%{$request->search}%");
            });
        }

        $electors = $query->orderBy('created_at', 'desc')
            ->paginate($request->get('per_page', 15));

        return $this->paginated($electors, ElectorResource::class);
    }

    public function store(Request $request, Election $election): JsonResponse
    {
        $request->validate([
            'full_name' => 'required|string|max:200',
            'email' => 'required|email|unique:electors,email,NULL,id,election_id,' . $election->id,
            'phone' => 'nullable|string|max:20',
        ]);

        $elector = $this->electorService->create($election, $request->all(), Auth::id());

        return $this->created(new ElectorResource($elector), 'Elector added successfully');
    }

    /**
     * Obtenir les catégories d'une élection avec leurs candidats
     */
    public function getCategories(Election $election): JsonResponse
    {
        $categories = $election->getCategoriesWithCandidates();

        return $this->success($categories);
    }


    public function show(Election $election, Elector $elector): JsonResponse
    {
        $elector->load(['votes', 'verifications']);

        return $this->success(new ElectorResource($elector));
    }

    public function update(Request $request, Election $election, Elector $elector): JsonResponse
    {
        $request->validate([
            'full_name' => 'sometimes|string|max:200',
            'email' => 'sometimes|email|unique:electors,email,' . $elector->id . ',id,election_id,' . $election->id,
            'phone' => 'nullable|string|max:20',
        ]);

        $elector->update($request->only(['full_name', 'email', 'phone']));

        return $this->success(new ElectorResource($elector->fresh()), 'Elector updated successfully');
    }

    public function destroy(Election $election, Elector $elector): JsonResponse
    {
        if ($elector->has_voted) {
            return $this->error('Cannot delete elector who has already voted', null, 400);
        }

        $elector->delete();

        return $this->noContent('Elector deleted successfully');
    }

    public function import(ImportElectorsRequest $request, Election $election): JsonResponse
    {
        // Vérifier que le fichier est bien reçu
        if (!$request->hasFile('file')) {
            return $this->error('Aucun fichier reçu', null, 400);
        }

        $file = $request->file('file');

        if (!$file->isValid()) {
            return $this->error('Fichier invalide', null, 400);
        }
        // Stocker dans le bon dossier avec un nom unique
        $path = $file->store('imports/' . $election->id, 'public');
        if (!Storage::disk('public')->exists($path)) {
            return $this->error('Erreur lors du stockage du fichier', null, 500);
        }
        $importJob = ImportJob::create([
            'uuid' => Str::uuid()->toString(),
            'organization_id' => $election->organization_id,
            'type' => 'electors',
            'file_path' => $path,
            'imported_by' => Auth::id(),
            'status' => 'pending',
        ]);

        // Pas de queue nommée 'imports' : aucun worker de ce projet n'écoute
        // une queue autre que 'default' (ni Procfile, ni service dédié) — ce
        // job y restait bloqué indéfiniment en "pending" sans jamais être
        // traité. Reste sur la queue par défaut, comme tous les autres jobs.
        ProcessElectorImport::dispatch($importJob, $election);

        return $this->accepted([
            'import_job_id' => $importJob->uuid,
            'status' => $importJob->status,
        ], 'Import started. You will be notified when completed.');
    }

    public function importStatus(Election $election, string $importJobId): JsonResponse
    {
        $importJob = ImportJob::where('uuid', $importJobId)->firstOrFail();

        return $this->success([
            'status' => $importJob->status,
            'total_rows' => $importJob->total_rows,
            'success_rows' => $importJob->success_rows,
            'failed_rows' => $importJob->failed_rows,
            'errors' => $importJob->errors()->get(),
            'completed_at' => $importJob->completed_at,
        ]);
    }

    /**
     * Permet de renvoyer le voter_code aux électeurs déjà créés avant la mise
     * en place de l'envoi automatique (ElectorService::create / ProcessElectorImport).
     *
     */
    public function sendVoterCodes(Request $request, Election $election): JsonResponse
    {
        $this->authorize('manage electors', $election);

        if ($election->election_mode !== 'private' || ! $election->voter_code) {
            return $this->error(
                'Cette élection n\'est pas privée ou n\'a pas de voter_code défini.',
                null,
                422
            );
        }

        $query = $election->electors()
            ->where('status', 'active')
            ->whereNotNull('email');

        // Envoi ciblé si elector_uuids fourni, sinon tous les électeurs actifs
        if ($request->filled('elector_uuids')) {
            $query->whereIn('uuid', $request->input('elector_uuids'));
        }

        $electors = $query->get();

        if ($electors->isEmpty()) {
            return $this->error('Aucun électeur éligible trouvé.', null, 404);
        }

        $sent = 0;
        foreach ($electors as $elector) {
            $elector->notify(new VoterCodeNotification($election, $elector));
            $sent++;
        }

        // Trace d'audit dans la table notifications, rattachée à l'admin
        \App\Models\Notification::create([
            'user_id' => Auth::id(),
            'type'    => 'voter_codes_sent',
            'title'   => 'Codes électeurs renvoyés',
            'message' => "{$sent} email(s) de code d'accès renvoyé(s) pour l'élection « {$election->title} ».",
            'data'    => [
                'election_uuid'    => $election->uuid,
                'voter_codes_sent' => $sent,
            ],
        ]);

        return $this->success([
            'sent_count' => $sent,
        ], "{$sent} code(s) électeur envoyé(s) avec succès.");
    }
    public function block(Election $election, Elector $elector): JsonResponse
    {
        $this->authorize('blockElectors', $election);

        $elector->block();

        return $this->success(null, 'Elector blocked successfully');
    }

    public function verify(Election $election, Elector $elector): JsonResponse
    {
        $elector->verify();

        return $this->success(null, 'Elector verified successfully');
    }

    // (sélection multiple + bouton "Vérifier"). Même pattern que sendVoterCodes().
    // Reste utile en complément de l'auto-vérification à l'OTP (VoteController::
    // verifyAccessOtp) : un admin peut vouloir vérifier des électeurs qui n'ont
    // pas encore tenté de voter (ex: avant l'ouverture du scrutin).
    public function verifyBulk(Request $request, Election $election): JsonResponse
    {
        $this->authorize('manage electors', $election);

        $request->validate([
            'elector_uuids' => 'required|array|min:1',
            'elector_uuids.*' => 'string',
        ]);

        $electors = $election->electors()
            ->whereIn('uuid', $request->input('elector_uuids'))
            ->where('verification_status', '!=', 'verified')
            ->get();

        foreach ($electors as $elector) {
            $elector->verify();
        }

        return $this->success([
            'verified_count' => $electors->count(),
        ], "{$electors->count()} électeur(s) vérifié(s) avec succès.");
    }
}

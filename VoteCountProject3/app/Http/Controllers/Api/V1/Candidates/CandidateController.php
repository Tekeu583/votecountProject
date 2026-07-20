<?php

namespace App\Http\Controllers\Api\V1\Candidates;

use App\Http\Controllers\Api\V1\BaseApiController;
use App\Http\Requests\Api\V1\Candidates\CreateCandidateRequest;
use App\Http\Requests\Api\V1\Candidates\ImportCandidatesRequest;
use App\Http\Requests\Api\V1\Candidates\UpdateCandidateRequest;
use App\Http\Resources\Api\V1\CandidateResource;
use App\Jobs\ImportCandidatesJob;
use App\Models\Candidate;
use App\Models\Category;
use App\Models\Election;
use App\Models\ImportJob;
use App\Services\CandidateService;
use App\Services\TrashService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\StreamedResponse;

class CandidateController extends BaseApiController
{
    protected CandidateService $candidateService;

    public function __construct(CandidateService $candidateService)
    {
        $this->candidateService = $candidateService;
    }

    public function index(Election $election, Request $request): JsonResponse
    {
        // Route publique MAIS aussi appelée par les gestionnaires authentifiés
        // (SPA cookie stateful → $request->user() résolu). On distingue :
        //  - gestionnaire de CETTE élection : voit tous les statuts + les emails ;
        //  - visiteur public : uniquement les candidats approuvés, sans email
        //    (anti-fuite de données personnelles).
        $user = $request->user();
        $canManage = $user && $user->can('manageCandidates', $election);

        $query = $election->candidates()->with(['category', 'user']);

        if ($canManage) {
            $request->attributes->set('expose_candidate_email', true);
            if ($request->has('status')) {
                $query->where('status', $request->status);
            }
        } else {
            $query->where('status', 'approved');
        }

        if ($request->has('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        $candidates = $query->orderBy('position')
            ->paginate($request->get('per_page', 15));

        return $this->paginated($candidates, CandidateResource::class);
    }

    /**
     * Candidatures de l'utilisateur connecté, toutes élections confondues.
     */
    public function mine(): JsonResponse
    {
        $candidates = Candidate::where('user_id', Auth::id())
            ->with(['election', 'category'])
            ->orderByDesc('created_at')
            ->get();

        return $this->success(CandidateResource::collection($candidates));
    }

    public function store(CreateCandidateRequest $request, Election $election): JsonResponse
    {
        $data = $request->validated();

        $data['category_id'] = $request->resolveCategoryId();

        // Stocker les fichiers et remplacer par leur chemin
        if ($request->hasFile('photo')) {
            $data['photo'] = $this->candidateService->storePhoto(
                $request->file('photo'),
                'candidates/photos'
            );
        }

        if ($request->hasFile('cover_photo')) {
            $data['cover_photo'] = $this->candidateService->storePhoto(
                $request->file('cover_photo'),
                'candidates/covers'
            );
        }

        // Valider l'adresse email
        if (isset($data['email']) && !filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
            $data['email'] = null;
        }

        $candidate = $this->candidateService->create($election, $data);

        return $this->created(new CandidateResource($candidate), 'Candidate created successfully');
    }

    public function show(Election $election, Candidate $candidate, Request $request): JsonResponse
    {
        $canManage = $request->user() && $request->user()->can('manageCandidates', $election);

        // Un candidat non approuvé n'est visible que par un gestionnaire.
        if (! $canManage && $candidate->status !== 'approved') {
            return $this->notFound('Candidat introuvable.');
        }

        if ($canManage) {
            $request->attributes->set('expose_candidate_email', true);
        }

        $candidate->load(['category', 'user', 'documents']);

        return $this->success(new CandidateResource($candidate));
    }

    public function update(UpdateCandidateRequest $request, Election $election, Candidate $candidate): JsonResponse
    {
        $this->authorize('edit candidates', $candidate);
        $data = $request->validated();

        if ($request->filled('category_id')) {
            $data['category_id'] = $request->resolveCategoryId();
        }

        if ($request->hasFile('photo')) {
            $data['photo'] = $this->candidateService->storePhoto(
                $request->file('photo'),
                'candidates/photos'
            );
        }

        if ($request->hasFile('cover_photo')) {
            $data['cover_photo'] = $this->candidateService->storePhoto(
                $request->file('cover_photo'),
                'candidates/covers'
            );
        }

        $candidate = $this->candidateService->update($candidate, $data);

        return $this->success(new CandidateResource($candidate), 'Candidate updated successfully');
    }

    public function destroy(Election $election, Candidate $candidate): JsonResponse
    {
        $this->authorize('delete', $candidate);

        TrashService::snapshot($candidate, $election->organization_id, $election->created_by);
        $candidate->delete();

        return $this->noContent('Candidate deleted successfully');
    }

    /**
     * Importer des candidats depuis un fichier Excel/CSV
     */
    public function import(ImportCandidatesRequest $request, Election $election): JsonResponse
    {
        $file = $request->file('file');
        $path = $file->store('imports/candidates/' . $election->id, 'public');

        $importJob = ImportJob::create([
            'uuid' => Str::uuid()->toString(),
            'organization_id' => $election->organization_id,
            'type' => 'candidates',
            'file_path' => $path,
            'imported_by' => Auth::user()->id,
            'status' => 'pending',
        ]);

        // Dispatch le job en arrière-plan
        dispatch(new ImportCandidatesJob($importJob, $election, Auth::user()->id));

        return $this->accepted([
            'import_job_id' => $importJob->uuid,
            'status' => $importJob->status,
            'message' => 'L\'import des candidats a été lancé. Vous serez notifié à la fin.',
        ]);
    }

    /**
     * Vérifier le statut d'un import
     */
    public function importStatus(Election $election, string $importJobId): JsonResponse
    {
        $importJob = ImportJob::where('uuid', $importJobId)
            ->where('organization_id', $election->organization_id)
            ->firstOrFail();

        return $this->success([
            'status' => $importJob->status,
            'total_rows' => $importJob->total_rows,
            'success_rows' => $importJob->success_rows,
            'failed_rows' => $importJob->failed_rows,
            'errors' => $importJob->errors()->get()->map(function ($error) {
                return [
                    'row' => $error->row_number,
                    'message' => $error->error_message,
                ];
            }),
            'completed_at' => $importJob->completed_at,
        ]);
    }

    /**
     * Télécharger le template Excel pour l'import
     */
    public function downloadTemplate(): StreamedResponse
    {
        $headers = [
            'full_name',
            'email',
            'phone',
            'bio',
            'manifesto',
            'slogan',
            'position',
            'category',
        ];

        $example = [
            'Jean Dupont',
            'jean.dupont@example.com',
            '+225 07 XX XX XX',
            'Ingénieur logiciel avec 10 ans d\'expérience',
            'Programme pour le développement de la région',
            'Ensemble pour l\'avenir',
            '1',
            'Politique',
        ];

        $callback = function () use ($headers, $example) {
            $file = fopen('php://output', 'w');
            fputcsv($file, $headers, ';');
            fputcsv($file, $example, ';');
            fclose($file);
        };

        return response()->streamDownload($callback, 'candidates_template.csv', [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="candidates_template.csv"',
        ]);
    }
    public function approve(Election $election, Candidate $candidate): JsonResponse
    {
        $this->authorize('approve', $candidate);

        $this->candidateService->approve($candidate, Auth::user()->id);

        return $this->success(null, 'Candidate approved successfully');
    }

    public function reject(Request $request, Election $election, Candidate $candidate): JsonResponse
    {
        $this->authorize('reject', $candidate);

        $request->validate(['reason' => 'required|string']);

        $this->candidateService->reject($candidate, Auth::user()->id, $request->reason);

        return $this->success(null, 'Candidate rejected');
    }
}

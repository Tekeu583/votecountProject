<?php

namespace App\Http\Controllers\Api\V1\CandidateDocuments;

use App\Http\Controllers\Api\V1\BaseApiController;
use App\Http\Requests\Api\V1\CandidateDocuments\UploadDocumentRequest;
use App\Http\Resources\Api\V1\CandidateDocumentResource;
use App\Models\Candidate;
use App\Models\CandidateDocument;
use App\Services\CandidateDocumentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CandidateDocumentController extends BaseApiController
{
    protected CandidateDocumentService $documentService;

    public function __construct(CandidateDocumentService $documentService)
    {
        $this->documentService = $documentService;
    }

    /**
     * Liste des documents d'un candidat
     */
    public function index(Candidate $candidate): JsonResponse
    {
        $this->authorize('view', $candidate);

        $documents = $candidate->documents()->orderBy('created_at', 'desc')->get();

        return $this->collection($documents, CandidateDocumentResource::class);
    }

    /**
     * Uploader un document
     */
    public function upload(UploadDocumentRequest $request, Candidate $candidate): JsonResponse
    {
        $this->authorize('update', $candidate);

        $document = $this->documentService->addDocument(
            $candidate,
            $request->file('file'),
            $request->type,
            $request->description
        );

        return $this->created(new CandidateDocumentResource($document), 'Document ajouté avec succès');
    }

    /**
     * Détail d'un document
     */
    public function show(Candidate $candidate, CandidateDocument $document): JsonResponse
    {
        $this->authorize('view', $candidate);

        if ($document->candidate_id !== $candidate->id) {
            return $this->notFound('Document non trouvé');
        }

        return $this->success(new CandidateDocumentResource($document));
    }

    /**
     * Supprimer un document
     */
    public function destroy(Candidate $candidate, CandidateDocument $document): JsonResponse
    {
        $this->authorize('update', $candidate);

        if ($document->candidate_id !== $candidate->id) {
            return $this->notFound('Document non trouvé');
        }

        $this->documentService->deleteDocument($document);

        return $this->noContent('Document supprimé avec succès');
    }

    /**
     * Télécharger un document
     */
    public function download(Candidate $candidate, CandidateDocument $document): \Symfony\Component\HttpFoundation\BinaryFileResponse|JsonResponse
    {
        $this->authorize('view', $candidate);

        if ($document->candidate_id !== $candidate->id) {
            return $this->notFound('Document non trouvé');
        }

        $fullPath = storage_path('app/public/' . $document->file_path);

        if (!file_exists($fullPath)) {
            return $this->notFound('Fichier non trouvé');
        }

        return response()->download($fullPath, $document->file_name);
    }

    /**
     * Obtenir les types de documents disponibles
     */
    public function getDocumentTypes(): JsonResponse
    {
        $types = $this->documentService->getAvailableDocumentTypes();

        $formattedTypes = [];
        foreach ($types as $type) {
            $formattedTypes[] = [
                'type' => $type,
                'label' => $this->getTypeLabel($type),
                'allowed_formats' => $this->documentService->getAllowedFormats($type),
                'max_size_mb' => round($this->documentService->getMaxSize($type) / 1024 / 1024, 2),
            ];
        }

        return $this->success($formattedTypes);
    }

    private function getTypeLabel(string $type): string
    {
        return match ($type) {
            'identity_card' => 'Carte d\'identité',
            'passport' => 'Passeport',
            'diploma' => 'Diplôme',
            'resume' => 'CV',
            'cover_letter' => 'Lettre de motivation',
            'certificate' => 'Certificat',
            'photo' => 'Photo d\'identité',
            default => ucfirst($type),
        };
    }
}

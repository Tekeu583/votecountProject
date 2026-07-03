<?php

namespace App\Services;

use App\Models\Candidate;
use App\Models\CandidateApplication;
use App\Models\CandidateDocument;
use App\Models\Election;
use App\Services\CandidateDocumentService;
use App\Services\CandidateNumberService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class CandidateApplicationService
{
    protected CandidateDocumentService $documentService;
    public function __construct(CandidateDocumentService $documentService)
    {
        $this->documentService = $documentService;
    }
    public function submit(Election $election, array $data): CandidateApplication
    {
        return DB::transaction(function () use ($election, $data) {
            // Upload de la photo
            $photoPath = null;
            if (isset($data['photo']) && $data['photo']) {
                $photoPath = $data['photo']->store('candidate-applications/photos', 'public');
            }

            // Upload de la pièce d'identité
            $identityPath = null;
            if (isset($data['identity_document']) && $data['identity_document']) {
                $identityPath = $data['identity_document']->store('candidate-applications/identities', 'public');
            }

            $application = CandidateApplication::create([
                'uuid' => Str::uuid()->toString(),
                'election_id' => $election->id,
                'first_name' => $data['first_name'],
                'last_name' => $data['last_name'],
                'email' => $data['email'],
                'phone' => $data['phone'] ?? null,
                'gender' => $data['gender'] ?? null,
                'photo' => $photoPath,
                'identity_document' => $identityPath,
                'manifesto' => $data['manifesto'] ?? null,
                'slogan' => $data['slogan'] ?? null,
                'bio' => $data['bio'] ?? null,
                'application_status' => 'pending',
            ]);

            return $application;
        });
    }

    public function approve(CandidateApplication $application, int $userId): void
    {
        DB::transaction(function () use ($application, $userId) {
            // Mettre à jour le statut de la candidature
            $application->approve($userId);

            // Créer le candidat à partir de la candidature
            $slug = Str::slug($application->full_name);
            $originalSlug = $slug;
            $counter = 1;

            while (Candidate::where('election_id', $application->election_id)
                ->where('slug', $slug)
                ->exists()
            ) {
                $slug = $originalSlug . '-' . $counter++;
            }

            $candidateNumber = CandidateNumberService::next($application->election_id);

            // Copier la photo vers le dossier des candidats
            $newPhotoPath = null;
            if ($application->photo) {
                $newPhotoPath = $this->copyFile($application->photo, 'candidates/photos');
            }

            $candidate = Candidate::create([
                'uuid' => Str::uuid()->toString(),
                'election_id' => $application->election_id,
                'full_name' => $application->full_name,
                'slug' => $slug,
                'photo' => $newPhotoPath,
                'bio' => $application->bio,
                'manifesto' => $application->manifesto,
                'slogan' => $application->slogan,
                'status' => 'approved',
                'approved_by' => $userId,
                'approved_at' => now(),
                'position' => $candidateNumber,
                'candidate_number' => $candidateNumber,
            ]);
            if ($application->identity_document) {
                $newIdentityPath = $this->copyFile($application->identity_document, "candidates/{$candidate->uuid}/documents/identity");

                CandidateDocument::create([
                    'uuid' => Str::uuid()->toString(),
                    'candidate_id' => $candidate->id,
                    'type' => 'identity_card',
                    'file_path' => $newIdentityPath,
                    'uploaded_at' => now(),
                ]);
            }
            // Si d'autres documents sont attachés à la candidature, les copier aussi
            // Cette partie dépend de ta logique métier
        });
    }

    public function reject(CandidateApplication $application, int $userId, string $reason): void
    {
        $application->reject($userId, $reason);
    }

    private function copyFile(string $oldPath, string $newDirectory): string
    {
        $oldFullPath = storage_path('app/public/' . $oldPath);
        $extension = pathinfo($oldFullPath, PATHINFO_EXTENSION);
        $newFileName = Str::uuid()->toString() . '.' . $extension;
        $newPath = $newDirectory . '/' . $newFileName;

        Storage::disk('public')->copy($oldPath, $newPath);

        return $newPath;
    }
}

<?php

namespace App\Services;

use App\Models\Candidate;
use App\Models\CandidateDocument;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class CandidateDocumentService
{
    protected array $allowedTypes = [
        'identity_card' => ['pdf', 'jpg', 'jpeg', 'png'],
        'passport' => ['pdf', 'jpg', 'jpeg', 'png'],
        'diploma' => ['pdf'],
        'resume' => ['pdf'],
        'cover_letter' => ['pdf'],
        'certificate' => ['pdf'],
        'photo' => ['jpg', 'jpeg', 'png'],
        'other' => ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx'],
    ];

    protected array $maxSizes = [
        'identity_card' => 5 * 1024 * 1024, // 5MB
        'passport' => 5 * 1024 * 1024,
        'diploma' => 10 * 1024 * 1024, // 10MB
        'resume' => 5 * 1024 * 1024,
        'cover_letter' => 5 * 1024 * 1024,
        'certificate' => 10 * 1024 * 1024,
        'photo' => 5 * 1024 * 1024,
        'other' => 10 * 1024 * 1024,
    ];

    /**
     * Ajouter un document à un candidat
     */
    public function addDocument(Candidate $candidate, UploadedFile $file, string $type, ?string $description = null): CandidateDocument
    {
        $this->validateFile($file, $type);

        // Déterminer le dossier de stockage
        $directory = "candidates/{$candidate->uuid}/documents/{$type}";
        
        // Générer un nom de fichier unique
        $filename = Str::uuid()->toString() . '.' . $file->getClientOriginalExtension();
        
        // Stocker le fichier
        $path = $file->storeAs($directory, $filename, 'public');

        return CandidateDocument::create([
            'uuid' => Str::uuid()->toString(),
            'candidate_id' => $candidate->id,
            'type' => $type,
            'file_path' => $path,
            'uploaded_at' => now(),
        ]);
    }

    /**
     * Supprimer un document
     */
    public function deleteDocument(CandidateDocument $document): bool
    {
        $document->deleteFile();
        return $document->delete();
    }

    /**
     * Supprimer tous les documents d'un candidat
     */
    public function deleteAllDocuments(Candidate $candidate): void
    {
        foreach ($candidate->documents as $document) {
            $this->deleteDocument($document);
        }
    }

    /**
     * Récupérer les documents d'un candidat par type
     */
    public function getDocumentsByType(Candidate $candidate, string $type): \Illuminate\Database\Eloquent\Collection
    {
        return $candidate->documents()->where('type', $type)->get();
    }

    /**
     * Vérifier si un candidat a un document d'un certain type
     */
    public function hasDocumentType(Candidate $candidate, string $type): bool
    {
        return $candidate->documents()->where('type', $type)->exists();
    }

    /**
     * Valider le fichier
     */
    protected function validateFile(UploadedFile $file, string $type): void
    {
        if (!isset($this->allowedTypes[$type])) {
            throw new \InvalidArgumentException("Type de document non supporté: {$type}");
        }

        $extension = strtolower($file->getClientOriginalExtension());
        
        if (!in_array($extension, $this->allowedTypes[$type])) {
            $allowed = implode(', ', $this->allowedTypes[$type]);
            throw new \InvalidArgumentException("Format non supporté pour {$type}. Formats acceptés: {$allowed}");
        }

        $maxSize = $this->maxSizes[$type] ?? 5 * 1024 * 1024;
        
        if ($file->getSize() > $maxSize) {
            $maxSizeMB = round($maxSize / 1024 / 1024, 2);
            throw new \InvalidArgumentException("Fichier trop volumineux pour {$type}. Maximum: {$maxSizeMB}MB");
        }
    }

    /**
     * Obtenir les types de documents disponibles
     */
    public function getAvailableDocumentTypes(): array
    {
        return array_keys($this->allowedTypes);
    }

    /**
     * Obtenir les formats acceptés pour un type
     */
    public function getAllowedFormats(string $type): array
    {
        return $this->allowedTypes[$type] ?? [];
    }

    /**
     * Obtenir la taille maximale pour un type
     */
    public function getMaxSize(string $type): int
    {
        return $this->maxSizes[$type] ?? 5 * 1024 * 1024;
    }
}
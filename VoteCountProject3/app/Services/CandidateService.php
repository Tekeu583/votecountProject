<?php

namespace App\Services;

use App\Events\CandidateApproved;
use App\Events\CandidateRejected;
use App\Models\Candidate;
use App\Models\Election;
use App\Models\User;
use App\Services\CandidateNumberService;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class CandidateService
{
    public function create(Election $election, array $data): Candidate
    {
        return DB::transaction(function () use ($election, $data) {
            // Générer un slug unique
            $slug = Str::slug($data['full_name']);
            $originalSlug = $slug;
            $counter = 1;

            while (Candidate::where('election_id', $election->id)->where('slug', $slug)->exists()) {
                $slug = $originalSlug . '-' . $counter++;
            }

            // Numéro de candidat automatique basé sur le nombre de candidats existants dans l'élection
            $candidateNumber = CandidateNumberService::next($election->id);

            return Candidate::create([
                'uuid' => Str::uuid()->toString(),
                'election_id' => $election->id,
                'full_name' => $data['full_name'],
                'slug' => $slug,
                'email' => $data['email'] ?? null,
                'phone' => $data['phone'] ?? null,
                'bio' => $data['bio'] ?? null,
                'manifesto' => $data['manifesto'] ?? null,
                'slogan' => $data['slogan'] ?? null,
                'position' => $data['position'] ?? $candidateNumber,
                'candidate_number' => $candidateNumber,
                'category_id' => $data['category_id'] ?? null,
                'user_id' => $data['user_id'] ?? null,
                'photo'            => $data['photo'] ?? null,
                'cover_photo'      => $data['cover_photo'] ?? null,
                // Candidat ajouté directement par l'admin → approuvé automatiquement
                // Candidature publique (CandidateApplication) → pending
                'status'           => $data['status'] ?? 'approved',

            ]);
        });
    }

    public function update(Candidate $candidate, array $data): Candidate
    {
        if (isset($data['full_name']) && $data['full_name'] !== $candidate->full_name) {
            $slug = Str::slug($data['full_name']);
            $originalSlug = $slug;
            $counter = 1;

            while (Candidate::where('election_id', $candidate->election_id)
                ->where('slug', $slug)
                ->where('id', '!=', $candidate->id)
                ->exists()
            ) {
                $slug = $originalSlug . '-' . $counter++;
            }

            $data['slug'] = $slug;
        }

        // Supprimer l'ancienne photo si une nouvelle est fournie
        if (isset($data['photo']) && $candidate->photo) {
            Storage::disk('public')->delete($candidate->photo);
        }
        if (isset($data['cover_photo']) && $candidate->cover_photo) {
            Storage::disk('public')->delete($candidate->cover_photo);
        }
        // Le numéro de candidat ne doit pas être modifié manuellement, il est géré automatiquement à la création et ne doit pas être mis à jour via cette méthode
        unset($data['candidate_number']);
        $candidate->update($data);

        return $candidate->fresh();
    }

    /**
     * Stocke un fichier image et retourne son chemin relatif.
     *
     * Le chemin retourné (ex: "candidates/photos/uuid.jpg") est stocké
     * dans la colonne string de la base de données.
     * L'URL publique est générée par l'accesseur photo_url du modèle :
     *   asset('storage/' . $this->photo)
     *
     * Prérequis : php artisan storage:link
     */
    public function storePhoto(UploadedFile $file, string $folder = 'candidates/photos'): string
    {
        $extension = $file->getClientOriginalExtension();
        $filename  = Str::uuid() . '.' . $extension;
        return $file->storeAs($folder, $filename, 'public');
    }

    public function approve(Candidate $candidate, int $userId): void
    {
        $candidate->approve($userId);
        event(new CandidateApproved($candidate));
    }


    public function reject(Candidate $candidate, int $userId, string $reason): void
    {
        $candidate->reject($userId, $reason);
        event(new CandidateRejected($candidate, $reason));
    }

    public function delete(Candidate $candidate): void
    {
        $candidate->delete();
    }
}

<?php

namespace App\Http\Resources\Api\V1;

use App\Http\Resources\Api\V1\CategoryResource;
use App\Http\Resources\Api\V1\ElectionResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CandidateResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'uuid' => $this->uuid,
            'full_name' => $this->full_name,
            // PII : l'email n'est exposé que dans un contexte autorisé (gestionnaire
            // de l'élection / admin d'organisation). Le contrôleur pose l'attribut
            // 'expose_candidate_email' après vérification ; par défaut (routes
            // publiques de vote/consultation) l'email reste masqué.
            'email' => $this->when(
                (bool) $request->attributes->get('expose_candidate_email', false),
                fn () => $this->email
            ),
            'slug' => $this->slug,
            'photo' => $this->photo ? asset('storage/' . $this->photo) : null,
            'cover_photo' => $this->cover_photo ? asset('storage/' . $this->cover_photo) : null,
            'bio' => $this->bio,
            'manifesto' => $this->manifesto,
            'slogan' => $this->slogan,

            'position' => $this->position,
            'candidate_number' => $this->candidate_number,
            'rank' => $this->rank,
            'rank_label' => $this->rank_label,
            'is_leading'             => $this->is_leading,
            'status' => $this->status,
            'is_approved' => $this->is_approved,

            'statistics' => [
                'vote_count' => $this->vote_count,
                'score_total' => $this->score_total,
                'ranking_score' => $this->ranking_score,
                'final_score' => $this->final_score,
            ],

            'category' => new CategoryResource($this->whenLoaded('category')),
            'election' => new ElectionResource($this->whenLoaded('election')),

            'approved_at' => $this->approved_at?->toIso8601String(),
            'rejected_at' => $this->rejected_at?->toIso8601String(),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}

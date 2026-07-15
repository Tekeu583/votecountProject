<?php

namespace App\Http\Resources\Api\V1;

use App\Http\Resources\Api\V1\CandidateResource;
use App\Http\Resources\Api\V1\OrganizationResource;
use App\Http\Resources\Api\V1\UserResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ElectionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'uuid' => $this->uuid,
            'title' => $this->title,
            'slug' => $this->slug,
            'short_description' => $this->short_description,
            'description' => $this->description,
            'banner' => $this->banner ? asset('storage/' . $this->banner) : null,
            'thumbnail' => $this->thumbnail ? asset('storage/' . $this->thumbnail) : null,

            'election_mode' => $this->election_mode,
            'voter_code' => $this->when(
                $request->user()
                    // Nécessaire pour éviter un lazy load — Model::shouldBeStrict()
                    // (AppServiceProvider) interdit le lazy loading dans tous les
                    // environnements, pas seulement local. Si 'organization' n'a
                    // pas été eager-loadée par l'appelant, ce champ est simplement
                    // omis plutôt que de planter (comportement déjà "opt-in" via when()).
                    && $this->relationLoaded('organization')
                    && $this->organization
                    && $this->organization->users()
                    ->where('user_id', $request->user()->id)
                    ->wherePivot('status', 'active')
                    ->exists(),
                $this->voter_code
            ),

            'vote_type' => $this->vote_type->value,
            'vote_type_label' => $this->vote_type->label(),
            'visibility_type' => $this->visibility_type,
            'payment_type' => $this->payment_type,
            'verification_mode' => $this->verification_mode,
            'has_categories' => $this->has_categories,

            'status' => $this->status->value,
            'status_label' => $this->status->label(),
            'is_votable' => $this->is_votable,
            'is_editable' => $this->is_editable,

            'start_at' => $this->start_at?->toIso8601String(),
            'end_at' => $this->end_at?->toIso8601String(),
            'published_at' => $this->published_at?->toIso8601String(),

            'max_votes_per_user' => $this->max_votes_per_user,
            'max_choices' => $this->max_choices,
            'ranking_enabled' => $this->ranking_enabled,
            'otp_required' => $this->otp_required,
            'public_results' => $this->public_results,
            'real_time_results' => $this->real_time_results,
            'allow_guest_vote' => $this->allow_guest_vote,

            'vote_price' => $this->vote_price,
            'currency' => $this->currency,

            // ── Vote pondéré (vote_type = weighted) ──────────────
            'public_weight' => $this->when($this->vote_type->value === 'weighted', $this->public_weight),
            'jury_weight' => $this->when($this->vote_type->value === 'weighted', $this->jury_weight),

            // ── Phase de candidature
            'accepts_candidates'    => $this->accepts_candidates,
            'candidacy_start_at'    => $this->candidacy_start_at?->toIso8601String(),
            'candidacy_end_at'      => $this->candidacy_end_at?->toIso8601String(),
            'max_candidates'        => $this->max_candidates,
            'is_open_for_candidacy' => $this->is_open_for_candidacy,

            'statistics' => [
                'total_votes' => $this->total_votes,
                'total_electors'      => $this->needsElectorList()
                    ? ($this->electors_count ?? 0)
                    : null,
                'participation_rate'  => $this->needsElectorList()
                    ? $this->getParticipationRate()
                    : null,
                'total_revenue' => $this->total_revenue,
                'remaining_time' => $this->remaining_time,
                'progress_percentage' => $this->progress_percentage,
            ],

            'candidates_count' => $this->candidates_count ?? 0,
            'electors_count' => $this->electors_count ?? 0,

            'organization' => new OrganizationResource($this->whenLoaded('organization')),
            'creator' => new UserResource($this->whenLoaded('creator')),
            'candidates' => CandidateResource::collection(
                $this->whenLoaded('candidates')
            ),

            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}

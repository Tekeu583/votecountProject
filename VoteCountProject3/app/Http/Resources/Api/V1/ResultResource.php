<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ResultResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'election_uuid' => $this->election->uuid,
            'election_title' => $this->election->title,
            'total_votes' => $this->election->total_votes,
            'participation_rate' => $this->election->getParticipationRate(),

            'candidates' => $this->election->results()
                ->with('candidate')
                ->orderBy('rank')
                ->get()
                ->map(function ($result) {
                    return [
                        'candidate_uuid' => $result->candidate->uuid,
                        'candidate_name' => $result->candidate->full_name,
                        'votes' => $result->total_votes,
                        'percentage' => $result->percentage,
                        'final_score' => $result->final_score,
                        'rank' => $result->rank,
                    ];
                }),

            'calculated_at' => $this->calculated_at?->toIso8601String(),
        ];
    }
}

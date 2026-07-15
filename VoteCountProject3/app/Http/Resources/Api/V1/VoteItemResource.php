<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class VoteItemResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'candidate' => new CandidateResource($this->whenLoaded('candidate')),
            'candidate_id' => $this->candidate_id,
            'rank_position' => $this->rank_position,
            'score' => $this->score,
            'weight' => $this->weight,
            'quantity' => $this->quantity,
        ];
    }
}

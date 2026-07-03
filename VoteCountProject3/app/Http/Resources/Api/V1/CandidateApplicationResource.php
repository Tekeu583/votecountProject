<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class CandidateApplicationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'uuid' => $this->uuid,
            'first_name' => $this->first_name,
            'last_name' => $this->last_name,
            'full_name' => $this->full_name,
            'email' => $this->email,
            'phone' => $this->phone,
            'gender' => $this->gender,
            'photo' => $this->photo ? Storage::url($this->photo) : null,
            'manifesto' => $this->manifesto,
            'slogan' => $this->slogan,
            'bio' => $this->bio,
            'application_status' => $this->application_status,
            'status_label' => $this->getStatusLabel(),
            'rejection_reason' => $this->rejection_reason,
            'submitted_at' => $this->created_at?->toIso8601String(),
            'approved_at' => $this->approved_at?->toIso8601String(),
            'rejected_at' => $this->rejected_at?->toIso8601String(),
        ];
    }
}
<?php

namespace App\Events;

use App\Models\Candidate;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class CandidateApproved
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public Candidate $candidate;

    public function __construct(Candidate $candidate)
    {
        $this->candidate = $candidate;
    }

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('election.'.$this->candidate->election_id),
        ];
    }
}

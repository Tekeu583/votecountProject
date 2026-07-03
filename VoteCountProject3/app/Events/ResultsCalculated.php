<?php

namespace App\Events;

use App\Models\Election;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ResultsCalculated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public Election $election;

    public function __construct(Election $election)
    {
        $this->election = $election;
    }

    public function broadcastOn(): array
    {
        return [
            new Channel('election.'.$this->election->id),
            new Channel('election.'.$this->election->id.'.admin'),
        ];
    }

    public function broadcastWith(): array
    {
        $latestSnapshot = $this->election->resultSnapshots()->latest()->first();

        return [
            'election_uuid' => $this->election->uuid,
            'results' => $latestSnapshot?->snapshot,
            'calculated_at' => now()->toIso8601String(),
        ];
    }

    public function broadcastAs(): string
    {
        return 'results.calculated';
    }
}

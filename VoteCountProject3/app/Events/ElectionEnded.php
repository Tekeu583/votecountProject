<?php

namespace App\Events;

use App\Models\Election;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ElectionEnded implements ShouldBroadcast
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
            new PrivateChannel('organization.'.$this->election->organization_id),
            new Channel('election.'.$this->election->id),
        ];
    }

    public function broadcastWith(): array
    {
        return [
            'election_uuid' => $this->election->uuid,
            'title' => $this->election->title,
            'total_votes' => $this->election->total_votes,
            'ended_at' => now()->toIso8601String(),
        ];
    }

    public function broadcastAs(): string
    {
        return 'election.ended';
    }
}

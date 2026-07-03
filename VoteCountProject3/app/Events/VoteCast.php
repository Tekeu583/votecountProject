<?php

namespace App\Events;

use App\Models\Vote;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class VoteCast implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public Vote $vote;

    public function __construct(Vote $vote)
    {
        $this->vote = $vote;
    }

    public function broadcastOn(): array
    {
        return [
            new Channel('election.'.$this->vote->election_id),
            new PrivateChannel('election.'.$this->vote->election_id.'.admin'),
        ];
    }

    public function broadcastWith(): array
    {
        return [
            'election_uuid' => $this->vote->election->uuid,
            'vote_uuid' => $this->vote->uuid,
            'timestamp' => $this->vote->created_at->toIso8601String(),
            'total_votes' => $this->vote->election->total_votes + 1,
        ];
    }

    public function broadcastAs(): string
    {
        return 'vote.cast';
    }
}

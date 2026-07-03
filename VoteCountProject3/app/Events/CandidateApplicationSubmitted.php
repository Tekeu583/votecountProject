<?php

namespace App\Events;

use App\Models\CandidateApplication;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class CandidateApplicationSubmitted implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public CandidateApplication $application;

    public function __construct(CandidateApplication $application)
    {
        $this->application = $application;
    }

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('election.' . $this->application->election_id . '.admin'),
        ];
    }

    public function broadcastWith(): array
    {
        return [
            'uuid' => $this->application->uuid,
            'full_name' => $this->application->full_name,
            'email' => $this->application->email,
            'submitted_at' => $this->application->created_at->toIso8601String(),
        ];
    }

    public function broadcastAs(): string
    {
        return 'candidate.application.submitted';
    }
}
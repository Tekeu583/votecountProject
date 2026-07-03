<?php

namespace App\Jobs;

use App\Models\Vote;
use App\Services\FraudDetectionService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class ProcessFraudDetection implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, SerializesModels;

    public Vote $vote;

    public function __construct(Vote $vote)
    {
        $this->vote = $vote;
    }

    public function handle(FraudDetectionService $fraudService): void
    {
        // Récupérer l'historique des votes pour cet électeur et cette IP
        $historicalData = [
            'ip_votes' => Vote::where('ip_address', $this->vote->ip_address)
                ->where('id', '!=', $this->vote->id)
                ->count(),
            'device_votes' => Vote::where('device_id', $this->vote->device_id)
                ->where('id', '!=', $this->vote->id)
                ->count(),
            'time_since_last_vote' => Vote::where('elector_id', $this->vote->elector_id)
                ->where('id', '!=', $this->vote->id)
                ->latest()
                ->first()
                ?->created_at->diffInSeconds(now()),
            'location_changed' => $this->checkLocationChange(),
        ];

        $fraudResult = $fraudService->analyze($this->vote, $historicalData);

        $this->vote->updateFraudScore($fraudResult['signals'], $fraudResult['score']);

        if ($fraudResult['score'] > 0.7) {
            $this->vote->markAsFraudulent();
            event(new FraudDetected($this->vote, $fraudResult));
        }
    }

    private function checkLocationChange(): bool
    {
        $lastVote = Vote::where('elector_id', $this->vote->elector_id)
            ->where('id', '!=', $this->vote->id)
            ->latest()
            ->first();

        if (! $lastVote) {
            return false;
        }

        return $lastVote->country !== $this->vote->country
            || $lastVote->city !== $this->vote->city;
    }
}

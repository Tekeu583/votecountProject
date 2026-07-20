<?php

namespace App\Services;

use App\DTOs\VoteDTO;
use App\Enums\FraudSeverity;
use App\Models\Election;
use App\Models\Elector;
use App\Models\SecurityAlert;
use App\Models\Vote;
use Illuminate\Support\Str;

class FraudDetectionService
{
    private array $weights = [
        'same_ip' => 0.25,
        'same_device' => 0.20,
        'rapid_voting' => 0.30,
        'unusual_location' => 0.15,
        'suspicious_timing' => 0.10,
    ];

    /**
     * ✅ Analyse de fraude avec un vote existant
     */
    public function analyzeVote(Vote $vote, Elector $elector, Election $election, VoteDTO $dto): float
    {
        $historicalData = $this->getHistoricalData($vote);
        $result = $this->analyze($vote, $historicalData);

        return $result['score'];
    }


    /**
     * ✅ Méthode originale modifiée pour accepter Vote
     */
    public function analyze(Vote $vote, array $historicalData = []): array
    {
        $signals = [];
        $score = 0;

        // Check same IP rapid voting
        if (isset($historicalData['ip_votes']) && $historicalData['ip_votes'] > 3) {
            $signals['same_ip'] = min(($historicalData['ip_votes'] - 3) / 20, 1);
            $score += $signals['same_ip'] * $this->weights['same_ip'];
        }

        // Check same device
        if (isset($historicalData['device_votes']) && $historicalData['device_votes'] > 2) {
            $signals['same_device'] = min(($historicalData['device_votes'] - 2) / 10, 1);
            $score += $signals['same_device'] * $this->weights['same_device'];
        }

        // Check rapid voting
        if (isset($historicalData['time_since_last_vote']) && $historicalData['time_since_last_vote'] < 10) {
            $signals['rapid_voting'] = 1 - ($historicalData['time_since_last_vote'] / 10);
            $score += $signals['rapid_voting'] * $this->weights['rapid_voting'];
        }

        // Check unusual location
        if (isset($historicalData['location_changed']) && $historicalData['location_changed']) {
            $signals['unusual_location'] = 0.8;
            $score += $this->weights['unusual_location'];
        }

        // Check suspicious timing
        $hour = now()->hour;
        if ($hour >= 0 && $hour <= 5) {
            $signals['suspicious_timing'] = 0.5;
            $score += $this->weights['suspicious_timing'];
        }

        $finalScore = min($score, 1.0);
        $severity = $this->getSeverity($finalScore);

        if ($finalScore > 0.6) {
            $this->createSecurityAlert($vote, $signals, $finalScore, $severity);
        }

        return [
            'score' => $finalScore,
            'signals' => $signals,
            'severity' => $severity->value,
            'requires_review' => $severity->requiresManualReview(),
        ];
    }



    private function getSeverity(float $score): FraudSeverity
    {
        if ($score >= 0.8) {
            return FraudSeverity::CRITICAL;
        }
        if ($score >= 0.6) {
            return FraudSeverity::HIGH;
        }
        if ($score >= 0.4) {
            return FraudSeverity::MEDIUM;
        }

        return FraudSeverity::LOW;
    }


    private function createSecurityAlert(Vote $vote, array $signals, float $score, FraudSeverity $severity): void
    {
        SecurityAlert::create([
            'uuid' => \Illuminate\Support\Str::uuid()->toString(),
            'election_id' => $vote->election_id,
            'elector_id' => $vote->elector_id,
            // Null-safe : elector_id est nullable (votes anonymes/invités) et,
            // même présent, elector->user_id l'est aussi. security_alerts.user_id
            // est nullable → on stocke null plutôt que de crasher.
            'user_id' => $vote->elector?->user_id,
            'type' => 'fraud_detected',
            'severity' => $severity,
            'ip_address' => $vote->ip_address,
            'device' => $vote->browser,
            'metadata' => [
                'fraud_score' => $score,
                'signals' => $signals,
                'vote_id' => $vote->id,
            ],
        ]);
    }

    public function getHistoricalData(Vote $vote): array
    {
        $ipVotes = Vote::where('ip_address', $vote->ip_address)
            ->where('id', '!=', $vote->id)
            ->where('created_at', '>=', now()->subHours(24))
            ->count();

        $deviceVotes = Vote::where('device_id', $vote->device_id)
            ->where('id', '!=', $vote->id)
            ->where('created_at', '>=', now()->subHours(24))
            ->count();

        $lastVote = Vote::where('elector_id', $vote->elector_id)
            ->where('id', '!=', $vote->id)
            ->latest()
            ->first();

        $timeSinceLastVote = $lastVote ? $lastVote->created_at->diffInSeconds(now()) : null;

        $lastVoteLocation = Vote::where('elector_id', $vote->elector_id)
            ->where('id', '!=', $vote->id)
            ->latest()
            ->first();

        $locationChanged = $lastVoteLocation
            && ($lastVoteLocation->country !== $vote->country
                || $lastVoteLocation->city !== $vote->city);

        return [
            'ip_votes' => $ipVotes,
            'device_votes' => $deviceVotes,
            'time_since_last_vote' => $timeSinceLastVote,
            'location_changed' => $locationChanged,
        ];
    }
}

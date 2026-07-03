<?php

use App\Enums\FraudSeverity;

if (! function_exists('detect_fraud_patterns')) {
    function detect_fraud_patterns(array $voteData, array $historicalData): array
    {
        $signals = [];
        $score = 0;

        // Check same IP rapid voting
        if (isset($historicalData['ip_votes']) && $historicalData['ip_votes'] > 5) {
            $signals['same_ip'] = min(($historicalData['ip_votes'] - 5) / 20, 1);
            $score += $signals['same_ip'] * 0.3;
        }

        // Check same device
        if (isset($historicalData['device_votes']) && $historicalData['device_votes'] > 3) {
            $signals['same_device'] = min(($historicalData['device_votes'] - 3) / 10, 1);
            $score += $signals['same_device'] * 0.25;
        }

        // Check rapid voting (less than 10 seconds between votes)
        if (isset($historicalData['time_since_last_vote']) && $historicalData['time_since_last_vote'] < 10) {
            $signals['rapid_voting'] = 1 - ($historicalData['time_since_last_vote'] / 10);
            $score += $signals['rapid_voting'] * 0.35;
        }

        // Check unusual location
        if (isset($historicalData['location_changed']) && $historicalData['location_changed']) {
            $signals['unusual_location'] = 0.8;
            $score += 0.4;
        }

        // Determine severity
        $severity = FraudSeverity::LOW;
        if ($score >= FraudSeverity::CRITICAL->threshold()) {
            $severity = FraudSeverity::CRITICAL;
        } elseif ($score >= FraudSeverity::HIGH->threshold()) {
            $severity = FraudSeverity::HIGH;
        } elseif ($score >= FraudSeverity::MEDIUM->threshold()) {
            $severity = FraudSeverity::MEDIUM;
        }

        return [
            'score' => min($score, 1.0),
            'signals' => $signals,
            'severity' => $severity->value,
            'requires_review' => $severity->requiresManualReview(),
        ];
    }
}

<?php

use App\Models\Election;
use App\Models\Elector;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

if (! function_exists('uuid_v4')) {
    /**
     * Générer un UUID v4
     */
    function uuid_v4(): string
    {
        return Str::uuid()->toString();
    }
}

if (! function_exists('generate_voter_code')) {

    /**
     * Génère un voter_code unique GLOBALEMENT, pour une élection.
     *
     * Ce code n'appartient PAS à un électeur individuel : il est
     * propre à l'élection privée et permet d'accéder à son interface
     * de vote. L'identification précise de l'électeur se fait ensuite
     * via son email + un OTP (voir VoteController::verifyAccess()).
     */

    function generate_voter_code(): string
    {
        do {
            $code = strtoupper(Str::random(12));
        } while (Election::where('voter_code', $code)->exists());

        return $code;
    }
}

if (! function_exists('generate_otp_code')) {
    /**
     * Générer un code OTP
     */
    function generate_otp_code(int $length = 6): string
    {
        return str_pad(random_int(0, 10 ** $length - 1), $length, '0', STR_PAD_LEFT);
    }
}

if (! function_exists('log_security')) {
    /**
     * Log d'événement de sécurité
     */
    function log_security(string $action, array $data = [], ?int $userId = null): void
    {
        Log::channel('security')->info($action, array_merge($data, [
            'user_id' => $userId ?? Auth::id(),
            'ip' => request()->ip(),
            'user_agent' => request()->userAgent(),
            'timestamp' => now(),
        ]));
    }
}

if (! function_exists('cache_remember_forever')) {
    /**
     * Cache permanent avec tags (nécessite Redis)
     */
    function cache_remember_forever(string $key, callable $callback)
    {
        return Cache::tags($key)->rememberForever($key, $callback);
    }
}

if (! function_exists('cache_forget_by_tag')) {
    /**
     * Invalider cache par tag
     */
    function cache_forget_by_tag(string $tag): void
    {
        Cache::tags($tag)->flush();
    }
}

if (! function_exists('format_phone_number')) {
    /**
     * Formatter numéro de téléphone international
     */
    function format_phone_number(string $phone): string
    {
        // Enlève tous les caractères non numériques
        $phone = preg_replace('/[^0-9+]/', '', $phone);

        return $phone;
    }
}

if (! function_exists('calculate_fraud_score')) {
    /**
     * Calculer score de fraude basé sur des règles
     */
    function calculate_fraud_score(array $signals): float
    {
        $weights = [
            'same_ip' => 0.3,
            'same_device' => 0.25,
            'rapid_voting' => 0.35,
            'unusual_location' => 0.4,
            'suspicious_timing' => 0.2,
        ];

        $score = 0;
        foreach ($signals as $signal => $value) {
            if (isset($weights[$signal])) {
                $score += $weights[$signal] * $value;
            }
        }

        return min($score, 1.0);
    }
}

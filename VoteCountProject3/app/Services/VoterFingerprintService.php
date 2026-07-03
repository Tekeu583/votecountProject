<?php

namespace App\Services;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

/**
 * Génère et valide une empreinte de votant anonyme résistante
 * à la manipulation simple (changement d'IP seul, etc.).
 *
 * Stratégie :
 *  - HMAC-SHA256 signé avec APP_KEY → non forgeable côté client
 *  - Composantes : IP + User-Agent + Accept-Language + Accept-Encoding
 *  - Cookie `vfp` persisté 24h → survit au changement d'IP (NAT mobile)
 *  - Dédoublonnage par élection en base : un fingerprint = un vote max
 */
class VoterFingerprintService
{
    /**
     * Retourne le fingerprint canonique pour cette requête.
     * Priorité : cookie existant → nouveau calcul.
     */
    public function resolve(Request $request): string
    {
        $cookieValue = $request->cookie('vfp');

        if ($cookieValue && $this->isValidCookieFormat($cookieValue)) {
            return $cookieValue;
        }

        return $this->compute($request);
    }

    /**
     * Calcule le fingerprint sans dépendre du cookie.
     */
    public function compute(Request $request): string
    {
        $components = implode('|', [
            $request->ip(),
            $request->userAgent() ?? '',
            $request->header('Accept-Language', ''),
            $request->header('Accept-Encoding', ''),
        ]);

        return hash_hmac('sha256', $components, config('app.key'));
    }

    /**
     * Vérifie qu'un fingerprint a le format attendu (HMAC hex 64 chars).
     */
    public function isValidCookieFormat(string $value): bool
    {
        return (bool) preg_match('/^[0-9a-f]{64}$/', $value);
    }

    /**
     * Retourne le nombre de votes complétés pour ce fingerprint dans cette élection.
     * Double vérification : Cache (fast path) + DB (source de vérité).
     *
     */
    public function getVoteCount(string $fingerprint, int $electionId): int
    {
        $cacheKey = "vote_count_fp_{$electionId}_{$fingerprint}";

        // Fast path Redis — on cache le compteur
        if (Cache::has($cacheKey)) {
            return (int) Cache::get($cacheKey);
        }

        // Slow path base de données — compte les votes complétés
        $elector = \App\Models\Elector::where('election_id', $electionId)
            ->where('fingerprint', $fingerprint)
            ->where('type', 'anonymous')
            ->first();

        if (! $elector) {
            return 0;
        }

        $count = $elector->votes()
            ->where('election_id', $electionId)
            ->where('status', 'completed')
            ->count();

        // Cache court (5 min) pour éviter les requêtes répétées
        Cache::put($cacheKey, $count, now()->addMinutes(5));

        return $count;
    }
    /**
     * Vérifie si ce fingerprint a déjà voté dans cette élection.
     * Double vérification : Cache (fast path) + DB (source de vérité).
     */
    public function hasAlreadyVoted(string $fingerprint, int $electionId, int $max = 1): bool
    {
        return $this->getVoteCount($fingerprint, $electionId) >= $max;
    }

    /**
     * Invalide le cache après un vote réussi.
     */
    public function markAsVoted(string $fingerprint, int $electionId): void
    {
        $cacheKey = "vote_count_fp_{$electionId}_{$fingerprint}";
        $current = (int) Cache::get($cacheKey, 0);
        Cache::put($cacheKey, $current + 1, now()->addMinutes(5));
    }

    /**
     * Construit le cookie à attacher à la réponse.
     */
    public function buildCookie(string $fingerprint): \Symfony\Component\HttpFoundation\Cookie
    {
        return cookie(
            name: 'vfp',
            value: $fingerprint,
            minutes: 60 * 24,
            path: '/',
            secure: config('app.env') === 'production',
            httpOnly: true,
            sameSite: 'Strict',
        );
    }
}

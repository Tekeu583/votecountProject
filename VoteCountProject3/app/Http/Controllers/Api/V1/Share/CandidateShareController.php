<?php

namespace App\Http\Controllers\Api\V1\Share;

use App\Http\Controllers\Controller;
use App\Models\Candidate;
use App\Models\Election;
use Illuminate\Http\Response;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

/**
 * Aperçu enrichi des liens de campagne partagés sur les réseaux sociaux.
 *
 * WhatsApp, Facebook et consorts n'exécutent PAS JavaScript : ils lisent le
 * HTML brut renvoyé par le serveur. Or nginx sert le même `index.html` pour
 * toutes les routes de la SPA, donc tous les liens partagés afficheraient la
 * même vignette. Ce contrôleur renvoie une page HTML minimale dont les balises
 * Open Graph décrivent LE candidat partagé (comme la miniature d'une vidéo
 * YouTube plutôt que le logo de YouTube).
 *
 * Il n'est atteint que par les robots : le nginx du frontend les reconnaît à
 * leur User-Agent et leur redirige la requête ici. Les visiteurs humains
 * reçoivent la SPA habituelle.
 */
class CandidateShareController extends Controller
{
    /** Longueur maximale de la description affichée par les réseaux sociaux. */
    private const DESCRIPTION_MAX = 200;

    public function show(Election $election, Candidate $candidate): Response
    {
        $this->assertShareable($election, $candidate);

        $name = trim($candidate->full_name);

        return response()
            ->view('share.candidate', [
                'title'       => "Votez pour {$name}",
                'description' => $this->buildDescription($election, $candidate, $name),
                'image'       => $this->resolveImage($election, $candidate),
                'canonical'   => $this->frontendUrl($election, $candidate),
                'candidate'   => $candidate,
                'election'    => $election,
            ])
            // L'aperçu doit se rafraîchir si le candidat change de photo, sans
            // pour autant refaire tourner la requête à chaque scan de robot.
            ->header('Cache-Control', 'public, max-age=600');
    }

    /**
     * Un lien de campagne ne doit exposer que ce qui est déjà public.
     *
     * Sans ce garde-fou, l'URL permettrait de sonder les candidats d'élections
     * privées — qui ne sont visibles que muni d'un code de vote.
     */
    private function assertShareable(Election $election, Candidate $candidate): void
    {
        if ($candidate->election_id !== $election->id) {
            throw new NotFoundHttpException();
        }

        if ($election->election_mode !== 'public') {
            throw new NotFoundHttpException();
        }

        // `status` n'est pas casté en enum sur Candidate (contrairement à
        // Election) : c'est une simple chaîne. On accepte les deux formes pour
        // rester correct si un cast est ajouté plus tard.
        $status = $candidate->status instanceof \BackedEnum
            ? $candidate->status->value
            : $candidate->status;

        if ($status !== 'approved') {
            throw new NotFoundHttpException();
        }
    }

    private function buildDescription(Election $election, Candidate $candidate, string $name): string
    {
        $parts = [$election->title];

        $number = $candidate->candidate_number;
        $parts[] = $number ? "{$name}, N°{$number}." : "{$name}.";

        if (filled($candidate->slogan)) {
            $parts[] = '« '.trim($candidate->slogan).' »';
        } elseif (filled($candidate->bio)) {
            $parts[] = trim($candidate->bio);
        }

        return \Illuminate\Support\Str::limit(
            preg_replace('/\s+/u', ' ', implode(' — ', $parts)),
            self::DESCRIPTION_MAX
        );
    }

    /**
     * Photo du candidat, à défaut bannière de son élection, à défaut logo.
     *
     * L'URL doit être ABSOLUE : les réseaux sociaux téléchargent l'image depuis
     * leurs propres serveurs, un chemin relatif ne leur dit rien.
     */
    private function resolveImage(Election $election, Candidate $candidate): string
    {
        foreach ([$candidate->photo, $election->banner] as $path) {
            if (blank($path)) {
                continue;
            }

            // Certaines images historiques sont stockées comme URL complète.
            return str_starts_with($path, 'http')
                ? $path
                : $this->publicUrl('storage/'.ltrim($path, '/'));
        }

        return $this->publicUrl('og/default.png');
    }

    /**
     * URL absolue bâtie sur APP_URL, et non sur la requête entrante.
     *
     * `asset()` dérive l'URL de l'hôte reçu : la requête du robot étant relayée
     * par le nginx du frontend vers le conteneur backend, elle produirait une
     * adresse interne (« backend:8000 ») que les serveurs de WhatsApp ne
     * peuvent pas atteindre — l'aperçu resterait sans image.
     */
    private function publicUrl(string $path): string
    {
        return rtrim(config('app.url'), '/').'/'.ltrim($path, '/');
    }

    /** URL réellement partagée, celle que le visiteur humain ouvrira. */
    private function frontendUrl(Election $election, Candidate $candidate): string
    {
        return sprintf(
            '%s/details/candidat/election/%s/candidate/%s?from=share',
            rtrim(config('app.frontend_url'), '/'),
            $election->uuid,
            $candidate->uuid
        );
    }
}

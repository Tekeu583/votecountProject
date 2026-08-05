<?php

namespace Tests\Feature;

use App\Models\Candidate;
use App\Models\Election;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Aperçu des liens de campagne sur les réseaux sociaux.
 *
 * WhatsApp/Facebook n'exécutent pas JavaScript : sans cette page servie par le
 * serveur, tout lien partagé afficherait la même vignette (le logo de la
 * plateforme) au lieu de la photo du candidat concerné.
 */
class CandidateShareOgTest extends TestCase
{
    use RefreshDatabase;

    private function shareUrl(Election $election, Candidate $candidate): string
    {
        return "/api/v1/share/elections/{$election->uuid}/candidates/{$candidate->uuid}";
    }

    private function publicElection(array $overrides = []): Election
    {
        return Election::factory()->create(array_merge([
            'election_mode' => 'public',
            'status'        => 'published',
            'title'         => 'Miss & Master 2026',
            'banner'        => 'elections/banners/banniere.jpg',
        ], $overrides));
    }

    private function approvedCandidate(Election $election, array $overrides = []): Candidate
    {
        return Candidate::factory()->create(array_merge([
            'election_id'      => $election->id,
            'status'           => 'approved',
            'full_name'        => 'Audrey Glory',
            'candidate_number' => 3,
            'slogan'           => 'Ensemble, allons plus loin',
        ], $overrides));
    }

    public function test_la_photo_du_candidat_est_l_image_de_l_apercu(): void
    {
        $election  = $this->publicElection();
        $candidate = $this->approvedCandidate($election, ['photo' => 'candidates/photos/audrey.jpg']);

        $response = $this->get($this->shareUrl($election, $candidate));

        $response->assertOk();
        $response->assertSee('property="og:image" content="'.config('app.url').'/storage/candidates/photos/audrey.jpg"', false);
        $response->assertSee('property="og:title" content="Votez pour Audrey Glory"', false);
        $response->assertSee('name="twitter:card" content="summary_large_image"', false);
    }

    public function test_la_banniere_de_l_election_prend_le_relais_sans_photo(): void
    {
        $election  = $this->publicElection();
        $candidate = $this->approvedCandidate($election, ['photo' => null]);

        $this->get($this->shareUrl($election, $candidate))
            ->assertOk()
            ->assertSee('property="og:image" content="'.config('app.url').'/storage/elections/banners/banniere.jpg"', false);
    }

    public function test_le_logo_sert_de_dernier_recours(): void
    {
        $election  = $this->publicElection(['banner' => null]);
        $candidate = $this->approvedCandidate($election, ['photo' => null]);

        $this->get($this->shareUrl($election, $candidate))
            ->assertOk()
            ->assertSee('property="og:image" content="'.config('app.url').'/og/default.png"', false);
    }

    public function test_l_url_de_l_image_ne_depend_pas_de_l_hote_de_la_requete(): void
    {
        // La requête du robot est relayée par le nginx du frontend vers le
        // conteneur backend : si l'URL était dérivée de l'hôte reçu, elle
        // pointerait vers une adresse interne inaccessible aux serveurs de
        // WhatsApp, et l'aperçu s'afficherait sans image.
        $election  = $this->publicElection();
        $candidate = $this->approvedCandidate($election, ['photo' => 'candidates/photos/audrey.jpg']);

        $response = $this->withServerVariables(['HTTP_HOST' => 'backend:8000'])
            ->get($this->shareUrl($election, $candidate));

        $response->assertOk();
        $response->assertDontSee('backend:8000', false);
        $response->assertSee(config('app.url').'/storage/candidates/photos/audrey.jpg', false);
    }

    public function test_le_lien_pointe_vers_la_page_publique_du_candidat(): void
    {
        $election  = $this->publicElection();
        $candidate = $this->approvedCandidate($election);

        $attendu = rtrim(config('app.frontend_url'), '/')
            ."/details/candidat/election/{$election->uuid}/candidate/{$candidate->uuid}?from=share";

        $this->get($this->shareUrl($election, $candidate))
            ->assertOk()
            ->assertSee('property="og:url" content="'.e($attendu).'"', false);
    }

    public function test_une_election_privee_n_est_pas_exposee(): void
    {
        // Les candidats d'une élection privée ne sont visibles qu'avec un code
        // de vote : cette URL ne doit pas permettre de les énumérer.
        $election  = $this->publicElection(['election_mode' => 'private']);
        $candidate = $this->approvedCandidate($election);

        $this->get($this->shareUrl($election, $candidate))->assertNotFound();
    }

    public function test_un_candidat_non_approuve_n_est_pas_exposee(): void
    {
        $election  = $this->publicElection();
        $candidate = $this->approvedCandidate($election, ['status' => 'pending']);

        $this->get($this->shareUrl($election, $candidate))->assertNotFound();
    }

    public function test_un_candidat_d_une_autre_election_est_refuse(): void
    {
        $election      = $this->publicElection();
        $autreElection = $this->publicElection();
        $candidate     = $this->approvedCandidate($autreElection);

        $this->get($this->shareUrl($election, $candidate))->assertNotFound();
    }

    public function test_aucune_authentification_n_est_requise(): void
    {
        // Le robot de WhatsApp n'a évidemment aucune session.
        $election  = $this->publicElection();
        $candidate = $this->approvedCandidate($election);

        $this->assertGuest();
        $this->get($this->shareUrl($election, $candidate))->assertOk();
    }
}

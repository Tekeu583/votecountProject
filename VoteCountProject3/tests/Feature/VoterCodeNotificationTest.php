<?php

namespace Tests\Feature;

use App\Models\Election;
use App\Models\Elector;
use App\Notifications\VoterCodeNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Le code de vote est le SEUL moyen d'accéder à une élection privée : si cette
 * notification échoue, plus aucun électeur ne peut voter.
 *
 * Elle lisait `start_date`/`end_date`, colonnes inexistantes (elles s'appellent
 * `start_at`/`end_at`). Avec `preventAccessingMissingAttributes`, chaque envoi
 * levait une MissingAttributeException : le job partait en échec sans que rien
 * ne soit visible côté interface.
 */
class VoterCodeNotificationTest extends TestCase
{
    use RefreshDatabase;

    private function privateElection(array $overrides = []): Election
    {
        return Election::factory()->create(array_merge([
            'election_mode' => 'private',
            'voter_code'    => 'ABCD1234',
            'start_at'      => now()->addDay(),
            'end_at'        => now()->addDays(8),
        ], $overrides));
    }

    public function test_le_mail_du_code_de_vote_est_genere_sans_erreur(): void
    {
        $election = $this->privateElection();
        $elector  = Elector::factory()->create(['election_id' => $election->id]);

        $mail = (new VoterCodeNotification($election, $elector))->toMail($elector);

        $this->assertSame('emails.voter-code', $mail->view);
        $this->assertSame($elector->full_name, $mail->viewData['electorFullName']);
        $this->assertSame(
            $election->start_at->format('d/m/Y à H:i'),
            $mail->viewData['dateStart']
        );
        $this->assertSame(
            $election->end_at->format('d/m/Y à H:i'),
            $mail->viewData['dateEnd']
        );
    }

    public function test_les_dates_absentes_ne_font_pas_echouer_l_envoi(): void
    {
        // start_at/end_at sont nullables en base : un repli est indispensable,
        // sinon on remplace une erreur par une autre.
        $election = $this->privateElection(['start_at' => null, 'end_at' => null]);
        $elector  = Elector::factory()->create(['election_id' => $election->id]);

        $mail = (new VoterCodeNotification($election, $elector))->toMail($elector);

        $this->assertSame('À définir', $mail->viewData['dateStart']);
        $this->assertSame('À définir', $mail->viewData['dateEnd']);
    }

    public function test_le_gabarit_html_du_mail_se_rend_reellement(): void
    {
        // Rendre la vue prouve que le mail part vraiment : une variable
        // manquante casserait l'envoi en production, pas le test unitaire.
        $election = $this->privateElection();
        $elector  = Elector::factory()->create(['election_id' => $election->id]);

        $mail = (new VoterCodeNotification($election, $elector))->toMail($elector);
        $html = view($mail->view, $mail->viewData)->render();

        $this->assertStringContainsString($elector->full_name, $html);
        $this->assertStringContainsString('ABCD', $html); // voter_code découpé par blocs
    }
}

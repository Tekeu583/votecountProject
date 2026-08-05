<?php

namespace Tests\Feature;

use App\Imports\CandidatesImport;
use App\Models\Candidate;
use App\Models\Election;
use App\Models\ImportJob;
use App\Models\Organization;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Maatwebsite\Excel\Facades\Excel;
use Tests\TestCase;

/**
 * L'import de candidats utilisait le concern WithValidation, qui valide tout le
 * fichier AVANT d'exécuter collection() et lève une exception au premier
 * manquement. Une seule ligne vide en fin de feuille — artefact très courant
 * d'Excel — annulait donc l'import COMPLET : aucun candidat n'était créé, alors
 * que l'interface annonçait « Import réussi ! ».
 *
 * La validation est désormais faite ligne par ligne : les lignes valides sont
 * importées, les invalides rejetées individuellement avec leur numéro de ligne.
 */
class CandidatesImportTest extends TestCase
{
    use RefreshDatabase;

    private const HEADER = "full_name,email,phone,bio,manifesto,slogan,position,category\n";

    private Election $election;
    private ImportJob $importJob;

    protected function setUp(): void
    {
        parent::setUp();

        $owner = User::factory()->create();
        $organization = Organization::factory()->create(['owner_user_id' => $owner->id]);

        $this->election = Election::factory()->create([
            'organization_id' => $organization->id,
            'created_by'      => $owner->id,
            'has_categories'  => false,
        ]);

        $this->importJob = ImportJob::create([
            'uuid'            => Str::uuid()->toString(),
            'organization_id' => $organization->id,
            'type'            => 'candidates',
            'file_path'       => 'imports/candidates/test.csv',
            'imported_by'     => $owner->id,
            'status'          => 'pending',
        ]);
    }

    /** Écrit un CSV temporaire et lance l'import dessus. */
    private function importCsv(string $body): void
    {
        $path = tempnam(sys_get_temp_dir(), 'cand_').'.csv';
        file_put_contents($path, self::HEADER.$body);

        try {
            Excel::import(new CandidatesImport($this->election, $this->importJob), $path);
        } finally {
            @unlink($path);
        }

        $this->importJob->refresh();
    }

    public function test_les_lignes_vides_n_annulent_pas_l_import(): void
    {
        // Deux candidats valides suivis de lignes vides, comme Excel en produit.
        $this->importCsv(
            "Legrand Ayissi,legrand@example.com,+237655234503,Medecin,,,,\n"
            ."Marie Nlend,marie@example.com,,,,,,\n"
            .",,,,,,,\n"
            .",,,,,,,\n"
        );

        $this->assertSame(2, Candidate::where('election_id', $this->election->id)->count());
        $this->assertSame(2, $this->importJob->success_rows);
        $this->assertSame(0, $this->importJob->failed_rows);
        // Les lignes vides ne sont ni importées ni comptées ni signalées.
        $this->assertSame(2, $this->importJob->total_rows);
    }

    public function test_les_lignes_valides_sont_importees_malgre_une_ligne_fautive(): void
    {
        $this->importCsv(
            "Legrand Ayissi,legrand@example.com,,,,,,\n"
            ."=[1]Electeurs!A89,gertrude@example.com,,,,,,\n"
            ."Marie Nlend,marie@example.com,,,,,,\n"
        );

        $noms = Candidate::where('election_id', $this->election->id)->pluck('full_name');
        $this->assertCount(2, $noms);
        $this->assertContains('Legrand Ayissi', $noms->all());
        $this->assertContains('Marie Nlend', $noms->all());

        $this->assertSame(2, $this->importJob->success_rows);
        $this->assertSame(1, $this->importJob->failed_rows);
    }

    public function test_une_formule_excel_non_resolue_est_rejetee_avec_sa_ligne(): void
    {
        $this->importCsv(
            "Legrand Ayissi,legrand@example.com,,,,,,\n"
            ."=[1]Electeurs!A89,gertrude@example.com,,,,,,\n"
        );

        $erreur = $this->importJob->errors()->first();

        // Ligne 3 du tableur : 1 en-tête + 2e ligne de données.
        $this->assertSame(3, $erreur->row_number);
        $this->assertStringContainsString('Formule Excel', $erreur->error_message);
    }

    public function test_une_adresse_email_invalide_est_rejetee(): void
    {
        $this->importCsv("Legrand Ayissi,pas-un-email,,,,,,\n");

        $this->assertSame(0, Candidate::where('election_id', $this->election->id)->count());
        $this->assertStringContainsString(
            'e-mail invalide',
            $this->importJob->errors()->first()->error_message
        );
    }

    public function test_les_espaces_superflus_sont_nettoyes(): void
    {
        // Un e-mail copié-collé traîne souvent une espace : sans nettoyage il
        // serait rejeté comme invalide alors que la ligne est correcte.
        $this->importCsv("  Legrand Ayissi  ,  legrand@example.com  ,,,,,,\n");

        $candidat = Candidate::where('election_id', $this->election->id)->first();

        $this->assertNotNull($candidat, "La ligne aurait dû être importée après nettoyage");
        $this->assertSame('Legrand Ayissi', $candidat->full_name);
        $this->assertSame('legrand@example.com', $candidat->email);
    }

    public function test_un_email_duplique_dans_l_election_est_rejete(): void
    {
        $this->importCsv(
            "Legrand Ayissi,legrand@example.com,,,,,,\n"
            ."Autre Personne,legrand@example.com,,,,,,\n"
        );

        $this->assertSame(1, Candidate::where('election_id', $this->election->id)->count());
        $this->assertSame(1, $this->importJob->failed_rows);
    }
}

<?php

namespace Tests\Feature;

use App\Http\Resources\Api\V1\AuditLogResource;
use App\Models\AuditLog;
use App\Models\Election;
use App\Models\Organization;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

/**
 * La traçabilité est un pilier de la sécurité de la plateforme : c'est elle qui
 * permet de dire QUI a modifié QUOI en cas de contestation d'un scrutin.
 *
 * Elle n'était pourtant couverte par aucun test : HasAudit court-circuitait
 * l'écriture dès que l'environnement valait « testing ». Si logAudit() avait
 * cessé de fonctionner, rien ne l'aurait signalé. Le garde-fou est désormais
 * piloté par config('audit.enabled'), ce qui rend l'audit vérifiable.
 */
class AuditLogTest extends TestCase
{
    use RefreshDatabase;

    private function election(): Election
    {
        $owner = User::factory()->create();
        $organization = Organization::factory()->create(['owner_user_id' => $owner->id]);

        return Election::factory()->create([
            'organization_id' => $organization->id,
            'created_by'      => $owner->id,
        ]);
    }

    public function test_l_audit_reste_desactive_par_defaut_pendant_les_tests(): void
    {
        // Sans ce réglage, chaque test écrirait dans audit_logs et la suite
        // s'en trouverait ralentie sans bénéfice.
        $this->assertFalse(config('audit.enabled'));

        $election = $this->election();
        $election->update(['title' => 'Nouveau titre']);

        $this->assertSame(0, AuditLog::count());
    }

    public function test_une_modification_est_tracee_avec_le_champ_concerne(): void
    {
        $election = $this->election();

        config(['audit.enabled' => true]);
        $election->update(['title' => 'Élection du bureau 2026']);

        $log = AuditLog::where('entity_type', Election::class)
            ->where('entity_id', $election->id)
            ->where('action', 'updated')
            ->latest('id')
            ->first();

        $this->assertNotNull($log, "Aucune entrée d'audit n'a été écrite");
        $this->assertSame('Élection du bureau 2026', $log->new_values['title']);
        $this->assertArrayHasKey('title', $log->old_values);
    }

    public function test_seuls_les_champs_modifies_sont_conserves(): void
    {
        $election = $this->election();

        config(['audit.enabled' => true]);
        $election->update(['title' => 'Titre B']);

        $log = AuditLog::where('entity_id', $election->id)->where('action', 'updated')->latest('id')->first();

        // old_values contenait auparavant l'enregistrement ENTIER (une trentaine
        // de colonnes), ce qui gonflait la table et recopiait des données
        // sensibles sans rapport avec la modification.
        $this->assertSame(['title'], array_keys($log->old_values));
    }

    public function test_l_horodatage_technique_n_est_pas_journalise(): void
    {
        $election = $this->election();

        config(['audit.enabled' => true]);
        $election->update(['title' => 'Titre C']);

        $log = AuditLog::where('entity_id', $election->id)->where('action', 'updated')->latest('id')->first();

        // updated_at change à chaque écriture : le journaliser produirait une
        // ligne « Modifié » sans information exploitable.
        $this->assertArrayNotHasKey('updated_at', $log->new_values);
    }

    public function test_le_mot_de_passe_n_est_jamais_enregistre_en_clair(): void
    {
        $user = User::factory()->create();

        config(['audit.enabled' => true]);
        $nouveau = Hash::make('un-mot-de-passe-solide');
        $user->update(['password' => $nouveau]);

        $log = AuditLog::where('entity_type', User::class)
            ->where('entity_id', $user->id)
            ->latest('id')
            ->first();

        $this->assertNotNull($log);
        $this->assertArrayHasKey('password', $log->new_values, 'La trace du changement doit subsister');
        $this->assertSame(config('audit.mask'), $log->new_values['password']);
        $this->assertStringNotContainsString($nouveau, json_encode($log->new_values));
    }

    public function test_la_ressource_api_expose_le_detail_des_changements(): void
    {
        $election = $this->election();

        config(['audit.enabled' => true]);
        $election->update(['title' => 'Titre final']);

        $log = AuditLog::where('entity_id', $election->id)->where('action', 'updated')->latest('id')->first();
        $data = (new AuditLogResource($log))->toArray(request());

        $this->assertSame('Modifié', $data['action_label']);

        $titre = collect($data['changes'])->firstWhere('field', 'title');

        // C'est précisément ce qui manquait à l'interface : elle affichait
        // « Modifié » sans jamais dire quoi.
        $this->assertNotNull($titre);
        $this->assertSame('Titre', $titre['label']);
        $this->assertSame('Titre final', $titre['new']);
        $this->assertNotSame($titre['old'], $titre['new']);
    }
}

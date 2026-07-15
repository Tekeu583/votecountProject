<?php

namespace Tests\Feature;

use App\DTOs\UserDTO;
use App\Models\Candidate;
use App\Models\CandidateApplication;
use App\Models\Election;
use App\Models\User;
use App\Services\AuthService;
use App\Services\CandidateApplicationService;
use App\Services\CandidateService;
use App\Services\ElectionService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Str;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * Un candidat n'est jamais obligé d'avoir un compte VoteCount, mais s'il en
 * a un (ou en crée un après coup), il doit automatiquement obtenir le rôle
 * Spatie "candidat" et une entrée election_user (role_slug=candidat) pour
 * accéder à son espace candidat — sans action manuelle d'un admin.
 */
class CandidateAccountLinkTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        // register() déclenche l'envoi d'un email de vérification.
        Queue::fake();
    }

    public function test_creer_un_candidat_avec_un_email_correspondant_lie_automatiquement_le_compte(): void
    {
        $user = User::factory()->create(['email' => 'candidat@example.com']);
        $election = Election::factory()->create();

        $candidate = app(CandidateService::class)->create($election, [
            'full_name' => 'Jean Dupont',
            'email' => 'candidat@example.com',
        ]);

        $this->assertEquals($user->id, $candidate->fresh()->user_id);
        $this->assertTrue($user->fresh()->hasRole('candidat'));
        $this->assertDatabaseHas('election_user', [
            'election_id' => $election->id,
            'user_id' => $user->id,
            'role_slug' => 'candidat',
        ]);
    }

    public function test_creer_un_candidat_sans_compte_correspondant_ne_leve_pas_derreur(): void
    {
        $election = Election::factory()->create();

        $candidate = app(CandidateService::class)->create($election, [
            'full_name' => 'Sans Compte',
            'email' => 'personne@example.com',
        ]);

        $this->assertNull($candidate->fresh()->user_id);
    }

    public function test_approuver_une_candidature_lie_le_compte_si_lemail_correspond(): void
    {
        $user = User::factory()->create(['email' => 'applicant@example.com']);
        $election = Election::factory()->create();
        $approver = User::factory()->create();

        $application = CandidateApplication::create([
            'uuid' => (string) Str::uuid(),
            'election_id' => $election->id,
            'first_name' => 'Marie',
            'last_name' => 'Curie',
            'email' => 'applicant@example.com',
            'phone' => '699999999',
            'application_status' => 'pending',
        ]);

        app(CandidateApplicationService::class)->approve($application, $approver->id);

        $candidate = Candidate::where('email', 'applicant@example.com')->first();
        $this->assertNotNull($candidate);
        $this->assertEquals($user->id, $candidate->user_id);
        $this->assertTrue($user->fresh()->hasRole('candidat'));
    }

    public function test_creer_un_compte_apres_avoir_ete_candidat_le_lie_retroactivement(): void
    {
        $election = Election::factory()->create();
        $candidate = app(CandidateService::class)->create($election, [
            'full_name' => 'Futur Inscrit',
            'email' => 'futur@example.com',
        ]);
        $this->assertNull($candidate->fresh()->user_id);

        $dto = new UserDTO(
            firstName: 'Futur',
            lastName: 'Inscrit',
            email: 'futur@example.com',
            phone: '699999999',
            password: 'password123',
        );
        $user = app(AuthService::class)->register($dto);

        $this->assertEquals($user->id, $candidate->fresh()->user_id);
        $this->assertTrue($user->fresh()->hasRole('candidat'));
        $this->assertDatabaseHas('election_user', [
            'election_id' => $election->id,
            'user_id' => $user->id,
            'role_slug' => 'candidat',
        ]);
    }

    public function test_un_candidat_deja_lie_par_un_autre_role_sur_lelection_ne_duplique_pas_election_user(): void
    {
        $user = User::factory()->create(['email' => 'creator-candidat@example.com']);
        $election = Election::factory()->create(['created_by' => $user->id]);
        // addManager() lit Auth::user() pour "assigned_by".
        Sanctum::actingAs($user);
        app(ElectionService::class)->addManager($election, $user, 'creator');

        app(CandidateService::class)->create($election, [
            'full_name' => 'Créateur Candidat',
            'email' => 'creator-candidat@example.com',
        ]);

        // Toujours un seul rôle sur cette élection (contrainte unique
        // election_id+user_id) — "creator" reste inchangé...
        $this->assertEquals(1, DB::table('election_user')
            ->where('election_id', $election->id)
            ->where('user_id', $user->id)
            ->count());
        $this->assertDatabaseHas('election_user', [
            'election_id' => $election->id,
            'user_id' => $user->id,
            'role_slug' => 'creator',
        ]);
        // ...mais le rôle global "candidat" est bien assigné (utile pour
        // ses autres élections).
        $this->assertTrue($user->fresh()->hasRole('candidat'));
    }

    /**
     * Régression : supprimer un candidat laissait le rôle election_user
     * (role_slug='candidat') orphelin — le compte restait bloqué "déjà
     * affecté à cette élection" pour toute nouvelle affectation (jury,
     * manager, observer), alors même que la candidature n'existait plus.
     */
    public function test_supprimer_un_candidat_retire_le_role_election_user(): void
    {
        $user = User::factory()->create(['email' => 'candidat-a-retirer@example.com']);
        $election = Election::factory()->create();
        $candidate = app(CandidateService::class)->create($election, [
            'full_name' => 'À Retirer',
            'email' => 'candidat-a-retirer@example.com',
        ]);
        $this->assertDatabaseHas('election_user', [
            'election_id' => $election->id,
            'user_id' => $user->id,
            'role_slug' => 'candidat',
        ]);

        $candidate->delete();

        $this->assertDatabaseMissing('election_user', [
            'election_id' => $election->id,
            'user_id' => $user->id,
            'role_slug' => 'candidat',
        ]);
        // Le rôle Spatie global n'est pas retiré (candidat sur d'éventuelles
        // autres élections) — seul le rôle sur CETTE élection l'est.
        $this->assertTrue($user->fresh()->hasRole('candidat'));
    }

    public function test_restaurer_un_candidat_depuis_la_corbeille_relie_le_role(): void
    {
        $user = User::factory()->create(['email' => 'candidat-restaure@example.com']);
        $election = Election::factory()->create();
        $candidate = app(CandidateService::class)->create($election, [
            'full_name' => 'À Restaurer',
            'email' => 'candidat-restaure@example.com',
        ]);
        $candidate->delete();
        $this->assertDatabaseMissing('election_user', [
            'election_id' => $election->id,
            'user_id' => $user->id,
            'role_slug' => 'candidat',
        ]);

        $candidate->fresh()->restore();

        $this->assertDatabaseHas('election_user', [
            'election_id' => $election->id,
            'user_id' => $user->id,
            'role_slug' => 'candidat',
        ]);
    }

    public function test_forcer_la_suppression_dun_candidat_retire_aussi_le_role(): void
    {
        $user = User::factory()->create(['email' => 'candidat-force@example.com']);
        $election = Election::factory()->create();
        $candidate = app(CandidateService::class)->create($election, [
            'full_name' => 'Force Delete',
            'email' => 'candidat-force@example.com',
        ]);

        $candidate->forceDelete();

        $this->assertDatabaseMissing('election_user', [
            'election_id' => $election->id,
            'user_id' => $user->id,
            'role_slug' => 'candidat',
        ]);
    }
}

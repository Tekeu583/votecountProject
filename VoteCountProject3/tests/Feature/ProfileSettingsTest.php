<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * Régression : la page "Paramètres" (Parametres.jsx) appelait déjà
 * PATCH /auth/profile et PATCH /auth/password côté frontend (useProfile.js)
 * mais AUCUNE des deux routes n'existait côté backend — toute tentative de
 * modification du profil échouait silencieusement en 404. Corrigé en
 * ajoutant AuthController::updateProfile()/updatePassword() (délèguent à
 * AuthService, même pattern que resetPassword()).
 *
 * PasswordForm.jsx envoyait aussi toujours currentPassword='' (aucun champ
 * "mot de passe actuel" dans le formulaire) — corrigé côté frontend en même
 * temps, sinon le changement de mot de passe aurait toujours échoué même
 * une fois la route ajoutée.
 */
class ProfileSettingsTest extends TestCase
{
    use RefreshDatabase;

    public function test_met_a_jour_le_profil(): void
    {
        $user = User::factory()->create(['first_name' => 'Ancien', 'phone' => '699000000']);
        Sanctum::actingAs($user);

        $response = $this->patchJson('/api/v1/auth/profile', [
            'first_name' => 'Nouveau',
            'last_name' => $user->last_name,
            'phone' => '677123456',
        ]);

        $response->assertOk();
        $this->assertEquals('Nouveau', $user->fresh()->first_name);
        $this->assertEquals('677123456', $user->fresh()->phone);
    }

    /**
     * Régression : UserResource exposait 'photo' => $this->photo (le chemin
     * brut, ex. "users/photos/xxx.png") au lieu de $this->avatar_url (l'URL
     * complète résolue) — un mismatch de nom de champ (avatar vs photo) avait
     * déjà masqué ce bug une première fois ; ce test fige le CONTENU attendu
     * (URL absolue), pas seulement la présence du champ.
     */
    public function test_expose_une_url_de_photo_absolue_pas_un_chemin_brut(): void
    {
        Storage::fake('public');
        $path = UploadedFile::fake()->image('moi.jpg')->store('users/photos', 'public');
        $user = User::factory()->create(['photo' => $path]);
        Sanctum::actingAs($user);

        $response = $this->getJson('/api/v1/auth/me');

        $response->assertOk();
        $this->assertStringStartsWith('http', $response->json('data.photo'));
        $this->assertStringContainsString($path, $response->json('data.photo'));
    }

    public function test_upload_une_nouvelle_photo_de_profil(): void
    {
        Storage::fake('public');
        $user = User::factory()->create(['photo' => null]);
        Sanctum::actingAs($user);

        $response = $this->patchJson('/api/v1/auth/profile', [
            'first_name' => $user->first_name,
            'photo' => UploadedFile::fake()->image('moi.jpg'),
        ]);

        $response->assertOk();
        $fresh = $user->fresh();
        $this->assertNotNull($fresh->photo);
        Storage::disk('public')->assertExists($fresh->photo);
    }

    public function test_remplace_lancienne_photo_et_la_supprime(): void
    {
        Storage::fake('public');
        $oldPath = UploadedFile::fake()->image('ancienne.jpg')->store('users/photos', 'public');
        $user = User::factory()->create(['photo' => $oldPath]);
        Sanctum::actingAs($user);

        $response = $this->patchJson('/api/v1/auth/profile', [
            'photo' => UploadedFile::fake()->image('nouvelle.jpg'),
        ]);

        $response->assertOk();
        Storage::disk('public')->assertMissing($oldPath);
        Storage::disk('public')->assertExists($user->fresh()->photo);
    }

    public function test_ne_supprime_pas_une_url_externe_lors_du_remplacement(): void
    {
        Storage::fake('public');
        $user = User::factory()->create(['photo' => 'https://i.pravatar.cc/200?u=abc']);
        Sanctum::actingAs($user);

        $response = $this->patchJson('/api/v1/auth/profile', [
            'photo' => UploadedFile::fake()->image('nouvelle.jpg'),
        ]);

        $response->assertOk();
        Storage::disk('public')->assertExists($user->fresh()->photo);
    }

    public function test_change_le_mot_de_passe_avec_lancien_mot_de_passe_correct(): void
    {
        $user = User::factory()->create(['password' => Hash::make('ancien-mdp-123')]);
        Sanctum::actingAs($user);

        $response = $this->patchJson('/api/v1/auth/password', [
            'current_password' => 'ancien-mdp-123',
            'password' => 'nouveau-mdp-456',
            'password_confirmation' => 'nouveau-mdp-456',
        ]);

        $response->assertOk();
        $this->assertTrue(Hash::check('nouveau-mdp-456', $user->fresh()->password));
    }

    public function test_refuse_le_changement_si_lancien_mot_de_passe_est_faux(): void
    {
        $user = User::factory()->create(['password' => Hash::make('ancien-mdp-123')]);
        Sanctum::actingAs($user);

        $response = $this->patchJson('/api/v1/auth/password', [
            'current_password' => 'mauvais-mdp',
            'password' => 'nouveau-mdp-456',
            'password_confirmation' => 'nouveau-mdp-456',
        ]);

        $response->assertStatus(422);
        $this->assertTrue(Hash::check('ancien-mdp-123', $user->fresh()->password));
    }

    public function test_refuse_si_la_confirmation_ne_correspond_pas(): void
    {
        $user = User::factory()->create(['password' => Hash::make('ancien-mdp-123')]);
        Sanctum::actingAs($user);

        $response = $this->patchJson('/api/v1/auth/password', [
            'current_password' => 'ancien-mdp-123',
            'password' => 'nouveau-mdp-456',
            'password_confirmation' => 'autre-chose',
        ]);

        $response->assertStatus(422);
    }
}

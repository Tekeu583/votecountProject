<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Régression : getAvatarUrlAttribute() préfixait toujours `photo` par
 * asset('storage/...'), en supposant un chemin relatif de stockage local.
 * UserFactory (donc la plupart des comptes de démo/seed) stocke en réalité
 * une URL externe complète (pravatar.cc) — produisant une URL cassée du
 * type "http://.../storage/https://i.pravatar.cc/...". Le frontend
 * (Navbar/Sidebar/ProfileSidebarCard) affiche cette URL telle quelle, donc
 * le bug était directement visible pour la quasi-totalité des comptes.
 */
class UserAvatarUrlTest extends TestCase
{
    use RefreshDatabase;

    public function test_conserve_une_url_externe_telle_quelle(): void
    {
        $user = User::factory()->create(['photo' => 'https://i.pravatar.cc/200?u=abc']);

        $this->assertEquals('https://i.pravatar.cc/200?u=abc', $user->avatar_url);
    }

    public function test_prefixe_un_chemin_de_stockage_relatif(): void
    {
        $user = User::factory()->create(['photo' => 'avatars/photo.jpg']);

        $this->assertStringContainsString('/storage/avatars/photo.jpg', $user->avatar_url);
        $this->assertStringStartsNotWith('http://localhost/storage/https', $user->avatar_url);
    }

    public function test_genere_un_avatar_par_defaut_si_aucune_photo(): void
    {
        $user = User::factory()->create(['photo' => null, 'first_name' => 'Jean', 'last_name' => 'Dupont']);

        $this->assertStringContainsString('ui-avatars.com', $user->avatar_url);
        $this->assertStringContainsString('Jean', $user->avatar_url);
    }
}

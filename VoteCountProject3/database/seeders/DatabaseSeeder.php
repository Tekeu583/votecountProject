<?php

namespace Database\Seeders;

use App\Models\User;
use App\Services\RoleService;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            RolesAndPermissionsSeeder::class,
            SubscriptionPlansSeeder::class,
            SystemSettingsSeeder::class,
        ]);

        // Créer un utilisateur admin par défaut pour les tests
        if (! User::where('email', 'superadmin@example.com')->exists()) {
            $admin = User::create([
                'uuid' => Str::uuid()->toString(),
                'first_name' => 'Super Admin',
                'last_name' => 'System',
                'email' => 'superadmin@example.com',
                'password' => bcrypt('password'),
                'status' => 'active',
                'email_verified_at' => now(),
            ]);
            RoleService::assignRoleToUser($admin, 'super_admin');
        }
    }
}

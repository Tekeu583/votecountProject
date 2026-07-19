<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class RolesAndPermissionsSeeder extends Seeder
{
    public function run(): void
    {
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        // Permissions par module
        $permissions = [
            // Users
            'view users',
            'create users',
            'edit users',
            'delete users',
            'manage users',

            // Organizations
            'view organizations',
            'create organizations',
            'edit organizations',
            'delete organizations',
            'manage organizations',

            // Elections
            'view elections',
            'create elections',
            'edit elections',
            'delete elections',
            'manage elections',
            'publish elections',
            'end elections',
            'archive elections',

            // Candidates
            'view candidates',
            'create candidates',
            'edit candidates',
            'delete candidates',
            'approve candidates',

            // Electors
            'manage electors',
            'view electors',
            'import electors',
            'edit electors',
            'delete electors',
            'block electors',

            // Votes
            'view votes',
            'audit votes',
            'verify votes',
            'invalid votes',

            // Results
            'view results',
            'export results',
            'publish results',

            // Payments
            'view payments',
            'process payments',
            'refund payments',
            'configure payments',

            // Withdrawals & KYC organisation
            'submit organization kyc',
            'review organization kyc',
            'request withdrawals',
            'view withdrawals',
            'approve withdrawals',

            // Analytics
            'view analytics',
            'export analytics',

            // Settings
            'view settings',
            'edit settings',
            'manage system',

            // Audit
            'view audit logs',
            'delete audit logs',

            // Security
            'view security alerts',
            'manage security alerts',

            // Categories
            'manage categories',
            'view categories',

            // Roles
            'view roles',
            'create roles',
            'edit roles',
            'delete roles',
            'manage roles',

            // Permissions
            'view permissions',
            'create permissions',
            'edit permissions',
            'delete permissions',
            'manage permissions',

            //plan d'abonnement
            'manage subscription plans',
            'view subscription plans',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission, 'guard_name' => 'web']);
        }

        // Super Admin role
        $superAdmin = Role::firstOrCreate(['name' => 'super_admin', 'guard_name' => 'web']);
        $superAdmin->givePermissionTo(Permission::all());

        // Admin role
        $admin = Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);
        $admin->givePermissionTo([
            'view users',
            'create users',
            'edit users',
            'view organizations',
            'create organizations',
            'edit organizations',
            'view elections',
            'create elections',
            'edit elections',
            'manage elections',
            'publish elections',
            'view candidates',
            'create candidates',
            'edit candidates',
            'delete candidates',
            'approve candidates',
            'view electors',
            'import electors',
            'edit electors',
            'delete electors',
            'view votes',
            'audit votes',
            'view results',
            'export results',
            'publish results',
            'view payments',
            'view analytics',
            'view settings',
            'view security alerts',
            'manage categories',
            'view categories',
            'manage subscription plans',
            'view subscription plans',
            'manage electors'
        ]);

        // Organization Owner role
        $orgOwner = Role::firstOrCreate(['name' => 'organization_owner', 'guard_name' => 'web']);
        $orgOwner->givePermissionTo([
            'view users',
            'create users',
            'edit users',
            'manage electors',
            'delete users',
            'view organizations',
            'create organizations',
            'edit organizations',
            'view elections',
            'create elections',
            'edit elections',
            'delete elections',
            'manage elections',
            'publish elections',
            'view candidates',
            'create candidates',
            'edit candidates',
            'delete candidates',
            'approve candidates',
            'view electors',
            'import electors',
            'edit electors',
            'delete electors',
            'view votes',
            'view results',
            'export results',
            'view payments',
            'process payments',
            'submit organization kyc',
            'request withdrawals',
            'view withdrawals',
            'view analytics',
            'view settings',
            'view security alerts',
            'manage categories',
            'view categories',
            'view subscription plans',
            'view audit logs',
        ]);

        // Election Manager role
        $electionManager = Role::firstOrCreate(['name' => 'election_manager', 'guard_name' => 'web']);
        $electionManager->givePermissionTo([
            'view elections',
            'edit elections',
            'manage elections',
            'view candidates',
            'create candidates',
            'edit candidates',
            'delete candidates',
            'approve candidates',
            'view electors',
            'import electors',
            'edit electors',
            'view votes',
            'view results',
            'view categories',
            'manage electors',
        ]);

        // Jury role
        $jury = Role::firstOrCreate(['name' => 'jury', 'guard_name' => 'web']);
        $jury->givePermissionTo([
            'view elections',
            'view candidates',
            'view votes',
        ]);

        // Observer role
        $observer = Role::firstOrCreate(['name' => 'observer', 'guard_name' => 'web']);
        $observer->givePermissionTo([
            'view elections',
            'view results',
        ]);

        // Candidat role — assigné automatiquement (CandidateAccountLinkService)
        // dès qu'un candidat créé/approuvé correspond par email à un compte
        // existant, ou rétroactivement à l'inscription si le compte est créé après.
        $candidat = Role::firstOrCreate(['name' => 'candidat', 'guard_name' => 'web']);
        $candidat->givePermissionTo([
            'view elections',
            'view candidates',
            'view results',
        ]);

        $votant = Role::firstOrCreate(['name' => 'voter', 'guard_name' => 'web']);
        $votant->givePermissionTo([
            'view elections',
            'view results',
        ]);

        // User role — utilisateur standard nouvellement inscrit
        // Peut créer sa propre organisation (devient ensuite organization_owner)
        $user = Role::firstOrCreate(['name' => 'user', 'guard_name' => 'web']);
        $user->givePermissionTo([
            'view elections',
            'view organizations',
            'view results',
            'create organizations',
            'view subscription plans'
        ]);
    }
}

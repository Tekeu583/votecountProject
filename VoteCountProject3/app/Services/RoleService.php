<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Log;
use Spatie\Permission\Models\Role;

/**
 * Service centralisé pour la gestion des rôles
 * Garantit que les rôles existent avant assignation
 */
class RoleService
{
    /**
     * Assigne un rôle à un utilisateur de manière sécurisée
     * Crée le rôle s'il n'existe pas
     *
     * @param User $user L'utilisateur
     * @param string|array $roles Le(s) rôle(s) à assigner
     * @param bool $sync Si true, utilise syncRoles (remplace); si false, utilise assignRole (ajoute)
     * @return bool Succès de l'opération
     */
    public static function assignRoleToUser(User $user, $roles, bool $sync = false): bool
    {
        try {
            $rolesToAssign = is_array($roles) ? $roles : [$roles];
            $guardName = 'web';

            // Vérifier et créer les rôles s'il faut
            foreach ($rolesToAssign as $roleName) {
                if (empty($roleName)) {
                    continue;
                }

                $role = Role::where('name', $roleName)
                    ->where('guard_name', $guardName)
                    ->first();

                if (!$role) {
                    $role = Role::create([
                        'name' => $roleName,
                        'guard_name' => $guardName,
                    ]);

                    Log::info("Created role: {$roleName} for guard: {$guardName}");
                }
            }

            // Assigner les rôles
            if ($sync) {
                $user->syncRoles($rolesToAssign);
            } else {
                $user->assignRole($rolesToAssign);
            }

            return true;
        } catch (\Exception $e) {
            Log::error(
                "Failed to assign roles to user {$user->id}: {$e->getMessage()}",
                ['roles' => $roles, 'exception' => $e]
            );

            return false;
        }
    }

    /**
     * Assigne un rôle par défaut à un utilisateur
     *
     * @param User $user L'utilisateur
     * @param string $defaultRole Rôle par défaut (par défaut: 'user')
     * @return bool Succès de l'opération
     */
    public static function assignDefaultRole(User $user, string $defaultRole = 'user'): bool
    {
        return self::assignRoleToUser($user, $defaultRole, sync: false);
    }

    /**
     * Remplace les rôles d'un utilisateur
     *
     * @param User $user L'utilisateur
     * @param string|array $roles Le(s) nouveau(x) rôle(s)
     * @return bool Succès de l'opération
     */
    public static function syncUserRoles(User $user, $roles): bool
    {
        return self::assignRoleToUser($user, $roles, sync: true);
    }
}

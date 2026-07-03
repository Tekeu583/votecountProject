// src/hooks/usePermission.js
//
// Hook de vérification de permissions.
// Source de vérité : user.permissions (tableau de strings) issu de la réponse Laravel.
// Ex: user.permissions = ["view users", "create users", "manage elections", ...]
//
// USAGE dans un composant :
//
//   const { can, canAny, canAll } = usePermission();
//
//   // Afficher un bouton conditionnellement
//   {can('create users') && <button>Créer un utilisateur</button>}
//
//   // Afficher une section si au moins une permission présente
//   {canAny(['view elections', 'manage elections']) && <ElectionsMenu />}

import { useCallback } from 'react';
import { useAuth } from '@hooks/useAuth';

// Liste complète des permissions déclarées côté Laravel (Spatie).
// Centralisée ici pour éviter les fautes de frappe dans les composants.
export const PERMISSIONS = {
    // Users
    VIEW_USERS:    'view users',
    CREATE_USERS:  'create users',
    EDIT_USERS:    'edit users',
    DELETE_USERS:  'delete users',
    MANAGE_USERS:  'manage users',

    // Organizations
    VIEW_ORGS:    'view organizations',
    CREATE_ORGS:  'create organizations',
    EDIT_ORGS:    'edit organizations',
    DELETE_ORGS:  'delete organizations',
    MANAGE_ORGS:  'manage organizations',

    // Elections
    VIEW_ELECTIONS:    'view elections',
    CREATE_ELECTIONS:  'create elections',
    EDIT_ELECTIONS:    'edit elections',
    DELETE_ELECTIONS:  'delete elections',
    MANAGE_ELECTIONS:  'manage elections',
    PUBLISH_ELECTIONS: 'publish elections',
    END_ELECTIONS:     'end elections',
    ARCHIVE_ELECTIONS: 'archive elections',

    // Candidates
    VIEW_CANDIDATES:    'view candidates',
    CREATE_CANDIDATES:  'create candidates',
    EDIT_CANDIDATES:    'edit candidates',
    DELETE_CANDIDATES:  'delete candidates',
    APPROVE_CANDIDATES: 'approve candidates',

    // Electors
    VIEW_ELECTORS:   'view electors',
    IMPORT_ELECTORS: 'import electors',
    EDIT_ELECTORS:   'edit electors',
    DELETE_ELECTORS: 'delete electors',
    BLOCK_ELECTORS:  'block electors',

    // Votes
    VIEW_VOTES:  'view votes',
    AUDIT_VOTES: 'audit votes',
    VERIFY_VOTES: 'verify votes',
    INVALID_VOTES: 'invalid votes',

    // Results
    VIEW_RESULTS:    'view results',
    EXPORT_RESULTS:  'export results',
    PUBLISH_RESULTS: 'publish results',

    // Payments
    VIEW_PAYMENTS:      'view payments',
    PROCESS_PAYMENTS:   'process payments',
    REFUND_PAYMENTS:    'refund payments',
    CONFIGURE_PAYMENTS: 'configure payments',

    // Analytics
    VIEW_ANALYTICS:   'view analytics',
    EXPORT_ANALYTICS: 'export analytics',

    // Settings
    VIEW_SETTINGS:   'view settings',
    EDIT_SETTINGS:   'edit settings',
    MANAGE_SYSTEM:   'manage system',

    // Audit / Security
    VIEW_AUDIT_LOGS:         'view audit logs',
    DELETE_AUDIT_LOGS:       'delete audit logs',
    VIEW_SECURITY_ALERTS:    'view security alerts',
    MANAGE_SECURITY_ALERTS:  'manage security alerts',
};

export function usePermission() {
    const { user, authenticated } = useAuth();

    // Permissions de l'utilisateur courant (tableau plat de strings)
    const userPermissions = Array.isArray(user?.permissions) ? user.permissions : [];

    /**
     * Vérifie si l'utilisateur possède une permission spécifique.
     *
     * @param {string} permission - Identifiant exact de la permission Laravel
     * @returns {boolean}
     *
     * @example
     * can('view users')
     * can(PERMISSIONS.VIEW_USERS)
     */
    const can = useCallback((permission) => {
        if (!authenticated || !user) return false;
        return userPermissions.includes(permission);
    }, [user, authenticated, userPermissions]);

    /**
     * Vérifie si l'utilisateur possède AU MOINS UNE des permissions fournies.
     *
     * @param {string[]} permissions
     * @returns {boolean}
     *
     * @example
     * canAny(['view elections', 'manage elections'])
     */
    const canAny = useCallback((permissions) => {
        if (!authenticated || !user) return false;
        return permissions.some((p) => userPermissions.includes(p));
    }, [user, authenticated, userPermissions]);

    /**
     * Vérifie si l'utilisateur possède TOUTES les permissions fournies.
     *
     * @param {string[]} permissions
     * @returns {boolean}
     */
    const canAll = useCallback((permissions) => {
        if (!authenticated || !user) return false;
        return permissions.every((p) => userPermissions.includes(p));
    }, [user, authenticated, userPermissions]);

    /**
     * Composant utilitaire inline pour le rendu conditionnel.
     * Évite les ternaires verbeux dans le JSX.
     *
     * @example
     * <Can permission="create users">
     *   <button>Créer</button>
     * </Can>
     */
    const Can = useCallback(({ permission, permissions, any = false, children, fallback = null }) => {
        let allowed = false;

        if (permission) {
            allowed = can(permission);
        } else if (permissions) {
            allowed = any ? canAny(permissions) : canAll(permissions);
        }

        return allowed ? children : fallback;
    }, [can, canAny, canAll]);

    return {
        can,
        canAny,
        canAll,
        Can,
        permissions: userPermissions,
        PERMISSIONS,
    };
}

export default usePermission;
// src/hooks/useRole.js
//
// Hook de vérification de rôles.
// Source de vérité : user.roles (tableau) issu de la réponse Laravel.
// Ex: user.roles = ["super_admin"]

import { useCallback } from 'react';
import { useAuth } from '@hooks/useAuth';
import { getPrimaryRole } from '@utils/roleRoutes';

export function useRole() {
    const { user, authenticated } = useAuth();

    /**
     * Retourne le rôle primaire de l'utilisateur.
     * Ex: "super_admin"
     */
    const primaryRole = getPrimaryRole(user);

    /**
     * Vérifie si l'utilisateur possède AU MOINS UN des rôles fournis.
     *
     * @param {string | string[]} roles - Un rôle ou un tableau de rôles
     * @returns {boolean}
     *
     * @example
     * hasRole('super_admin')              // true si super_admin
     * hasRole(['super_admin', 'admin_org']) // true si l'un ou l'autre
     */
    const hasRole = useCallback((roles) => {
        if (!authenticated || !user) return false;

        const userRoles = Array.isArray(user.roles) ? user.roles : [];
        const required = Array.isArray(roles) ? roles : [roles];

        return required.some((role) => userRoles.includes(role));
    }, [user, authenticated]);

    /**
     * Vérifie si l'utilisateur possède TOUS les rôles fournis.
     *
     * @param {string[]} roles
     * @returns {boolean}
     */
    const hasAllRoles = useCallback((roles) => {
        if (!authenticated || !user) return false;

        const userRoles = Array.isArray(user.roles) ? user.roles : [];
        const required = Array.isArray(roles) ? roles : [roles];

        return required.every((role) => userRoles.includes(role));
    }, [user, authenticated]);

    /**
     * Vérifie si le rôle primaire correspond exactement au rôle fourni.
     * Utile pour des conditions strictes (ex: afficher un menu uniquement pour super_admin).
     *
     * @param {string} role
     * @returns {boolean}
     */
    const isRole = useCallback((role) => primaryRole === role, [primaryRole]);

    return {
        primaryRole,
        hasRole,
        hasAllRoles,
        isRole,
        // Raccourcis courants — évite d'importer les constantes partout
        isSuperAdmin: isRole('super_admin'),
        isAdminOrg: isRole('organization_owner'),
        isJury: isRole('jury'),
        isCandidat: isRole('candidat'),
        isUser: isRole('user'),
    };
}

export default useRole;
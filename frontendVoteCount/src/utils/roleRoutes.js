// utils/roleRoutes.js
import { menuByRole } from '@components/layouts/config/menuByRole';
import { ROLES, ROLE_PRIORITY } from '@utils/roles';
export const getRoleBaseRoute = (role) => {
    return menuByRole[role]?.base || '/';
};

const normalizeRole = (r) => {
    if (!r) return null;
    if (typeof r === 'string') return r;
    // r peut être un objet { id, name, ... } (Spatie)
    return r.name || r.id || null;
};

/**
 * getAvailableRoles
 *
 * Liste COMPLÈTE des dashboards accessibles par l'utilisateur — pas
 * seulement son rôle "primaire". Un utilisateur peut cumuler plusieurs
 * rôles (ex: organization_owner ET jury sur une élection d'une autre org).
 *
 * super_admin/candidat restent basés uniquement sur les rôles globaux
 * Spatie (user.roles) — candidat n'est jamais assigné contextuellement
 * aujourd'hui côté backend.
 *
 * organization_owner/jury sont aussi détectés via les données contextuelles
 * déjà présentes dans la réponse /me (user.organizations, user.elections),
 * car ces rôles ne sont pas fiablement synchronisés dans user.roles — un
 * juré assigné via ElectionService::addManager() n'obtient PAS le rôle
 * Spatie "jury" (assignation contextuelle uniquement, election_user.role_slug).
 *
 * Retourne les rôles triés selon ROLE_PRIORITY.
 */
export const getAvailableRoles = (user) => {
    if (!user) return [];

    const found = new Set();

    if (Array.isArray(user.roles)) {
        user.roles.map(normalizeRole).filter(Boolean).forEach((r) => found.add(r));
    }

    if (Array.isArray(user.organizations) && user.organizations.length > 0) {
        found.add(ROLES.ADMIN_ORG);
    }

    if (Array.isArray(user.elections) && user.elections.some((e) => e.role === ROLES.JURY)) {
        found.add(ROLES.JURY);
    }

    if (Array.isArray(user.elections) && user.elections.some((e) => e.role === ROLES.MANAGER)) {
        found.add(ROLES.MANAGER);
    }

    // Fallbacks scalaires historiques (payloads hors /me éventuels)
    if (found.size === 0) {
        if (user.role) found.add(normalizeRole(user.role));
        if (user.current_organization_role) found.add(normalizeRole(user.current_organization_role));
        if (user.current_election_role) found.add(normalizeRole(user.current_election_role));
    }

    if (found.size === 0) return [ROLES.USER];

    const ordered = ROLE_PRIORITY.filter((r) => found.has(r));
    // Rôle(s) présent(s) mais inconnu(s) de ROLE_PRIORITY → ajoutés à la fin
    const unknown = [...found].filter((r) => !ROLE_PRIORITY.includes(r));

    return [...ordered, ...unknown];
};

/**
 * getPrimaryRole
 *
 * Rôle le plus prioritaire parmi les dashboards accessibles — utilisé pour
 * la redirection par défaut après connexion.
 */
export const getPrimaryRole = (user) => {
    if (!user) return null;
    return getAvailableRoles(user)[0] ?? ROLES.USER;
};

/**
 * getRoleFromPath
 *
 * Déduit le rôle/dashboard courant depuis le préfixe d'URL — source de
 * vérité pour la Sidebar (indépendante du rôle "primaire" de l'utilisateur,
 * qui peut naviguer sur un dashboard différent après un switch).
 */
export const getRoleFromPath = (pathname) => {
    if (pathname.startsWith('/super-admin')) return ROLES.SUPER_ADMIN;
    if (pathname.startsWith('/org')) return ROLES.ADMIN_ORG;
    if (pathname.startsWith('/jury')) return ROLES.JURY;
    if (pathname.startsWith('/manager')) return ROLES.MANAGER;
    if (pathname.startsWith('/candidat')) return ROLES.CANDIDAT;
    return null;
};
export const getRoleDefaultRoute = (role) => {
    // ROLES.USER ("Votant") n'a pas de dashboard dédié — aucune route /voter
    // n'existe dans App.jsx (menuByRole['user'].base='/voter' est un reliquat
    // non implémenté). Sans ce cas particulier, un votant fraîchement vérifié
    // était envoyé vers une route inexistante, rattrapée par le fallback "*"
    // de App.jsx qui le renvoyait à l'accueil après un aller-retour parasite.
    if (role === ROLES.USER) return '/';

    const roleConfig = menuByRole[role];

    if (!roleConfig) return '/';

    const base = roleConfig.base;
    const first = roleConfig.menu[0];

    if (!first?.path) {
        return base;
    }

    return `${base}/${first.path}`;
};


export const getDashboardRoute = (role) => {
    switch (role) {
        case ROLES.SUPER_ADMIN:
            return '/super-admin';
        case ROLES.ADMIN_ORG:
            return '/org';
        case ROLES.JURY:
            return '/jury';
        case ROLES.MANAGER:
            return '/manager';
        case ROLES.CANDIDAT:
            return '/candidat';
        case ROLES.USER:
            return '/vote';
        default:
            return '/';
    }
};
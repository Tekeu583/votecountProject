// utils/roleRoutes.js
import { menuByRole } from '@components/layouts/config/menuByRole';
import { ROLES, ROLE_PRIORITY } from '@utils/roles';
export const getRoleBaseRoute = (role) => {
    return menuByRole[role]?.base || '/';
};

export const getPrimaryRole = (user) => {
    if (!user) return null;

    const normalize = (r) => {
        if (!r) return null;
        if (typeof r === 'string') return r;
        // r peut être un objet { id, name, ... } (Spatie)
        return r.name || r.id || null;
    };

    // Cas 1 : tableau `roles` — source de vérité principale
    // On cherche le rôle le plus prioritaire selon ROLE_PRIORITY
    if (Array.isArray(user.roles) && user.roles.length > 0) {
        const normalized = user.roles.map(normalize).filter(Boolean);
        const found = ROLE_PRIORITY.find((r) => normalized.includes(r));
        if (found) return found;
        // Rôle présent mais inconnu dans ROLE_PRIORITY → on le retourne tel quel
        return normalized[0];
    }

    // Cas 2 : champ `role` scalaire (string ou objet) — fallback
    if (user.role) return normalize(user.role);

    // Cas 3 : rôle contextuel (organisation ou élection)
    if (user.current_organization_role) return normalize(user.current_organization_role);
    if (user.current_election_role) return normalize(user.current_election_role);

    return ROLES.USER;
};
export const getRoleDefaultRoute = (role) => {
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
        case ROLES.CANDIDAT:
            return '/candidat';
        case ROLES.USER:
            return '/vote';
        default:
            return '/';
    }
};
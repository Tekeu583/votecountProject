/**
 * utils/roles.js
 *
 * Source de vérité unique pour les constantes de rôles.
 * Importer ROLES ici dans tout fichier qui référence un rôle métier.
 * Ne jamais écrire les strings en dur ailleurs.
 *
 * Correspondance avec Laravel Spatie :
 *   ROLES.SUPER_ADMIN  → 'super_admin'
 *   ROLES.ADMIN_ORG    → 'organization_owner'
 *   ROLES.JURY         → 'jury'
 *   ROLES.CANDIDAT     → 'candidat'
 *   ROLES.USER         → 'user'
 */

export const ROLES = {
    SUPER_ADMIN: 'super_admin',
    ADMIN_ORG:   'organization_owner',
    JURY:        'jury',
    CANDIDAT:    'candidat',
    USER:        'user',
};

/**
 * Ordre de priorité des rôles (du plus élevé au plus bas).
 * Utilisé par getPrimaryRole pour résoudre les conflits multi-rôles.
 * Ex: backend envoie ['user', 'organization_owner'] → retourne 'organization_owner'
 */
export const ROLE_PRIORITY = [
    ROLES.SUPER_ADMIN,
    ROLES.ADMIN_ORG,
    ROLES.JURY,
    ROLES.CANDIDAT,
    ROLES.USER,
];
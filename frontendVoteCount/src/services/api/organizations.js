// src/services/api/organizations.js
import api, { V1 } from './api';

export const organizationsApi = {

    /**
     * GET /api/v1/organizations/mine
     * Retourne uniquement les organisations de l'utilisateur connecté.
     * Utilisé par OrgProvider — ne JAMAIS utiliser getAll() pour ça,
     * getAll() est une liste admin globale (permission 'view organizations').
     */
    getMine: () =>
        api.get(`${V1}/organizations/mine`),

    /**
 * GET /api/v1/organizations
 * @param {Object} params - { page, limit, search, country }
 */
    getAll: (params = {}) =>
        api.get(`${V1}/organizations`, { params }),

    // recuperer les organisations de l'utilisateur connecté my/organizations
    getMyOrganizations: () =>
        api.get(`${V1}/organizations/my-organizations`),
    /**
     * GET /api/v1/organizations/{organization}
     */
    get: (orgUuid) =>
        api.get(`${V1}/organizations/${orgUuid}`),
    /**
     * GET /api/v1/organizations/stats
     * Statistiques globales des organisations.
     */
    getStats: () =>
        api.get(`${V1}/organizations/stats`),
    /**
     * POST /api/v1/organizations
     * Permission requise : 'create organizations'
     *
     * Payload :
     * {
     *   name (required, unique),
     *   description, email, phone, website,
     *   country, city, address
     * }
     */
    create: (data) =>
        api.post(`${V1}/organizations`, data),

    /**
     * PUT /api/v1/organizations/{organization}
     * Permission requise : 'edit organizations'
     * FormData (upload de logo/banner) doit passer par POST + _method=PUT —
     * PHP ne parse pas les bodies multipart sur les requêtes PUT.
     */
    update: (orgUuid, data) => {
        if (data instanceof FormData) {
            data.append('_method', 'PUT');
            return api.post(`${V1}/organizations/${orgUuid}`, data);
        }
        return api.put(`${V1}/organizations/${orgUuid}`, data);
    },

    /**
     * DELETE /api/v1/organizations/{organization}
     * Permission requise : 'delete organizations'
     */
    delete: (orgUuid) =>
        api.delete(`${V1}/organizations/${orgUuid}`),

    /**
     * GET /api/v1/organizations/{organization}/users
     * Liste les membres de l'organisation (uuid, full_name, email, avatar,
     * role_slug, status, joined_at).
     */
    listUsers: (orgUuid) =>
        api.get(`${V1}/organizations/${orgUuid}/users`),

    /**
     * POST /api/v1/organizations/{organization}/users
     * Ajoute un utilisateur à l'organisation — recherché par email, doit
     * déjà posséder un compte VoteCount.
     * @param {string} orgUuid
     * @param {string} email
     * @param {string} role - 'admin' | 'member' | 'viewer'
     */
    addUser: (orgUuid, email, role) =>
        api.post(`${V1}/organizations/${orgUuid}/users`, {
            email,
            role,
        }),

    /**
     * PATCH /api/v1/organizations/{organization}/users/{user}
     * Change le rôle d'un membre déjà présent (le owner ne peut pas être modifié).
     */
    updateUserRole: (orgUuid, userUuid, role) =>
        api.patch(`${V1}/organizations/${orgUuid}/users/${userUuid}`, { role }),

    /**
     * DELETE /api/v1/organizations/{organization}/users/{user}
     * Retire un utilisateur de l'organisation.
     */
    removeUser: (orgUuid, userId) =>
        api.delete(`${V1}/organizations/${orgUuid}/users/${userId}`),

    /**
        * GET /api/v1/organizations/{organization}/candidates
        *
        * [AJOUT] — Endpoint consolidé : tous les candidats d'une organisation
        * en une seule requête paginée côté serveur.
        *
        * @param {string} orgUuid
        * @param {Object} params - { page, per_page, search, status, election_uuid }
        */
    getCandidates: (orgUuid, params = {}) =>
        api.get(`${V1}/organizations/${orgUuid}/candidates`, { params }),

    /**
     * GET /api/v1/organizations/{organization}/candidate-applications
     *
     * Candidatures publiques reçues (à approuver/rejeter), toutes élections de
     * l'organisation confondues. Distinct de getCandidates (candidats en lice).
     *
     * @param {string} orgUuid
     * @param {Object} params - { page, per_page, search, status, election_uuid }
     */
    getApplications: (orgUuid, params = {}) =>
        api.get(`${V1}/organizations/${orgUuid}/candidate-applications`, { params }),

    /**
     * GET /api/v1/organizations/{organization}/electors
     *
     * Endpoint consolidé : tous les électeurs d'une organisation en une
     * seule requête paginée côté serveur (même pattern que getCandidates).
     *
     * @param {string} orgUuid
     * @param {Object} params - { page, per_page, search, election_uuid, has_voted, verification_status }
     */
    getElectors: (orgUuid, params = {}) =>
        api.get(`${V1}/organizations/${orgUuid}/electors`, { params }),
};

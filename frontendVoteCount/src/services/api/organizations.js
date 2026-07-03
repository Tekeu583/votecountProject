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
     */
    update: (orgUuid, data) =>
        api.put(`${V1}/organizations/${orgUuid}`, data),

    /**
     * DELETE /api/v1/organizations/{organization}
     * Permission requise : 'delete organizations'
     */
    delete: (orgUuid) =>
        api.delete(`${V1}/organizations/${orgUuid}`),

    /**
     * POST /api/v1/organizations/{organization}/users
     * Ajoute un utilisateur à l'organisation.
     * @param {string} orgUuid
     * @param {string} userId
     * @param {string} role - Rôle de l'utilisateur dans l'organisation
     */
    addUser: (orgUuid, userId, role) =>
        api.post(`${V1}/organizations/${orgUuid}/users`, {
            user_id: userId,
            role,
        }),

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
};

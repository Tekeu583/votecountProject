// src/services/api/users.js
import api, { V1 } from './api';

// Style unifié avec tous les autres services (objet au lieu de fonctions nommées).
// Axios gère nativement les `params` — pas besoin de URLSearchParams.

export const usersApi = {
    /**
 * GET /api/v1/users
 * Liste les utilisateurs avec pagination et filtres.
 *
 * @param {number} page
 * @param {number} limit - Max 100
 * @param {Object} filters - { search, role, status }
 */
    getAll: (page = 1, limit = 15, filters = {}) =>
        api.get(`${V1}/users`, {
            params: {
                page,
                limit,
                ...(filters.search && { search: filters.search }),
                ...(filters.role && { role: filters.role }),
                ...(filters.status && { status: filters.status }),
            },
        }),

    /**
     * GET /api/v1/users/stats
     * Statistiques globales des utilisateurs.
     */
    getStats: () =>
        api.get(`${V1}/users/stats`),

    /**
     * GET /api/v1/users/{user}
     * @param {string|number} userId
     */
    get: (userId) =>
        api.get(`${V1}/users/${userId}`),

    /**
     * POST /api/v1/users
     * Crée un utilisateur (admin).
     */
    create: (data) =>
        api.post(`${V1}/users`, data),

    /**
     * PUT /api/v1/users/{user}
     */
    update: (userId, data) =>
        api.put(`${V1}/users/${userId}`, data),

    /**
     * DELETE /api/v1/users/{user}
     */
    delete: (userId) =>
        api.delete(`${V1}/users/${userId}`),

    /**
     * GET /api/v1/users/export
     * Exporte les utilisateurs (Blob).
     * @param {Object} filters - { search, role, status }
     */
    export: (filters = {}) =>
        api.get(`${V1}/users/export`, {
            params: filters,
            responseType: 'blob',
        }),
};
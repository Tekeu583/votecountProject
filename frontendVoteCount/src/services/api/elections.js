// src/services/api/elections.js
import api, { V1 } from './api';

export const electionsApi = {
    // Liste des élections privees(protégée - nécessite authentification)
    getAll: (params = {}) => api.get(`${V1}/elections`, { params }),

    // Liste des élections publiques (sans authentification)
    getPublic: (params = {}) => api.get(`${V1}/elections/public`, { params }),

    //listes des elections attendant des candidatures
    openForCandidacy: (params = {}) =>
        api.get(`${V1}/elections/open-for-candidacy`, { params }),

    //detais d'election public (show)
    getPublicShow: (uuid) => api.get(`${V1}/elections/${uuid}/public-show`),
    // Détails d'une élection
    get: (uuid) => api.get(`${V1}/elections/${uuid}`),

    // Créer une élection
    create: (data) => api.post(`${V1}/elections`, data),

    // Mettre à jour
    update: (uuid, data) => {
        if (data instanceof FormData) {
            data.append('_method', 'PUT');
            return api.post(`${V1}/elections/${uuid}`, data);
        }
        return api.put(`${V1}/elections/${uuid}`, data);
    },

    // Draft wizard
    // Créer un brouillon
    storeDraft: (data) => api.post(`${V1}/elections/draft`, data),
    // updateDraft: (uuid, data) => api.patch(`${V1}/elections/${uuid}/draft`, data),
    updateDraft: (uuid, data) => {
        if (data instanceof FormData) {
            data.append('_method', 'PATCH');
            return api.post(`${V1}/elections/${uuid}/draft`, data);
        }
        return api.patch(`${V1}/elections/${uuid}/draft`, data);
    },

    // Catégories d'une élection
    // Retourne les catégories de cette élection
    getCategories: (uuid) => api.get(`${V1}/elections/${uuid}/categories`),
    // Créer une catégorie
    createCategory: (uuid, data) => api.post(`${V1}/elections/${uuid}/create-categories`, data),
    // Modifier une catégorie (nom, description, couleur...)
    updateCategory: (uuid, catUuid, data) => api.put(`${V1}/elections/${uuid}/categories/${catUuid}`, data),
    // Supprimer une catégorie
    deleteCategory: (uuid, catUuid) => api.delete(`${V1}/elections/${uuid}/categories/${catUuid}`),

    // Élection + ses catégories (chacune avec son banner et ses candidats approuvés) - public
    getElectionWithCategories: (uuid) => api.get(`${V1}/elections/${uuid}/with-categories`),
    // Détails d'une catégorie (banner + candidats approuvés) - public
    getCategoryDetails: (electionUuid, categoryUuid) =>
        api.get(`${V1}/elections/${electionUuid}/categories/${categoryUuid}`),

    // Supprimer
    delete: (uuid) => api.delete(`${V1}/elections/${uuid}`),

    // Publier
    publish: (uuid) => api.post(`${V1}/elections/${uuid}/publish`),

    // Démarrer
    start: (uuid) => api.post(`${V1}/elections/${uuid}/start`),

    // Terminer
    end: (uuid) => api.post(`${V1}/elections/${uuid}/end`),

    // Statistiques
    statistics: (uuid) => api.get(`${V1}/elections/${uuid}/statistics`),
    /**
     * GET /api/v1/elections/stats
     * Statistiques globales des élections (super_admin).
     */
    getStats: () =>
        api.get(`${V1}/elections/stats`),

    // Ajouter manager
    addManager: (uuid, userId, role) => api.post(`${V1}/elections/${uuid}/managers`, { user_id: userId, role }),

    // Retirer manager
    removeManager: (uuid, userId) => api.delete(`${V1}/elections/${uuid}/managers/${userId}`),

    // Vérifier accès (voter_code pour élection privée)
    verifyAccess: (uuid, voterCode) => api.post(`${V1}/elections/${uuid}/verify-access`, { voter_code: voterCode }),
};
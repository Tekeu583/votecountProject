// src/services/api/categories.js
//
// Une catégorie appartient toujours à une élection précise. La création/
// modification/suppression se fait via electionsApi (elections.js) —
// createCategory/updateCategory/deleteCategory — pas ici.
import api, { V1 } from './api';

export const categoriesApi = {
    // Public
    getActive: () => api.get(`${V1}/categories/active`),
    getCandidates: (uuid) => api.get(`${V1}/categories/${uuid}/candidates`),
    // Récupérer les catégories d'une élection avec leurs candidats
    getcategorieElection: (electionUuid, data) => api.get(`${V1}/elections/${electionUuid}/categories`, data),

    /**
     * GET /api/v1/categories
     * Vue d'ensemble des catégories d'une organisation (toutes élections
     * confondues). @param {Object} params - { organization_uuid, page, per_page, search, status }
     */
    getAll: (params = {}) => api.get(`${V1}/categories`, { params }),
};

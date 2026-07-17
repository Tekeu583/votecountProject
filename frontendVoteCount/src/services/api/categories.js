// src/services/api/categories.js
import api, { V1 } from './api';

export const categoriesApi = {
    // Public
    getActive: () => api.get(`${V1}/categories/active`),
    getCandidates: (uuid) => api.get(`${V1}/categories/${uuid}/candidates`),
    // Récupérer les catégories d'une élection avec leurs candidats
    getcategorieElection: (electionUuid,data) => api.get(`${V1}/elections/${electionUuid}/categories`,data),
    // Admin
    getAll: (params = {}) => api.get(`${V1}/categories`, { params }),
    get: (uuid) => api.get(`${V1}/categories/${uuid}`),
    create: (data) => api.post(`${V1}/categories`, data),
    // FormData (upload de banner) doit passer par POST + _method=PUT — PHP
    // ne parse pas les bodies multipart sur les requêtes PUT.
    update: (uuid, data) => {
        if (data instanceof FormData) {
            data.append('_method', 'PUT');
            return api.post(`${V1}/categories/${uuid}`, data);
        }
        return api.put(`${V1}/categories/${uuid}`, data);
    },
    delete: (uuid) => api.delete(`${V1}/categories/${uuid}`),

};
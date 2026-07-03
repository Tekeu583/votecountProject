// src/services/api/plans.js
import api, { V1 } from './api';

export const plansApi = {
    // Liste des plans Public
    getActivePlans: () => api.get(`${V1}/subscription-plans/active`),

    // Admin
    // Liste des plans d'abonnement (admin)
    getAll: (params = {}) => api.get(`${V1}/subscription-plans`, { params }),

    // Détails d'un plan
    get: (uuid) => api.get(`${V1}/subscription-plans/${uuid}`),

    // Créer un plan
    create: (data) => api.post(`${V1}/subscription-plans`, data),

    // Mettre à jour un plan
    update: (uuid, data) => api.put(`${V1}/subscription-plans/${uuid}`, data),

    // Supprimer un plan
    delete: (uuid) => api.delete(`${V1}/subscription-plans/${uuid}`),

    // Activer/désactiver un plan
    toggleStatus: (uuid) => api.post(`${V1}/subscription-plans/${uuid}/toggle-status`),
};
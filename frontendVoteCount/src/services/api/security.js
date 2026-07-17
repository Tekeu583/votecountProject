// src/services/api/security.js
import api, { V1 } from './api';

export const securityApi = {
    /**
     * GET /api/v1/security/alerts
     * Liste des alertes de fraude au vote (SecurityAlert).
     * @param {Object} params - { page, per_page, severity, resolved, election_uuid, search }
     */
    getAlerts: (params = {}) => api.get(`${V1}/security/alerts`, { params }),

    /**
     * GET /api/v1/security/alerts/stats
     */
    getStats: () => api.get(`${V1}/security/alerts/stats`),

    /**
     * POST /api/v1/security/alerts/{uuid}/resolve
     */
    resolveAlert: (uuid) => api.post(`${V1}/security/alerts/${uuid}/resolve`),
};

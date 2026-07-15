//src/services/api/analytics.js
import api, { V1 } from './api';

export const analyticsApi = {
    /**
   * GET /api/v1/analytics/dashboard
   * Tableau de bord analytique global.
   * Permission requise : 'view analytics'
   *
   * @param {Object} params - { organization_uuid? }
   */
    dashboard: (params = {}) =>
        api.get(`${V1}/analytics/dashboard`, { params }),

    /**
     * GET /api/v1/analytics/elections/{election}
     * Statistiques analytiques d'une élection spécifique.
     * Permission requise : viewResults sur l'élection (Policy)
     */
    electionStats: (electionUuid) =>
        api.get(`${V1}/analytics/elections/${electionUuid}`),
};
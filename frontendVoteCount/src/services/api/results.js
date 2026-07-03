// src/services/api/results.js
import api, { V1 } from './api';

export const resultsApi = {
    // Résultats live (public)
    /**
 * GET /api/v1/elections/{election}/results/live
 * Résultats en temps réel (public si public_results=true).
 */
    live: (electionUuid) =>
        api.get(`${V1}/elections/${electionUuid}/results/live`),

    /**
     * GET /api/v1/elections/{election}/results/final
     * Résultats finaux (public si public_results=true).
     */
    final: (electionUuid) =>
        api.get(`${V1}/elections/${electionUuid}/results/final`),

    /**
     * POST /api/v1/elections/{election}/results/calculate
     * Déclenche le calcul des résultats (admin).
     * Permission : 'manage elections'
     */
    calculate: (electionUuid) =>
        api.post(`${V1}/elections/${electionUuid}/results/calculate`),

    /**
     * GET /api/v1/elections/{election}/results/export
     * Exporte les résultats (Blob).
     * @param {string} electionUuid
     * @param {string} format - 'excel' | 'pdf' (selon backend)
     */
    export: (electionUuid, format = 'excel') =>
        api.get(`${V1}/elections/${electionUuid}/results/export`, {
            params: { format },
            responseType: 'blob',
        }),
};
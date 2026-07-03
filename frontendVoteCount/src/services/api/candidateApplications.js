import api , { V1 } from './api';

export const candidateApplicationsApi = {
    // ── PUBLIQUES ──────────────────────────────────────────────────

    /**
     * POST /api/v1/elections/{election}/candidate-applications
     * Soumet une candidature (public, sans auth).
     *
     * Payload multipart/FormData obligatoire (photo + identity_document sont des fichiers).
     *
     * Champs :
     * {
     *   first_name (required), last_name (required),
     *   email (required),
     *   phone, gender (male|female|other),
     *   photo (File image max 5MB: jpeg,png,jpg),
     *   manifesto (max 5000 chars),
     *   slogan (max 200 chars),
     *   bio (max 500 chars),
     *   identity_document (File max 5MB: jpeg,png,jpg,pdf)
     * }
     *
     * @param {string} electionUuid
     * @param {FormData} formData
     */
    submit: (electionUuid, formData) =>
        api.post(
            `${V1}/elections/${electionUuid}/candidate-applications`,
            formData
        ),

    /**
     * GET /api/v1/elections/{election}/candidate-applications/status
     * Vérifie le statut d'une candidature par email (public).
     *
     * @param {string} electionUuid
     * @param {string} email
     */
    checkStatus: (electionUuid, email) =>
        api.get(`${V1}/elections/${electionUuid}/candidate-applications/status`, {
            params: { email },
        }),

    // ── PROTÉGÉES (admin) ──────────────────────────────────────────

    /**
     * GET /api/v1/elections/{election}/candidate-applications
     * Liste les candidatures d'une élection (admin).
     * @param {string} electionUuid
     * @param {Object} params - { page, limit, status }
     */
    getAll: (electionUuid, params = {}) =>
        api.get(`${V1}/elections/${electionUuid}/candidate-applications`, { params }),

    /**
     * GET /api/v1/elections/{election}/candidate-applications/{candidateApplication}
     * Détail d'une candidature.
     */
    get: (electionUuid, applicationUuid) =>
        api.get(`${V1}/elections/${electionUuid}/candidate-applications/${applicationUuid}`),

    /**
     * POST /api/v1/elections/{election}/candidate-applications/{candidateApplication}/approve
     * Approuve une candidature.
     * @param {string} electionUuid
     * @param {string} applicationUuid
     * @param {Object} data - { notes?: string }
     */
    approve: (electionUuid, applicationUuid, data = {}) =>
        api.post(
            `${V1}/elections/${electionUuid}/candidate-applications/${applicationUuid}/approve`,
            data
        ),

    /**
     * POST /api/v1/elections/{election}/candidate-applications/{candidateApplication}/reject
     * Rejette une candidature.
     * @param {string} electionUuid
     * @param {string} applicationUuid
     * @param {string} reason - Raison du rejet
     */
    reject: (electionUuid, applicationUuid, reason) =>
        api.post(
            `${V1}/elections/${electionUuid}/candidate-applications/${applicationUuid}/reject`,
            { reason }
        ),
};

// src/services/api/withdrawals.js
import api, { V1 } from './api';

export const withdrawalsApi = {
    /**
     * GET /api/v1/withdrawals/balance
     * Solde disponible au retrait d'une organisation (revenus complétés
     * moins les demandes déjà réservées — pending/approved/paid).
     * @param {string} organizationUuid
     */
    getBalance: (organizationUuid) =>
        api.get(`${V1}/withdrawals/balance`, { params: { organization_uuid: organizationUuid } }),

    /**
     * GET /api/v1/withdrawals
     * @param {Object} params - { organization_uuid, page, per_page, status }
     */
    getAll: (params = {}) => api.get(`${V1}/withdrawals`, { params }),

    /**
     * GET /api/v1/withdrawals/{uuid}
     */
    get: (uuid) => api.get(`${V1}/withdrawals/${uuid}`),

    /**
     * POST /api/v1/withdrawals
     * @param {Object} data - { organization_uuid, amount, phone_number, payout_provider }
     */
    create: (data) => api.post(`${V1}/withdrawals`, data),

    /**
     * POST /api/v1/withdrawals/{uuid}/cancel
     */
    cancel: (uuid) => api.post(`${V1}/withdrawals/${uuid}/cancel`),

    /**
     * POST /api/v1/withdrawals/{uuid}/approve — réservé au super_admin.
     */
    approve: (uuid) => api.post(`${V1}/withdrawals/${uuid}/approve`),

    /**
     * POST /api/v1/withdrawals/{uuid}/reject — réservé au super_admin.
     */
    reject: (uuid, rejectionReason) =>
        api.post(`${V1}/withdrawals/${uuid}/reject`, { rejection_reason: rejectionReason }),

    /**
     * POST /api/v1/withdrawals/{uuid}/mark-paid — réservé au super_admin,
     * après dépôt manuel effectué sur le numéro fourni.
     */
    markPaid: (uuid, data) => api.post(`${V1}/withdrawals/${uuid}/mark-paid`, data),
};

export const kycApi = {
    /**
     * GET /api/v1/organizations/{organization}/kyc
     */
    get: (orgUuid) => api.get(`${V1}/organizations/${orgUuid}/kyc`),

    /**
     * POST /api/v1/organizations/{organization}/kyc
     * FormData : identity_document_type, identity_document (fichier),
     * business_document (fichier), legal_representative_name.
     */
    submit: (orgUuid, formData) => api.post(`${V1}/organizations/${orgUuid}/kyc`, formData),

    /**
     * GET /api/v1/organizations/kyc/pending — réservé au super_admin.
     */
    getPending: (params = {}) => api.get(`${V1}/organizations/kyc/pending`, { params }),

    /**
     * POST /api/v1/organizations/{organization}/kyc/review — réservé au super_admin.
     * @param {Object} data - { decision: 'verified'|'rejected', rejection_reason? }
     */
    review: (orgUuid, data) => api.post(`${V1}/organizations/${orgUuid}/kyc/review`, data),
};

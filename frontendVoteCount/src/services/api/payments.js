// src/services/api/payments.js
import api, { V1 } from './api';

export const paymentsApi = {
    // Paiement pour vote (public)
    /**
     * POST /api/v1/elections/{election}/vote/payment/initiate
     * Initie un paiement pour voter (élection payante).
     *
     * Payload :
     * {
     *   vote_uuid: "uuid",
     *   provider: "orange_money" | "mtn_money" | "stripe",
     *   phone_number: "string"  // requis si orange_money ou mtn_money
     * }
     *
     *  Méthode non encore implémentée dans PaymentController backend.
     */
    initiateVotePayment: (electionUuid, data) => api.post(`${V1}/elections/${electionUuid}/vote/payment/initiate`, data),
    initiateForVote: (electionUuid, data) =>
        api.post(`${V1}/elections/${electionUuid}/vote/payment/initiate`, data),

    // Vérifier paiement vote
    verifyVotePayment: (electionUuid, data) => api.post(`${V1}/elections/${electionUuid}/vote/payment/verify`, data),

    // Statut paiement vote
    getVotePaymentStatus: (electionUuid, transactionUuid) => api.get(`${V1}/elections/${electionUuid}/vote/payment/status/${transactionUuid}`),

    // Paiement subscription (auth required)
    initiateSubscription: (data) => api.post(`${V1}/subscriptions/initiate`, data),

    // Vérifier subscription
    verifySubscription: (data) => api.post(`${V1}/subscriptions/verify`, data),

    // Statut subscription
    getSubscriptionStatus: () => api.get(`${V1}/subscriptions/status`),

    /**
     * GET /api/v1/subscriptions
     * Liste de tous les abonnements (toutes organisations). Réservé au super admin.
     * @param {Object} params - { page, per_page, status, search }
     */
    getAllSubscriptions: (params = {}) => api.get(`${V1}/subscriptions`, { params }),

    /**
     * GET /api/v1/subscriptions/stats
     * Réservé au super admin.
     */
    getSubscriptionsStats: () => api.get(`${V1}/subscriptions/stats`),

    // Activer/désactiver le renouvellement automatique
    toggleAutoRenew: (subscriptionUuid, autoRenew) =>
        api.patch(`${V1}/subscriptions/${subscriptionUuid}/auto-renew`, { auto_renew: autoRenew }),

    // Annuler un abonnement
    cancelSubscription: (subscriptionUuid) =>
        api.delete(`${V1}/subscriptions/${subscriptionUuid}/cancel`),

    /**
     * GET /api/v1/payments/transactions
     * Historique des transactions d'une organisation (Revenus).
     * @param {Object} params - { organization_uuid, page, per_page, status, type, date_from, date_to }
     */
    getTransactions: (params = {}) => api.get(`${V1}/payments/transactions`, { params }),

    /**
     * GET /api/v1/payments/transactions/stats
     * @param {Object} params - { organization_uuid, date_from, date_to }
     */
    getTransactionStats: (params = {}) => api.get(`${V1}/payments/transactions/stats`, { params }),
};
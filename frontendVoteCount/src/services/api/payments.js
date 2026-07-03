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
};
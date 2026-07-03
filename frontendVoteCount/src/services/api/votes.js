// src/services/api/votes.js
import api, { V1 } from './api';

export const votesApi = {

    /**
   * POST /api/v1/votes/public/{election}
   * Vote public — payload : { items: [{candidate_id: uuid}], idempotency_key }
   */

    // Vote public (sans authentification)
    //POST /api/v1/elections/{election}/vote/public
    submitPublic: (electionUuid, data) => api.post(`${V1}/elections/${electionUuid}/vote/public`, data),

    /**
    * POST /api/v1/elections/{election}/vote/access/verify
    * Étape 1 du vote privé : voter_code (de l'élection) + email (de l'électeur).
    * Réponse toujours identique (anti-énumération) : { access_token, expires_in }.
    */
    verifyAccess: ({ voter_code, email }) =>
        api.post(`${V1}/elections/vote/access/verify`, {
            voter_code: voter_code,
            email,
        }),

    /**
    * POST /api/v1/elections/{election}/vote/access/verify-otp
    * Étape 2 du vote privé : vérifie le code reçu par email.
    * Si valide : { access_granted, session_token, elector_name, election_title, candidates }
    */
    verifyAccessOtp: (electionUuid, { access_token, otp }) =>
        api.post(`${V1}/elections/${electionUuid}/vote/access/verify-otp`, {
            access_token,
            otp,
        }),
    /**
     * POST /api/v1/elections/{election}/vote/otp/request
     * Étape 3 du vote privé : demande le code de confirmation finale,
     * une fois le candidat choisi.
     *
     * Payload : { session_token, candidate_uuid }
     */
    requestOtp: (electionUuid, data) =>
        api.post(`${V1}/elections/${electionUuid}/vote/otp/request`, data),

    /**
     * POST /api/v1/elections/{election}/vote/private
     * Étape 4 du vote privé : soumet le vote avec le code de confirmation.
     *
     * Payload : { session_token, otp_code, idempotency_key }
     */
    submitPrivate: (electionUuid, data) =>
        api.post(`${V1}/elections/${electionUuid}/vote/private`, data),

    /**
    * POST /api/v1/elections/{election}/vote/verify
    * Vérifie un reçu de vote (preuve de participation).
    */
    verifyReceipt: (electionUuid, receiptCode) =>
        api.post(`${V1}/elections/${electionUuid}/vote/verify`, {
            receipt_code: receiptCode,
        }),

    // Admin: liste des votes
    getAll: (electionUuid, params = {}) => api.get(`${V1}/elections/${electionUuid}/votes`, { params }),

    // Admin: détail
    get: (electionUuid, voteUuid) => api.get(`${V1}/elections/${electionUuid}/votes/${voteUuid}`),
};
// src/services/api/electors.js
import api, { V1 } from './api';

export const electorsApi = {
    // Liste des électeurs
    getAll: (electionUuid, params = {}) => api.get(`${V1}/elections/${electionUuid}/electors`, { params }),

    // Détails
    get: (electionUuid, electorUuid) => api.get(`${V1}/elections/${electionUuid}/electors/${electorUuid}`),

    // Créer
    create: (electionUuid, data) => api.post(`${V1}/elections/${electionUuid}/electors`, data),

    // Mettre à jour
    update: (electionUuid, electorUuid, data) => api.put(`${V1}/elections/${electionUuid}/electors/${electorUuid}`, data),

    // Supprimer
    delete: (electionUuid, electorUuid) => api.delete(`${V1}/elections/${electionUuid}/electors/${electorUuid}`),

    //Import Excel — FormData : Content-Type géré automatiquement par l'intercepteur
    import: (electionUuid, file, hasHeader = true, onProgress) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('has_header', hasHeader ? '1' : '0');
        return api.post(
            `${V1}/elections/${electionUuid}/electors/import`,
            formData,
            {
                onUploadProgress: (e) => {
                    if (onProgress && e.total) {
                        onProgress(Math.round((e.loaded * 100) / e.total));
                    }
                },
            }
        );
    },

    // Statut import
    importStatus: (electionUuid, importJobId) => api.get(`${V1}/elections/${electionUuid}/electors/import/${importJobId}/status`),

    // Envoyer les codes
    sendVoterCodes: (electionUuid, electorUuids = null) =>
        api.post(`${V1}/elections/${electionUuid}/electors/send-codes`,
            electorUuids ? { elector_uuids: electorUuids } : {}
        ),

    // Bloquer
    block: (electorUuid) => api.post(`${V1}/electors/${electorUuid}/block`),

    // Vérifier
    verify: (electorUuid) => api.post(`${V1}/electors/${electorUuid}/verify`),
    // Vérifier en masse
    verifyBulk: (electionUuid, electorUuids) =>
        api.post(`${V1}/elections/${electionUuid}/electors/verify-bulk`, {
            elector_uuids: electorUuids,
        }),

};
//src/services/api/candidates.js
import api, { V1 } from './api';

export const candidatesApi = {
    // Mes candidatures (utilisateur connecté, toutes élections)
    getMine: () => api.get(`${V1}/candidates/mine`),

    // Liste des candidats
    getAll: (electionUuid, params = {}) => api.get(`${V1}/elections/${electionUuid}/candidates`, { params }),

    // Détails d'un candidat
    get: (electionUuid, candidateUuid) => api.get(`${V1}/elections/${electionUuid}/candidates/${candidateUuid}`),

    // Créer un candidat
    create: (electionUuid, data) => api.post(`${V1}/elections/${electionUuid}/candidates`, data),

    // Mettre à jour
    update: (electionUuid, candidateUuid, data) => api.put(`${V1}/elections/${electionUuid}/candidates/${candidateUuid}`, data),

    // Supprimer
    delete: (electionUuid, candidateUuid) => api.delete(`${V1}/elections/${electionUuid}/candidates/${candidateUuid}`),

    // Approuver
    approve: (candidateUuid) => api.post(`${V1}/candidates/${candidateUuid}/approve`),

    // Rejeter
    reject: (candidateUuid, reason) => api.post(`${V1}/candidates/${candidateUuid}/reject`, { reason }),

    /**
     * POST /api/v1/elections/{election}/candidates/import
     * Import Excel/CSV de candidats.
     * @param {string} electionUuid
     * @param {File} file - Fichier Excel/CSV
     * @param {Function} onProgress - Callback progression (0-100)
     */
    import: (electionUuid, file, onProgress) => {
        const formData = new FormData();
        formData.append('file', file);
        return api.post(
            `${V1}/elections/${electionUuid}/candidates/import`,
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

    /**
     * GET /api/v1/elections/{election}/candidates/import/{importJobId}/status
     * Statut d'un job d'import en cours.
     */
    importStatus: (electionUuid, importJobId) =>
        api.get(`${V1}/elections/${electionUuid}/candidates/import/${importJobId}/status`),

    /**
     * GET /api/v1/candidates/import-template
     * Télécharge le template Excel d'import.
     * Retourne un Blob.
     */
    downloadImportTemplate: () =>
        api.get(`${V1}/candidates/import-template`, { responseType: 'blob' }),



};
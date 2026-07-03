// src/services/api/candidateDocuments.js
//
// Toutes protégées (auth:sanctum) :
// GET    /api/v1/candidates/{candidate}/documents
// POST   /api/v1/candidates/{candidate}/documents/upload
// GET    /api/v1/candidates/{candidate}/documents/{document}
// DELETE /api/v1/candidates/{candidate}/documents/{document}
// GET    /api/v1/candidates/{candidate}/documents/{document}/download
// GET    /api/v1/document-types

import api, { V1 } from './api';

// Types de documents acceptés (enum côté Laravel)
export const DOCUMENT_TYPES = {
    IDENTITY_CARD: 'identity_card',
    PASSPORT: 'passport',
    DIPLOMA: 'diploma',
    RESUME: 'resume',
    COVER_LETTER: 'cover_letter',
    CERTIFICATE: 'certificate',
    PHOTO: 'photo',
    OTHER: 'other',
};

export const candidateDocumentsApi = {

    /**
     * GET /api/v1/candidates/{candidate}/documents
     * Liste les documents d'un candidat.
     */
    getAll: (candidateUuid) =>
        api.get(`${V1}/candidates/${candidateUuid}/documents`),

    /**
     * POST /api/v1/candidates/{candidate}/documents/upload
     * Upload un document.
     *
     * FormData obligatoire.
     *
     * Champs :
     * {
     *   file (required, max 10MB),
     *   type (required): identity_card|passport|diploma|resume|cover_letter|certificate|photo|other
     *   description (optional, max 500 chars)
     * }
     *
     * @param {string} candidateUuid
     * @param {File} file
     * @param {string} type - Valeur de DOCUMENT_TYPES
     * @param {string} description
     * @param {Function} onProgress - Callback progression (0-100)
     */
    upload: (candidateUuid, file, type, description = '', onProgress) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', type);
        if (description) formData.append('description', description);

        return api.post(
            `${V1}/candidates/${candidateUuid}/documents/upload`,
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
     * GET /api/v1/candidates/{candidate}/documents/{document}
     * Détail d'un document.
     */
    get: (candidateUuid, documentUuid) =>
        api.get(`${V1}/candidates/${candidateUuid}/documents/${documentUuid}`),

    /**
     * DELETE /api/v1/candidates/{candidate}/documents/{document}
     * Supprime un document.
     */
    delete: (candidateUuid, documentUuid) =>
        api.delete(`${V1}/candidates/${candidateUuid}/documents/${documentUuid}`),

    /**
     * GET /api/v1/candidates/{candidate}/documents/{document}/download
     * Télécharge un document (Blob).
     */
    download: (candidateUuid, documentUuid) =>
        api.get(
            `${V1}/candidates/${candidateUuid}/documents/${documentUuid}/download`,
            { responseType: 'blob' }
        ),

    /**
     * GET /api/v1/document-types
     * Liste les types de documents disponibles.
     */
    getTypes: () =>
        api.get(`${V1}/document-types`),
};
// src/services/api/trash.js
import api, { V1 } from './api';

export const trashApi = {
    /**
     * GET /api/v1/trash
     * @param {Object} params - { organization_uuid, search, page, per_page }
     */
    getAll: (params = {}) => api.get(`${V1}/trash`, { params }),

    /**
     * POST /api/v1/trash/{trashRecord}/restore
     */
    restore: (uuid) => api.post(`${V1}/trash/${uuid}/restore`),

    /**
     * DELETE /api/v1/trash/{trashRecord}
     * Suppression définitive — irréversible.
     */
    forceDelete: (uuid) => api.delete(`${V1}/trash/${uuid}`),
};

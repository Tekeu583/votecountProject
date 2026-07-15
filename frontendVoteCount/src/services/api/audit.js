// src/services/api/audit.js
//
// Route::get('audit-logs')
// Route::get('audit-logs/{auditLog}')

import api, { V1 } from './api';

export const auditApi = {

    /**
     * GET /api/v1/audit-logs
     * Liste les logs d'audit.
     * Permission requise : 'view audit logs'
     *
     * @param {Object} params - { organization_uuid, page, per_page, user_id, action, entity_type, date_from, date_to, search }
     */
    getAll: (params = {}) =>
        api.get(`${V1}/audit-logs`, { params }),

    /**
     * GET /api/v1/audit-logs/{auditLog}
     * Détail d'un log d'audit.
     * Permission requise : 'view audit logs'
     */
    get: (auditLogId) =>
        api.get(`${V1}/audit-logs/${auditLogId}`),
};
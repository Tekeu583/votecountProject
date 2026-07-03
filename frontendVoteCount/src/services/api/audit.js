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
     * @param {Object} params - { page, limit, user_id, action, model_type, date_from, date_to }
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
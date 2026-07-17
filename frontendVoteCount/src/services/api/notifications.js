// src/services/api/notifications.js
import api, { V1 } from './api';

export const notificationsApi = {
    /**
     * GET /api/v1/notifications
     * @param {Object} params - { page, per_page, user_uuid, type, unread_only, search }
     */
    getAll: (params = {}) => api.get(`${V1}/notifications`, { params }),

    /**
     * POST /api/v1/notifications
     * Envoie une notification in-app à un utilisateur. Réservé au super admin.
     * @param {{ user_uuid: string, title: string, message: string }} data
     */
    create: (data) => api.post(`${V1}/notifications`, data),

    markAsRead: (uuid) => api.post(`${V1}/notifications/${uuid}/mark-as-read`),
    delete: (uuid) => api.delete(`${V1}/notifications/${uuid}`),
};
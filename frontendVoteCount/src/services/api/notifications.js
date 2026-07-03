// src/services/api/notifications.js
import api, { V1 } from './api';

export const notificationsApi = {
    getAll: (params = {}) => api.get(`${V1}/notifications`, { params }),
    markAsRead: (id) => api.post(`${V1}/notifications/${id}/mark-as-read`),
    delete: (id) => api.delete(`${V1}/notifications/${id}`),
};
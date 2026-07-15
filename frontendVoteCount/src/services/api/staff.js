// src/services/api/staff.js
import api, { V1 } from './api';

export const staffApi = {
    // Élections où l'utilisateur connecté est gestionnaire (manager)
    getMyElections: () => api.get(`${V1}/manager/elections`),

    // Gestionnaires (manager) et observateurs (observer) d'une élection.
    // @param {string} role - 'manager' | 'observer' | undefined (les deux)
    getAll: (electionUuid, role) =>
        api.get(`${V1}/elections/${electionUuid}/staff`, { params: role ? { role } : {} }),

    // data: { email, role }
    create: (electionUuid, data) =>
        api.post(`${V1}/elections/${electionUuid}/staff`, data),

    delete: (electionUuid, userUuid) =>
        api.delete(`${V1}/elections/${electionUuid}/staff/${userUuid}`),
};

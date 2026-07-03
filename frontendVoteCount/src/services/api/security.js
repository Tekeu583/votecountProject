// src/services/api/security.js
import api, { V1 } from './api';

export const securityApi = {

    blockIp: (ip) => api.post(`${V1}/security/block-ip`, { ip }),

    // débloquer une adresse IP
    unblockIp: (ip) => api.post(`${V1}/security/unblock-ip`, { ip }),

    // obtenir la liste des adresses IP bloquées
    getBlockedIps: () => api.get(`${V1}/security/blocked-ips`),

    // obtenir les incidents de sécurité récents
    getSecurityIncidents: (params = {}) => api.get(`${V1}/security/incidents`, { params }),

    // obtenir les détails d'un incident de sécurité
    getIncidentDetails: (incidentId) => api.get(`${V1}/security/incidents/${incidentId}`),

    // appliquer une action défensive à un incident
    applyDefensiveAction: (incidentId, action) => api.post(`${V1}/security/incidents/${incidentId}/defensive-action`, { action }),

    // obtenir la liste des actionsodefensive
    getDefensiveActions: () => api.get(`${V1}/security/defensive-actions`),
};
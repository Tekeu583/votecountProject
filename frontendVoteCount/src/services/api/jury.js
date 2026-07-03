// src/services/api/jury.js
import api, { V1 } from './api';

export const juryApi = {
    // Liste des jurys d'une élection
    getAll: (electionUuid) => api.get(`${V1}/elections/${electionUuid}/jury`),

    // Détails d'un jury
    get: (electionUuid, juryUuid) => api.get(`${V1}/elections/${electionUuid}/jury/${juryUuid}`),

    // Créer un jury
    create: (electionUuid, data) => api.post(`${V1}/elections/${electionUuid}/jury`, data),

    // Mettre à jour un jury
    update: (electionUuid, juryUuid, data) => api.put(`${V1}/elections/${electionUuid}/jury/${juryUuid}`, data),

    // Supprimer un jury
    delete: (electionUuid, juryUuid) => api.delete(`${V1}/elections/${electionUuid}/jury/${juryUuid}`),
    //evaluer un candidat
    evaluate: (electionUuid, juryUuid, data) => api.post(`${V1}/elections/${electionUuid}/jury/${juryUuid}/evaluate`, data),

    //obtenir les évaluations d'un candidat par le jury
    getEvaluations: (electionUuid, juryUuid, candidatId) => api.get(`${V1}/elections/${electionUuid}/jury/${juryUuid}/evaluations/${candidatId}`),

    //obtenir les candidats évalués par le jury
    getEvaluatedCandidates: (electionUuid, juryUuid) => api.get(`${V1}/elections/${electionUuid}/jury/${juryUuid}/evaluated-candidates`),

};
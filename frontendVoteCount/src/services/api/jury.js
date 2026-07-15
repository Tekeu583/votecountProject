// src/services/api/jury.js
import api, { V1 } from './api';

export const juryApi = {
    // Élections où l'utilisateur connecté est juré
    getMyElections: () => api.get(`${V1}/jury/elections`),

    // Membres du jury d'une élection
    getAll: (electionUuid) => api.get(`${V1}/elections/${electionUuid}/jury`),
    create: (electionUuid, data) => api.post(`${V1}/elections/${electionUuid}/jury`, data),
    delete: (electionUuid, userUuid) => api.delete(`${V1}/elections/${electionUuid}/jury/${userUuid}`),

    // Critères de notation d'une élection
    getCriteria: (electionUuid) => api.get(`${V1}/elections/${electionUuid}/jury-criteria`),
    createCriteria: (electionUuid, data) => api.post(`${V1}/elections/${electionUuid}/jury-criteria`, data),
    updateCriteria: (electionUuid, criteriaUuid, data) => api.put(`${V1}/elections/${electionUuid}/jury-criteria/${criteriaUuid}`, data),
    deleteCriteria: (electionUuid, criteriaUuid) => api.delete(`${V1}/elections/${electionUuid}/jury-criteria/${criteriaUuid}`),

    // Candidats à noter + statut de notation du juré connecté
    getCandidates: (electionUuid) => api.get(`${V1}/elections/${electionUuid}/jury/candidates`),

    // Notes déjà soumises par le juré connecté pour un candidat (pré-remplissage)
    getCandidateScores: (electionUuid, candidateUuid) => api.get(`${V1}/elections/${electionUuid}/jury/candidates/${candidateUuid}/scores`),

    // Soumettre/mettre à jour les notes d'un candidat : { candidate_id, scores: [{criteria_id, score}], comment }
    submitScore: (electionUuid, data) => api.post(`${V1}/elections/${electionUuid}/jury/scores`, data),
};

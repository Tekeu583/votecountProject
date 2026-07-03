// src/services/api/settings.js
//
// Route::get('settings')
// Route::put('settings')

import api, { V1 } from './api';

export const settingsApi = {

    /**
     * GET /api/v1/settings
     * Récupère les paramètres de l'application.
     * Permission requise : 'view settings'
     *
     * @param {Object} params - { group?: string } pour filtrer par groupe
     */
    getAll: (params = {}) =>
        api.get(`${V1}/settings`, { params }),

    /**
     * PUT /api/v1/settings
     * Met à jour les paramètres.
     * Permission requise : 'edit settings'
     *
     * @param {Object} data - Objet clé/valeur des paramètres à mettre à jour
     * Ex: { 'app.name': 'VoteCount', 'mail.from': 'no-reply@...' }
     */
    update: (data) =>
        api.put(`${V1}/settings`, data),
};
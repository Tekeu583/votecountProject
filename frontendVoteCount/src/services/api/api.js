/**
 * services/api.js
 *
 * Couche de communication HTTP avec Laravel Sanctum (Session + Cookies).
 *
 * ARCHITECTURE DE SÉCURITÉ :
 * ─────────────────────────────────────────────────────────────────
 * Ce fichier ne gère JAMAIS de tokens en mémoire, localStorage,
 * ou sessionStorage. Toute l'authentification repose sur deux cookies
 * gérés exclusivement par le navigateur :
 *
 *  1. laravel_session (HttpOnly, Secure, SameSite=Lax)
 *     → Identifie la session côté serveur.
 *     → INACCESSIBLE depuis JavaScript (protection XSS).
 *     → Envoyé automatiquement par le navigateur à chaque requête.
 *
 *  2. XSRF-TOKEN (non HttpOnly — Laravel l'expose intentionnellement)
 *     → Axios le lit et l'injecte dans le header X-XSRF-TOKEN.
 *     → Protège contre les attaques CSRF.
 *     → Un attaquant cross-origin ne peut pas lire ce cookie (SameSite).
 *
 * COMMENT SANCTUM AUTHENTIFIE L'UTILISATEUR :
 * ─────────────────────────────────────────────────────────────────
 * 1. Le frontend appelle /sanctum/csrf-cookie → Laravel pose XSRF-TOKEN.
 * 2. Le frontend soumet login avec X-XSRF-TOKEN dans les headers.
 * 3. Laravel valide le CSRF, authentifie, crée la session.
 * 4. Le navigateur stocke laravel_session (HttpOnly).
 * 5. Chaque requête suivante envoie automatiquement laravel_session.
 * 6. Le middleware auth:sanctum lit la session et identifie l'utilisateur.
 */

import axios from "axios";

// ─────────────────────────────────────────────────────────────────
// CONFIGURATION DE BASE
// ─────────────────────────────────────────────────────────────────

const BASE_URL = import.meta.env.VITE_BACKEND_URL ?? "http://localhost:8000";
export const V1 = "/api/v1";

const api = axios.create({
    baseURL: BASE_URL,

    // CRITIQUE : envoie les cookies (session + CSRF) dans toutes les requêtes.
    withCredentials: true,

    // Axios lit automatiquement le cookie XSRF-TOKEN et l'injecte dans
    // le header X-XSRF-TOKEN. Laravel vérifie ce header côté serveur.
    withXSRFToken: true,

    headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        // Indique à Laravel que la requête vient d'une SPA (pas d'un navigateur
        // classique). Évite les redirections 302 → retourne du JSON 401/419.
        "X-Requested-With": "XMLHttpRequest",
    },

    // Timeout raisonnable. Au-delà, l'intercepteur traite l'erreur réseau.
    timeout: 120000,
});

// ─────────────────────────────────────────────────────────────────
// INTERCEPTEUR DE REQUÊTE
// ─────────────────────────────────────────────────────────────────

api.interceptors.request.use(
    (config) => {

        // FormData : laisser le navigateur gérer Content-Type (boundary multipart)
        if (config.data instanceof FormData) {
            delete config.headers["Content-Type"];
            config.timeout = 300000; // 5 minutes
        }
        // Point d'extension : logging, ajout de headers dynamiques, etc.
        // Ne jamais injecter de token ici — Axios gère XSRF automatiquement.
        if (import.meta.env.DEV) {
            console.debug(`[API] ${config.method?.toUpperCase()} ${config.url}`);
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// ─────────────────────────────────────────────────────────────────
// INTERCEPTEUR DE RÉPONSE
// ─────────────────────────────────────────────────────────────────

api.interceptors.response.use(
    // Succès (2xx) : passe la réponse sans modification.
    (response) => response,

    (error) => {
        const status = error.response?.status;

        switch (status) {
            case 401:
                // Session expirée ou utilisateur non authentifié.
                // On émet un événement custom — AuthProvider l'écoute pour
                // mettre à jour le state sans créer de couplage circulaire.
                window.dispatchEvent(new CustomEvent("auth:unauthenticated"));
                break;

            case 403:
                // Authentifié mais non autorisé. Ne pas déconnecter.
                window.dispatchEvent(
                    new CustomEvent("auth:forbidden", {
                        detail: { url: error.config?.url },
                    })
                );
                break;

            case 419:
                // CSRF token expiré ou manquant (erreur Sanctum spécifique).
                // Il faut récupérer un nouveau cookie CSRF et retry.
                window.dispatchEvent(new CustomEvent("auth:csrf-expired"));
                break;

            case 422:
                // Erreurs de validation Laravel — traité par l'appelant,
                // pas ici. On laisse l'erreur se propager.
                break;

            case 0:
            case undefined:
                // Erreur réseau (timeout, CORS, serveur inaccessible).
                if (import.meta.env.DEV) {
                    console.error("[API] Erreur réseau :", error.message);
                }
                break;

            default:
                if (import.meta.env.DEV) {
                    console.error(`[API] Erreur HTTP ${status} :`, error.response?.data);
                }
        }

        return Promise.reject(error);
    }
);

// ─────────────────────────────────────────────────────────────────
// FONCTIONS D'AUTHENTIFICATION
// ─────────────────────────────────────────────────────────────────

/**
 * Récupère le cookie CSRF depuis Laravel.
 *
 * DOIT être appelé avant toute mutation (login, register, logout).
 * Laravel pose le cookie XSRF-TOKEN ; Axios l'injecte ensuite
 * automatiquement dans le header X-XSRF-TOKEN des requêtes suivantes.
 *
 * Note : /sanctum/csrf-cookie n'a pas de préfixe /api car c'est
 * une route web, pas API.
 */
export const getCsrfCookie = () => api.get("/sanctum/csrf-cookie");

/**
 * Authentifie l'utilisateur via session Sanctum.
 *
 * Flux :
 * 1. getCsrfCookie() → Laravel pose XSRF-TOKEN
 * 2. POST /login avec credentials + header X-XSRF-TOKEN
 * 3. Laravel crée la session → pose laravel_session (HttpOnly)
 * 4. Retourne l'utilisateur (ou une réponse 200 selon votre backend)
 *
 * @param {Object} credentials - { email: string, password: string, remember?: boolean }
 */
export const login = async (credentials) => {
    await getCsrfCookie();
    return api.post(`${V1}/auth/login`, credentials);
};

/**
 * Enregistre un nouvel utilisateur.
 *
 * @param {Object} data - { name, email, password, password_confirmation,photo }
 */
export const register = async (data) => {
    await getCsrfCookie();
    return api.post(`${V1}/auth/register`, data);
};

/**
 * Déconnecte l'utilisateur.
 * Laravel invalide la session et supprime laravel_session.
 */
export const logout = async () => {
    await getCsrfCookie();
    return api.post(`${V1}/auth/logout`);
};

/**
 * Récupère l'utilisateur authentifié courant.
 * Retourne 401 si la session est invalide/expirée.
 *
 * Utilisé au montage de l'app pour hydrater le Context.
 */
export const getUser = () => api.get(`${V1}/auth/me`);

/**
 * Envoie un email de réinitialisation de mot de passe.
 *
 * @param {Object} data - { email: string }
 */
export const forgotPassword = async (data) => {
    await getCsrfCookie();
    return api.post(`${V1}/auth/forgot-password`, data);
};

/**
 * Réinitialise le mot de passe avec le token reçu par email.
 *
 * @param {Object} data - { token, email, password, password_confirmation }
 */
export const resetPassword = async (data) => {
    await getCsrfCookie();
    return api.post(`${V1}/auth/reset-password`, data);
};

// Verify email
export const verifyEmail = async (token) => {
    await getCsrfCookie();
    return api.post(`${V1}/auth/verify-email/${token}`);
};

// 2FA
export const enableTwoFactor = async () => {
    const response = await api.post(`${V1}/auth/2fa/enable`);
    return response.data;
};

/**
 * Valide le code TOTP et active définitivement le 2FA.
 * @param {string} code - Code à 6 chiffres
 */
export const verifyTwoFactor = (code) =>
    api.post(`${V1}/auth/2fa/verify`, { code });


export const disableTwoFactor = async (password) => {
    await getCsrfCookie();
    return api.post(`${V1}/auth/2fa/disable`, { password });
};

/**
 * Met à jour le mot de passe.
 * Action sensible → CSRF rafraîchi défensivement.
 *
 * @param {{ currentPassword: string, password: string, passwordConfirmation: string }} data
 */
export const updatePassword = async (data) => {
    await getCsrfCookie();
    return api.patch(`${V1}/auth/password`, {
        current_password: data.currentPassword,
        password: data.password,
        password_confirmation: data.passwordConfirmation,
    });
};

/**
 * Met à jour le profil (nom, téléphone, photo).
 * PATCH est le verbe correct pour une mise à jour partielle — mais un
 * FormData (upload de photo) doit passer par POST + _method=PATCH (PHP ne
 * parse pas les bodies multipart sur les requêtes PUT/PATCH).
 *
 * @param {{ first_name?: string, last_name?: string, phone?: string, photo?: File }|FormData} data
 */
export const updateProfile = (data) => {
    if (data instanceof FormData) {
        data.append('_method', 'PATCH');
        return api.post(`${V1}/auth/profile`, data);
    }
    return api.patch(`${V1}/auth/profile`, data);
};

// Vérification email via OTP
export const verifyEmailOtp = async (data) => {
    await getCsrfCookie();
    return api.post(`${V1}/auth/verify-email/otp`, data);
};

// Vérification email via lien
export const verifyEmailLink = (token, email) =>
    api.get(`${V1}/auth/verify-email/link`, { params: { token, email } });

// Renvoi du code
export const resendVerification = async (data) => {
    await getCsrfCookie();
    return api.post(`${V1}/auth/verify-email/resend`, data);
};

// Vérification OTP reset password
export const verifyResetOtp = async (data) => {
    await getCsrfCookie();
    return api.post(`${V1}/auth/forgot-password/verify-otp`, data);
};
export default api;
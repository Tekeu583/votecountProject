/**
 * context/AuthProvider.jsx
 *
 * Fournit l'état d'authentification et les actions à l'arborescence React.
 *
 * RESPONSABILITÉS :
 * -------------------------------------------
 * • Hydrater l'état utilisateur au montage (session existante ?)
 * • Exposer login / register / logout / refreshUser / checkAuth
 * • Gérer les codes d'erreur HTTP spécifiques à Sanctum (401, 419)
 * • Écouter les événements globaux émis par l'intercepteur Axios
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import AuthContext from "./AuthContext";
import {
    login as apiLogin,
    register as apiRegister,
    logout as apiLogout,
    getUser,
} from "@services/api";

// -------------------------------------------
// STATE INITIAL
// -------------------------------------------

const INITIAL_STATE = {
    user: null,
    loading: true,       // true au montage : on vérifie la session avant tout rendu
    authenticated: false,
    errors: {},
};

// -------------------------------------------
// PROVIDER
// -------------------------------------------

export default function AuthProvider({ children }) {
    const [user, setUser] = useState(INITIAL_STATE.user);
    const [loading, setLoading] = useState(INITIAL_STATE.loading);
    const [authenticated, setAuthenticated] = useState(INITIAL_STATE.authenticated);
    const [errors, setErrors] = useState(INITIAL_STATE.errors);


    /** Réinitialise l'état vers "non authentifié". */
    const clearAuth = useCallback(() => {
        setUser(null);
        setAuthenticated(false);
        setErrors({});
    }, []);

    /** Met à jour l'état vers "authentifié" avec les données utilisateur. */
    const setAuth = useCallback((userData) => {
        setUser(userData);
        setAuthenticated(true);
        setErrors({});
    }, []);

    const extractUser = (responseData) =>
        responseData?.data?.user ?? responseData?.data ?? responseData;

    // -- VÉRIFICATION DE SESSION AU MONTAGE -----------------------

    /**
     * checkAuth-
     *
     * Appelle GET /api/v1/user pour savoir si une session valide existe.
     *
     * CAS 200 : session active → hydrate le state (user, authenticated).
     * CAS 401 : pas de session → state "non authentifié" (comportement normal).
     * CAS 419 : CSRF expiré   → même traitement que 401 au montage.
     *
     * NE JAMAIS faire de getCsrfCookie() ici : checkAuth est une lecture,
     * pas une mutation. Le cookie CSRF n'est nécessaire que pour les POST.
     */
    const checkAuth = useCallback(async () => {
        try {
            const response = await getUser();
            const user = response.data?.data?.user ?? response.data?.data ?? response.data;
            setAuth(user);
        } catch (error) {
            const status = error.response?.status;
            if (status === 401 || status === 419) {
                clearAuth();
            } else {
                clearAuth();
                if (import.meta.env.DEV) {
                    console.error("[AuthProvider] checkAuth erreur inattendue :", error);
                }
            }
        } finally {
            setLoading(false);
        }
    }, [setAuth, clearAuth]);

    /**
     * refreshUser
     *
     * Re-fetch l'utilisateur courant (ex : après une mise à jour de profil).
     * 
     */
    const refreshUser = useCallback(async () => {
        try {
            const response = await getUser();
            const user = response.data?.data?.user ?? response.data?.data ?? response.data;
            setAuth(user);

        } catch (error) {
            if (error.response?.status === 401) {
                clearAuth();
            }
        }
    }, [setAuth, clearAuth]);

    // -- ACTIONS D'AUTHENTIFICATION ---------------------

    /**
     * login
     *
     * Flux :
     * 1. getCsrfCookie() (dans apiLogin) → XSRF-TOKEN posé
     * 2. POST /api/v1/login avec credentials → session créée, laravel_session posé
     * 3. GET /api/v1/user → hydratation du state
     *
     * @param {Object} credentials - { email, password, remember? }
     * @throws  Propage l'erreur Axios pour que le composant gère l'UI.
     */
    const login = useCallback(async (credentials) => {
        setErrors({});
        try {
            const response = await apiLogin(credentials);

            const user = response.data?.data?.user;
            if (user) {

                setAuth(user);
            } else {
                await refreshUser();
            }
        } catch (error) {
            if (error.response?.status === 422) {
                setErrors(error.response.data.errors ?? {});
            }
            throw error;
        }
    }, [setAuth, refreshUser]);

    /**
     * register
     *
     * @param {Object} data - { name, email, password, password_confirmation }
     */
    const register = useCallback(async (data) => {
        setErrors({});
        try {
            const response = await apiRegister(data);
            return response;

        } catch (error) {
            if (error.response?.status === 422) {
                setErrors(error.response.data.errors ?? {});
            }
            throw error;
        }
    }, []);

    /**
     * logout
     *
     * Flux :
     * 1. getCsrfCookie() (dans apiLogout) → XSRF-TOKEN frais
     * 2. POST /api/v1/logout → Laravel invalide la session
     * 3. clearAuth() → React state réinitialisé
     *
     * On clearAuth() même si le POST échoue : la session locale est
     * considérée invalide de toute façon.
     */
    const logout = useCallback(async () => {
        try {
            await apiLogout();
        } catch (error) {
            if (import.meta.env.DEV) {
                console.warn("[AuthProvider] Erreur lors du logout :", error);
            }
        } finally {
            clearAuth();
        }
    }, [clearAuth]);

    // -- EFFETS -----------------------------------------

    /**
     * Hydratation initiale.
     * S'exécute une seule fois au montage du Provider.
     */
    useEffect(() => {
        checkAuth();
    }, [checkAuth]);

    /**
     * Écoute les événements globaux émis par l'intercepteur Axios.
     *
     * Pourquoi des événements plutôt qu'une callback directe ?
     * → L'intercepteur (api.js) ne connaît pas AuthProvider.
     *   Les événements cassent ce couplage sans créer de dépendance circulaire.
     */
    useEffect(() => {
        const handleUnauthenticated = () => {
            clearAuth();
        };

        const handleCsrfExpired = () => {

            clearAuth();
        };

        window.addEventListener("auth:unauthenticated", handleUnauthenticated);
        window.addEventListener("auth:csrf-expired", handleCsrfExpired);

        return () => {
            window.removeEventListener("auth:unauthenticated", handleUnauthenticated);
            window.removeEventListener("auth:csrf-expired", handleCsrfExpired);
        };
    }, [clearAuth]);

    // -- VALEUR DU CONTEXT ------------------------------

    const value = useMemo(() => ({
        //state
        user,
        loading,
        authenticated,
        errors,
        //actions
        login,
        register,
        logout,
        refreshUser,
        checkAuth,
        setAuth,
    }), [
        user,
        loading,
        authenticated,
        errors,
        login,
        register,
        logout,
        refreshUser,
        checkAuth,
        setAuth,
    ]);


    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

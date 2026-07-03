/**
 * hooks/useAuth.js
 *
 * Hook d'accès au contexte d'authentification.
 *
 *
 * GUARD DE CONTEXTE :
 * ─────────────────────────────────────────────────────────────────
 * Si useAuth est appelé hors de AuthProvider, le contexte vaut null
 * (valeur par défaut de AuthContext). On détecte ce cas et on lève
 * une erreur explicite — comportement fail-fast préférable à un crash
 * silencieux sur `undefined is not a function`.
 */

import { useContext } from "react";
import AuthContext from "@context/AuthContext";

/**
 * @returns {{
 *   user: Object|null,
 *   loading: boolean,
 *   authenticated: boolean,
 *   errors: Object,
 *   login: (credentials: Object) => Promise<void>,
 *   register: (data: Object) => Promise<void>,
 *   logout: () => Promise<void>,
 *   refreshUser: () => Promise<void>,
 *   checkAuth: () => Promise<void>,
 * }}
 */
export function useAuth() {
  const context = useContext(AuthContext);

  if (context === null) {
    throw new Error(
      "[useAuth] Ce hook doit être utilisé à l'intérieur de <AuthProvider>.\n" +
      "Assurez-vous que AuthProvider enveloppe l'arborescence contenant ce composant."
    );
  }

  return context;
}

// Export par défaut pour la compatibilité avec les imports existants.
export default useAuth;

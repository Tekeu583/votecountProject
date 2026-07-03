/**
 * context/AuthContext.jsx
 *
 * Définit le contrat du contexte d'authentification.
 *
 * Ce fichier fait UNE SEULE chose : créer et exporter le contexte.
 * La logique métier appartient à AuthProvider, pas ici.
 *
 * Pourquoi séparer Context et Provider ?
 * ─────────────────────────────────────────────────────────────────
 * • Évite les imports circulaires (useAuth importe Context, pas Provider).
 * • Permet de tester le Provider sans le hook, et vice-versa.
 * • Respecte le principe de responsabilité unique (SRP).
 *
 * La valeur par défaut (null) est intentionnelle :
 * useAuth détecte null pour lever une erreur si le hook est utilisé
 * hors du Provider — comportement fail-fast, préférable au silence.
 */

import { createContext } from "react";

/**
 * AuthContext
 *
 * Shape attendue fournie par AuthProvider :
 * {
 *   user:          Object | null    — données de l'utilisateur authentifié
 *   loading:       boolean          — hydratation initiale en cours
 *   authenticated: boolean          — session active confirmée
 *   errors:        Object           — erreurs de validation Laravel (422)
 *
 *   login:         (credentials) => Promise<void>
 *   register:      (data)        => Promise<void>
 *   logout:        ()            => Promise<void>
 *   refreshUser:   ()            => Promise<void>
 *   checkAuth:     ()            => Promise<void>
 * }
 */
const AuthContext = createContext(null);

export default AuthContext;

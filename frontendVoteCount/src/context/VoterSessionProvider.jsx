/**
 * context/VoterSessionProvider.jsx
 *
 * NOUVEAU (Claude) — gère l'état de la session votant pour le flux de
 * vote privé, persistée en sessionStorage.
 *
 * RESPONSABILITÉS :
 * ------------------------------------------------
 * • Hydrater la session au montage (sessionStorage → state)
 * • Exposer startSession / endSession / hasActiveSession
 * • Purger automatiquement une session expirée (TTL miroir du
 *   session_token backend : 30 minutes, voir VoteController::createVoterSession)
 *
 * sessionStorage plutôt que localStorage : effacé à la fermeture de
 * l'onglet, non partagé entre onglets — un compromis raisonnable entre
 * sécurité et confort (le serveur invalide de toute façon le token
 * après 30 min, sessionStorage ne fait qu'éviter de le redemander
 * inutilement pendant ce délai).
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import VoterSessionContext from "./VoterSessionContext";

const STORAGE_KEY = "votecount_voter_session";

const SESSION_TTL_MS =60 * 60 * 1000;

function readStoredSession() {
    try {
        const raw = sessionStorage.getItem(STORAGE_KEY);
        if (!raw) return null;

        const parsed = JSON.parse(raw);
        if (!parsed?.expiresAt || parsed.expiresAt < Date.now()) {
            sessionStorage.removeItem(STORAGE_KEY);
            return null;
        }
        return parsed;
    } catch {
        sessionStorage.removeItem(STORAGE_KEY);
        return null;
    }
}

export default function VoterSessionProvider({ children }) {
    const [voterSession, setVoterSession] = useState(() => readStoredSession());

    /** Démarre une session votant (appelé après verifyAccessOtp réussi). */
    const startSession = useCallback((data) => {
        const session = {
            electionUuid: data.electionUuid,
            electionId: data.electionId,
            sessionToken: data.sessionToken,
            electorName: data.electorName,
            electionTitle: data.electionTitle,
            candidates: data.candidates,
            realTimeResults: data.realTimeResults,
            electionBanner: data.electionBanner,
            electionDescription: data.electionDescription,
            liveScoresInitial: data.liveScoresInitial,
            expiresAt: Date.now() + SESSION_TTL_MS,
        };
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
        setVoterSession(session);
    }, []);

    /** Termine la session votant (vote soumis, ou déconnexion manuelle). */
    const endSession = useCallback(() => {
        sessionStorage.removeItem(STORAGE_KEY);
        setVoterSession(null);
    }, []);

    /** true si une session valide existe, optionnellement pour une élection précise. */
    const hasActiveSession = useCallback((electionUuid) => {
        if (!voterSession || voterSession.expiresAt < Date.now()) return false;
        if (electionUuid && voterSession.electionUuid !== electionUuid) return false;
        return true;
    }, [voterSession]);

    // Purge automatique à l'expiration pendant que l'onglet reste ouvert.
    useEffect(() => {
        if (!voterSession) return undefined;

        const msLeft = voterSession.expiresAt - Date.now();
        if (msLeft <= 0) {
            endSession();
            return undefined;
        }

        const timer = setTimeout(endSession, msLeft);
        return () => clearTimeout(timer);
    }, [voterSession, endSession]);

    const value = useMemo(() => ({
        voterSession,
        hasActiveSession,
        startSession,
        endSession,
    }), [voterSession, hasActiveSession, startSession, endSession]);

    return (
        <VoterSessionContext.Provider value={value}>
            {children}
        </VoterSessionContext.Provider>
    );
}
/**
 * hooks/useVoterSession.js
 *hook d'accès au contexte de session votant.
 * Même garde-fou fail-fast que useAuth.
 */

import { useContext } from "react";
import VoterSessionContext from "@context/VoterSessionContext";

export function useVoterSession() {
    const context = useContext(VoterSessionContext);

    if (context === null) {
        throw new Error(
            "[useVoterSession] Ce hook doit être utilisé à l'intérieur de <VoterSessionProvider>.\n" +
            "Assurez-vous que VoterSessionProvider enveloppe l'arborescence contenant ce composant."
        );
    }

    return context;
}

export default useVoterSession;
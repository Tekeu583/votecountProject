/**
 * context/VoterSessionContext.jsx
 *
 * Shape attendue fournie par VoterSessionProvider :
 * {
 *   voterSession: {
 *     electionUuid, sessionToken, electorName, electionTitle,
 *     candidates, realTimeResults, expiresAt
 *   } | null
 *   hasActiveSession: (electionUuid?: string) => boolean
 *   startSession: (data) => void
 *   endSession:   () => void
 * }
 */

import { createContext } from "react";

const VoterSessionContext = createContext(null);

export default VoterSessionContext;
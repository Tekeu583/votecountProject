// context/OrgContext.js
import { createContext } from 'react';

/**
 * OrgContext
 *
 * Expose l'organisation active et la liste des organisations de l'user.
 * Consommé via useOrg().
 */
const OrgContext = createContext(null);

export default OrgContext;
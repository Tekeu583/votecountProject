// hooks/useOrg.js
import { useContext } from 'react';
import OrgContext from '@context/OrgContext';

/**
 * useOrg
 *
 * Hook d'accès à l'organisation active.
 * Doit être utilisé uniquement dans les composants enfants de OrgProvider
 * (c'est-à-dire dans toutes les pages sous /org/:orgUuid/*).
 *
 * @returns {{
 *   org: object|null,        -- Organisation active complète
 *   orgs: object[],          -- Toutes les organisations de l'user
 *   orgLoading: boolean,     -- true pendant le chargement
 *   orgError: string|null,   -- Message d'erreur si échec
 *   switchOrg: function,     -- (uuid) => void, change l'URL
 *   refreshOrgs: function,   -- () => Promise, recharge la liste
 * }}
 *
 * @throws Si appelé en dehors de OrgProvider
 */
export function useOrg() {
    const context = useContext(OrgContext);

    if (context === null) {
        throw new Error(
            'useOrg() doit être utilisé dans un composant enfant de OrgProvider. ' +
            'Vérifiez que DashboardLayout org enveloppe bien ses routes avec OrgProvider.'
        );
    }

    return context;
}
// context/OrgProvider.jsx
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import OrgContext from './OrgContext';
import { organizationsApi } from '@services/api';

/**
 * OrgProvider
 *
 * RESPONSABILITÉS :
 * ─────────────────────────────────────────────────────────────────
 * • Charger toutes les organisations de l'utilisateur connecté
 * • Identifier l'organisation active depuis le paramètre :orgUuid de l'URL
 * • Si :orgUuid absent ou invalide → rediriger vers la première organisation
 * • Exposer switchOrg() pour changer d'organisation (change l'URL)
 *
 * PLACEMENT :
 * Ce provider doit envelopper uniquement les routes /org/:orgUuid/*.
 * Il est monté dans DashboardLayout côté org.
 *
 * ACCÈS :
 * import { useOrg } from '@hooks/useOrg';
 * const { org, orgs, orgLoading, switchOrg } = useOrg();
 */
export default function OrgProvider({ children }) {
    const { orgUuid } = useParams();
    const navigate = useNavigate();

    const [orgs, setOrgs] = useState([]);
    const [org, setOrg] = useState(null);
    const [orgLoading, setOrgLoading] = useState(true);
    const [orgError, setOrgError] = useState(null);

    // Évite un double-chargement en StrictMode / re-montage rapide
    const hasLoadedRef = useRef(false);

    // ── Chargement de toutes les organisations ───────────────────

    const loadOrgs = useCallback(async () => {
        setOrgLoading(true);
        setOrgError(null);
        try {
            const res = await organizationsApi.getMyOrganizations();
            const list = res.data?.data ?? res.data ?? [];
            const arr = Array.isArray(list) ? list : [list];
            setOrgs(arr);
            console.log(arr);
            return arr;
        } catch {
            setOrgError("Impossible de charger vos organisations.");
            return [];
        } finally {
            setOrgLoading(false);
        }
    }, []);

    useEffect(() => {
        hasLoadedRef.current = true;
        loadOrgs();
        // Chargement unique au montage du provider — pas de dépendance orgUuid ici.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ── Résolution de l'organisation active depuis l'URL ─────────

    useEffect(() => {
        // Attendre que le chargement initial soit terminé
        if (orgLoading || orgs.length === 0) {
            if (!orgLoading && orgs.length === 0 && hasLoadedRef.current) {
                // Chargement terminé mais aucune organisation trouvée
                setOrg(null);
            }
            return;
        }

        if (!orgUuid) {
            navigate(`/org/${orgs[0].uuid}`, { replace: true });
            return;
        }

        const found = orgs.find(o => o.uuid === orgUuid);
        if (!found) {
            // UUID invalide ou organisation non accessible → première org
            navigate(`/org/${orgs[0].uuid}`, { replace: true });
            return;
        }

        setOrg(found);
    }, [orgUuid, orgs, orgLoading, navigate]);

    // ── Switcher d'organisation ──────────────────────────────────

    /**
     * switchOrg
     *
     * Change l'organisation active en modifiant l'URL.
     * React Router re-rend les pages avec le nouvel :orgUuid.
     * Préserve le segment de chemin courant (ex: /scrutins).
     *
     * Ex: /org/uuid-A/scrutins → switchOrg(uuid-B) → /org/uuid-B/scrutins
     */
    const switchOrg = useCallback((targetUuid) => {
        if (targetUuid === orgUuid) return;

        // Extraire le segment après l'UUID courant pour le préserver
        const currentPath = window.location.pathname;
        // Pattern : /org/{uuid}/{reste}
        const match = currentPath.match(/^\/org\/[^/]+(\/.*)?$/);
        const rest = match?.[1] ?? '';

        navigate(`/org/${targetUuid}${rest}`, { replace: false });
    }, [orgUuid, navigate]);

    // ── Valeur du context ────────────────────────────────────────
    /**
       * refreshOrgs
       *
       * Force un rechargement complet de la liste (ex: après création
       * d'une nouvelle organisation). À appeler explicitement, jamais
       * automatiquement lors de la navigation.
       */
    const refreshOrgs = useCallback(() => loadOrgs(), [loadOrgs]);

    const value = useMemo(() => ({
        org,
        orgs,
        orgLoading,
        orgError,
        switchOrg,
        refreshOrgs,
    }), [org, orgs, orgLoading, orgError, switchOrg, refreshOrgs]);

    return (
        <OrgContext.Provider value={value}>
            {children}
        </OrgContext.Provider>
    );
}
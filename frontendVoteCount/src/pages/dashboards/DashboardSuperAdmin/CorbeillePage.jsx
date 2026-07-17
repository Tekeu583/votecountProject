import { useState, useEffect } from "react";
import TrashManager from "@components/dashboard/TrashManager";
import { organizationsApi } from "@services/api";

// Vue globale (toutes organisations) — TrashManager ne dépend pas de
// useOrg()/OrgProvider, contrairement à DashboardAdminOrg/Corbeille.jsx.
function CorbeillePage() {
    const [organizations, setOrganizations] = useState([]);
    const [orgFilter, setOrgFilter] = useState('');

    useEffect(() => {
        organizationsApi.getAll({ per_page: 100 })
            .then(res => setOrganizations(res.data?.data ?? []))
            .catch(() => setOrganizations([]));
    }, []);

    return (
        <div>
            <div className="px-4 lg:px-6 pt-4">
                <label htmlFor="org-filter" className="block text-sm font-medium mb-1">Filtrer par organisation</label>
                <select
                    id="org-filter"
                    value={orgFilter}
                    onChange={(e) => setOrgFilter(e.target.value)}
                    className="input w-full md:w-80"
                >
                    <option value="">Toutes les organisations</option>
                    {organizations.map(org => (
                        <option key={org.uuid} value={org.uuid}>{org.name}</option>
                    ))}
                </select>
            </div>
            <TrashManager organizationUuid={orgFilter || undefined} />
        </div>
    );
}

export default CorbeillePage;

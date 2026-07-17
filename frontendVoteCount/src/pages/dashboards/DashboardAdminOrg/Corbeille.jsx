import { useOrg } from '@hooks/useOrg';
import TrashManager from '@components/dashboard/TrashManager';

// Corbeille scopée à l'organisation courante (contexte OrgProvider).
// Pour la vue globale super-admin, voir DashboardSuperAdmin/CorbeillePage.jsx
// qui réutilise TrashManager hors OrgProvider.
const Corbeille = () => {
    const { org } = useOrg();

    return <TrashManager organizationUuid={org?.uuid} ready={Boolean(org?.uuid)} />;
};

export default Corbeille;

// components/layouts/DashboardLayout.jsx
import { useState } from 'react';
import { Outlet, useParams, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useAuth } from '@hooks/useAuth';
import OrgProvider from '@context/OrgProvider';
import { useOrg } from '@hooks/useOrg';
import { getPrimaryRole } from '@utils/roleRoutes';

/**
 * DashboardLayoutInner
 *
 * Rendu à l'intérieur de OrgProvider.
 * Consomme useOrg() et injecte org/orgs/switchOrg dans Sidebar.
 */
function DashboardLayoutInner({ role, userName, orgUuid }) {
    const [isOpen, setIsOpen] = useState(false);
    const { org, orgs, switchOrg } = useOrg();

    return (
        <div className="flex min-h-screen overflow-x-hidden">
            <Sidebar
                role={role}
                user={userName}
                isOpen={isOpen}
                setIsOpen={setIsOpen}
                org={org}
                orgs={orgs}
                orgUuid={orgUuid}
                onSwitchOrg={switchOrg}
            />
            <div className="flex-1 flex flex-col min-w-0 lg:pl-[256px]">
                <main className="p-4 lg:p-6 bg-[var(--color-background-white)] flex-1 min-w-0">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}

/**
 * DashboardLayoutSimple
 *
 * Pour les dashboards non-org (jury, candidat, voter).
 * Pas d'OrgProvider, pas de switcher.
 */
function DashboardLayoutSimple({ role, userName }) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="flex min-h-screen overflow-x-hidden">
            <Sidebar
                role={role}
                user={userName}
                isOpen={isOpen}
                setIsOpen={setIsOpen}
            />
            <div className="flex-1 flex flex-col min-w-0 lg:pl-[256px]">
                <main className="p-4 lg:p-6 bg-[var(--color-background-white)] flex-1 min-w-0">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}

/**
 * DashboardLayout
 *
 * Point d'entrée unique. Décide si OrgProvider est nécessaire.
 * ProtectedRoute en amont garantit l'authentification et le rôle.
 */
export default function DashboardLayout() {
    const { user } = useAuth();
    const { orgUuid } = useParams(); // undefined pour les routes non-org
    const location = useLocation();
    const role = getPrimaryRole(user);
    const userName = user?.first_name || user?.last_name || user?.email || '';

    const isOrgRoute = location.pathname.startsWith('/org');


    if (isOrgRoute) {
        return (
            <OrgProvider>
                <DashboardLayoutInner
                    role={role}
                    userName={userName}
                    orgUuid={orgUuid}
                />
            </OrgProvider>
        );
    }

    return (
        <DashboardLayoutSimple
            role={role}
            userName={userName}
        />
    );
}
// components/layouts/Sidebar.jsx
import { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
    LogOut, X, Menu, CircleUser,
    ChevronDown, Check, Building2, LayoutGrid,
} from 'lucide-react';
import { menuByRole } from './config/menuByRole';
import Logo from '../Logo';
import { useAuth } from '@hooks/useAuth';
import { toast } from 'react-hot-toast';
import PropTypes from 'prop-types';
import { ROLES, ROLE_LABELS } from '@utils/roles';
import { getAvailableRoles, getDashboardRoute } from '@utils/roleRoutes';

// Rôles ayant un vrai dashboard routé dans App.jsx
const SWITCHABLE_ROLES = [ROLES.SUPER_ADMIN, ROLES.ADMIN_ORG, ROLES.JURY, ROLES.MANAGER, ROLES.CANDIDAT];

// --- Helpers -----------------------------------------

/**
 * getMenuBase
 *
 * Pour organization_owner : base dynamique /org/:orgUuid
 * Pour les autres rôles   : base statique depuis menuByRole
 */
function getMenuBase(role, orgUuid) {
    if ((role === ROLES.ADMIN_ORG || role === ROLES.SUPER_ADMIN) && orgUuid) {
        return `/org/${orgUuid}`;
    }
    return menuByRole[role]?.base ?? '/';
}

/**
 * getMenuConfigFromPath
 *
 * Source de vérité : l'URL courante, pas le rôle.
 * /org/:uuid/* → menu organization_owner
 * Autres       → match par préfixe statique
 */
function getMenuConfigFromPath(pathname, role) {
    if (pathname.startsWith('/org/') || pathname === '/org') {
        return menuByRole[ROLES.ADMIN_ORG] ?? null;
    }
    const configs = Object.values(menuByRole).sort(
        (a, b) => b.base.length - a.base.length
    );
    return configs.find((c) => pathname.startsWith(c.base)) || menuByRole[role] || null;
}

// --- OrgSwitcher -------------------------------------------

/**
 * Affiché uniquement pour organization_owner quand l'user
 * a plusieurs organisations. Props injectées depuis DashboardLayoutInner.
 */
function OrgSwitcher({ org, orgs, onSwitch }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const handleOutside = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('mousedown', handleOutside);
        return () => document.removeEventListener('mousedown', handleOutside);
    }, []);

    if (!org) return null;

    return (
        <div ref={ref} className="relative mb-5">
            <button
                onClick={() => setOpen(o => !o)}
                className="w-full flex items-center gap-2 px-3 py-2.5 rounded-[var(--radius-md)]
                           bg-[var(--color-gray-dark)] hover:bg-white/10 transition-colors text-left"
            >
                <div className="w-7 h-7 rounded-md bg-[var(--color-primary)]/20 flex items-center justify-center shrink-0">
                    <Building2 size={14} className="text-[var(--color-primary)]" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-xs text-[var(--color-gray-light)] leading-none mb-0.5">
                        Organisation
                    </p>
                    <p className="text-sm text-white font-medium truncate leading-tight">
                        {org.name}
                    </p>
                </div>
                {orgs.length > 1 && (
                    <ChevronDown
                        size={14}
                        className={`text-[var(--color-gray-light)] shrink-0 transition-transform
                            ${open ? 'rotate-180' : ''}`}
                    />
                )}
            </button>

            {open && orgs.length > 1 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-[var(--color-dark)]
                                border border-white/10 rounded-[var(--radius-md)] shadow-xl z-[60]
                                max-h-48 overflow-y-auto">
                    {orgs.map(o => (
                        <button
                            key={o.uuid}
                            onClick={() => { onSwitch(o.uuid); setOpen(false); }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/10
                                       transition-colors text-left border-b border-white/5 last:border-0"
                        >
                            <div className="w-6 h-6 rounded bg-[var(--color-primary)]/20 flex items-center justify-center shrink-0">
                                <Building2 size={12} className="text-[var(--color-primary)]" />
                            </div>
                            <span className="text-sm text-white truncate flex-1">{o.name}</span>
                            {o.uuid === org.uuid && (
                                <Check size={14} className="text-[var(--color-primary)] shrink-0" />
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

OrgSwitcher.propTypes = {
    org: PropTypes.object.isRequired,
    orgs: PropTypes.array.isRequired,
    onSwitch: PropTypes.func.isRequired,
};

// --- RoleSwitcher -------------------------------------------

/**
 * Affiché dès que l'utilisateur a accès à plus d'un dashboard (ex:
 * organization_owner + jury). Contrairement à OrgSwitcher, aucune donnée à
 * charger : user.roles/organizations/elections sont déjà dans AuthContext
 * après connexion — changer de rôle est une simple navigation.
 */
function RoleSwitcher({ currentRole, roles, onSwitch }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const handleOutside = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('mousedown', handleOutside);
        return () => document.removeEventListener('mousedown', handleOutside);
    }, []);

    return (
        <div ref={ref} className="relative mb-3">
            <button
                onClick={() => setOpen(o => !o)}
                className="w-full flex items-center gap-2 px-3 py-2.5 rounded-[var(--radius-md)]
                           bg-[var(--color-gray-dark)] hover:bg-white/10 transition-colors text-left"
            >
                <div className="w-7 h-7 rounded-md bg-[var(--color-primary)]/20 flex items-center justify-center shrink-0">
                    <LayoutGrid size={14} className="text-[var(--color-primary)]" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-xs text-[var(--color-gray-light)] leading-none mb-0.5">
                        Espace de travail
                    </p>
                    <p className="text-sm text-white font-medium truncate leading-tight">
                        {ROLE_LABELS[currentRole] ?? currentRole}
                    </p>
                </div>
                <ChevronDown
                    size={14}
                    className={`text-[var(--color-gray-light)] shrink-0 transition-transform
                        ${open ? 'rotate-180' : ''}`}
                />
            </button>

            {open && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-[var(--color-dark)]
                                border border-white/10 rounded-[var(--radius-md)] shadow-xl z-[60]">
                    {roles.map(r => (
                        <button
                            key={r}
                            onClick={() => { onSwitch(r); setOpen(false); }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/10
                                       transition-colors text-left border-b border-white/5 last:border-0"
                        >
                            <div className="w-6 h-6 rounded bg-[var(--color-primary)]/20 flex items-center justify-center shrink-0">
                                <LayoutGrid size={12} className="text-[var(--color-primary)]" />
                            </div>
                            <span className="text-sm text-white truncate flex-1">{ROLE_LABELS[r] ?? r}</span>
                            {r === currentRole && (
                                <Check size={14} className="text-[var(--color-primary)] shrink-0" />
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

RoleSwitcher.propTypes = {
    currentRole: PropTypes.string.isRequired,
    roles: PropTypes.array.isRequired,
    onSwitch: PropTypes.func.isRequired,
};

// ---Sidebar -------------------------------------------

/**
 * Props org, orgs, orgUuid, onSwitchOrg :
 *   - Injectées par DashboardLayoutInner (qui a accès à useOrg())
 *   - Non présentes pour les dashboards non-org (jury, candidat...)
 *   - La Sidebar elle-même ne consomme PAS useOrg() directement
 *     pour respecter les règles des hooks React
 */
export default function Sidebar({
    role,
    user,
    isOpen,
    setIsOpen,
    org = null,
    orgs = [],
    orgUuid = null,
    onSwitchOrg = () => { },
}) {
    const { logout, user: authUser } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const isOrgDashboard = role === ROLES.ADMIN_ORG;
    const base = getMenuBase(role, orgUuid);
    const menuConfig = getMenuConfigFromPath(location.pathname, role);
    const { menu } = menuConfig ?? { menu: [] };

    const switchableRoles = getAvailableRoles(authUser).filter((r) => SWITCHABLE_ROLES.includes(r));
    const handleSwitchRole = (targetRole) => navigate(getDashboardRoute(targetRole));

    const handleLogout = async () => {
        await toast.promise(logout(), {
            loading: 'Déconnexion...',
            success: 'Vous avez été déconnecté avec succès',
            error: "Une erreur s'est produite lors de la déconnexion",
        });
        navigate('/');
    };

    const linkClass = (isActive) => `
        flex items-center gap-3 px-3 py-2 rounded-[var(--radius-md)] text-sm font-medium
        transition-all duration-200 border-l-4 border-transparent
        ${isActive
            ? 'border-l-[var(--color-primary)] bg-[var(--color-gray)] text-[var(--color-white)] font-bold'
            : 'text-[var(--color-gray-light)] hover:border-l-[var(--color-primary)] hover:bg-[var(--color-gray-dark)] hover:text-[var(--color-primary)]'
        }
    `;

    const closeSidebar = () => setIsOpen(false);

    return (
        <>
            {/* Bouton mobile */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="fixed top-4 left-4 z-[60] lg:hidden bg-white shadow p-2 rounded-md text-[var(--color-primary)]"
                >
                    <Menu size={20} />
                </button>
            )}

            {/* Overlay */}
            {isOpen && (
                <button
                    onClick={closeSidebar}
                    className="fixed inset-0 bg-[var(--color-dark)] opacity-50 z-[40] lg:hidden"
                />
            )}

            {/* Sidebar */}
            <aside
                className={`
                    fixed top-0 left-0 h-full w-[256px] bg-[var(--color-dark)]
                    z-[50] flex flex-col justify-between p-4
                    transform transition-transform duration-300 ease-in-out
                    ${isOpen ? 'translate-x-0' : '-translate-x-full'}
                    lg:translate-x-0
                `}
            >
                {/* TOP */}
                <div className="flex flex-col flex-1 overflow-y-auto">

                    {/* Logo mobile */}
                    <div className="flex items-center justify-between mb-6 lg:hidden">
                        <Logo />
                        <button onClick={closeSidebar}>
                            <X size={22} className="text-white" />
                        </button>
                    </div>

                    {/* Logo desktop */}
                    <div className="hidden lg:block mb-6">
                        <Logo />
                    </div>

                    {/* Switcher de dashboard (utilisateurs multi-rôles uniquement) */}
                    {switchableRoles.length > 1 && (
                        <RoleSwitcher
                            currentRole={role}
                            roles={switchableRoles}
                            onSwitch={handleSwitchRole}
                        />
                    )}

                    {/* Switcher organisation (org dashboard uniquement) */}
                    {isOrgDashboard && org ? (
                        <OrgSwitcher
                            org={org}
                            orgs={orgs.length > 0 ? orgs : [org]}
                            onSwitch={onSwitchOrg}
                        />
                    ) : (
                        // Label espace pour les autres dashboards
                        <p className="text-sm text-[var(--color-gray-light)] mb-4 capitalize font-semibold">
                            Dashboard {base.replace('/', '').replace(/_/g, ' ')}
                        </p>
                    )}

                    {/* Navigation */}
                    <nav className="flex flex-col gap-1">
                        {menu.map((item) => {
                            const Icon = item.icon;
                            const fullPath = `${base}/${item.path}`
                                .replace(/\/+/g, '/')
                                .replace(/\/$/, '') || '/';

                            return (
                                <NavLink
                                    key={`${item.name}-${fullPath}`}
                                    to={fullPath}
                                    end={item.path === ''}
                                    onClick={closeSidebar}
                                    className={({ isActive }) => linkClass(isActive)}
                                >
                                    <Icon size={18} />
                                    {item.name}
                                </NavLink>
                            );
                        })}
                    </nav>
                </div>

                {/* BOTTOM */}
                <div className="border-t border-[var(--color-gray-dark)] pt-4">
                    <div className="flex items-center gap-3 mb-3">
                        {authUser?.photo ? (
                            <img
                                src={authUser.photo}
                                alt={user}
                                className="w-8 h-8 rounded-full object-cover shrink-0"
                            />
                        ) : (
                            <div className="w-8 h-8 rounded-full bg-[var(--color-gray)] flex items-center justify-center shrink-0">
                                <CircleUser size={30} />
                            </div>
                        )}
                        <div className="min-w-0">
                            <p className="text-sm text-white capitalize truncate">{user}</p>
                            <p className="text-xs text-[var(--color-gray-light)] capitalize">
                                {role.replace(/_/g, ' ')}
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 text-sm bg-[var(--color-danger)]/10
                                   text-[var(--color-danger)] hover:border-l-4
                                   hover:text-[var(--color-white)] transition-all duration-200 px-3 py-2
                                   rounded-md hover:bg-[var(--color-danger)]/50
                                   border-l-[var(--color-danger)] w-full"
                    >
                        <LogOut size={16} />
                        Déconnexion
                    </button>
                </div>
            </aside>
        </>
    );
}

Sidebar.propTypes = {
    role: PropTypes.string.isRequired,
    user: PropTypes.string.isRequired,
    isOpen: PropTypes.bool.isRequired,
    setIsOpen: PropTypes.func.isRequired,
    org: PropTypes.object,
    orgs: PropTypes.array,
    orgUuid: PropTypes.string,
    onSwitchOrg: PropTypes.func,
};

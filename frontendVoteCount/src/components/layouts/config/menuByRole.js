// config/menuByRole.js

import {
    Building2, CreditCard, FileText, Users,
    Bell, ShieldAlert, Vote, ChartLine,
    UserCheck, Settings, CircleDollarSign,
    UserCog, Notebook, LayoutDashboard,
    User,
    Trash2, Wallet, ShieldCheck
} from 'lucide-react';

export const menuByRole = {
    super_admin: {
        base: '/super-admin',
        menu: [
            { name: 'Tableau de bord', icon: LayoutDashboard, path: '' },
            { name: 'Organisations', icon: Building2, path: 'organisations' },
            { name: 'Elections', icon: Vote, path: 'elections' },
            { name: 'Categories', icon: Notebook, path: 'categories' },
            { name: 'Abonnements', icon: CreditCard, path: 'subscriptions' },
            { name: 'Retraits', icon: Wallet, path: 'withdrawals' },
            { name: 'Vérifications KYC', icon: ShieldCheck, path: 'kyc' },
            { name: 'Gestion des admins', icon: Users, path: 'admins' },
            { name: 'Utilisateurs', icon: Users, path: 'users' },
            { name: 'Journaux d’audit', icon: FileText, path: 'audit-logs' },
            { name: 'Notifications', icon: Bell, path: 'notifications' },
            { name: 'Alertes de sécurité', icon: ShieldAlert, path: 'security' },
            { name: "Corbeille", icon: Trash2, path: 'corbeille' },
            { name: 'Telescope', icon: FileText, path: 'telescope' },
            { name: 'Paramètres', icon: Settings, path: 'settings' },
        ]
    },

    jury: {
        base: '/jury',
        menu: [
            { name: 'Tableau de bord', icon: LayoutDashboard, path: '' },
            { name: 'Mes scrutins', icon: Vote, path: 'scrutins' },
            { name: 'Candidatures', icon: Users, path: 'candidats' },
            { name: "Resultats", icon: ChartLine, path: 'results' },
            { name: 'Paramètres', icon: Settings, path: 'settings' },
        ]
    },

    manager: {
        base: '/manager',
        menu: [
            { name: 'Tableau de bord', icon: LayoutDashboard, path: '' },
            { name: 'Mes scrutins', icon: Vote, path: 'scrutins' },
            { name: 'Candidats', icon: Users, path: 'candidats' },
            { name: 'Résultats', icon: ChartLine, path: 'results' },
            { name: 'Paramètres', icon: Settings, path: 'settings' },
        ]
    },

    organization_owner: {
        base: '/org',
        menu: [
            { name: 'Tableau de bord', icon: LayoutDashboard, path: '' },
            { name: 'Scrutins', icon: Vote, path: 'scrutins' },
            { name: 'Candidatures', icon: Users, path: 'candidats' },
            { name: 'Jurys', icon: UserCog, path: 'jurys' },
            { name: 'Équipe', icon: Users, path: 'equipe' },
            { name: 'Électeurs', icon: UserCheck, path: 'electeurs' },
            { name: 'Résultats', icon: ChartLine, path: 'results' },
            { name: 'Revenus', icon: CircleDollarSign, path: 'revenus' },
            { name: "Audit logs", icon: FileText, path: 'audit-logs' },
            { name: 'Abonnements', icon: CreditCard, path: 'setting/subscription' },
            { name: "Corbeille", icon: Trash2, path: 'corbeille' },
            { name: "Paramètres", icon: Settings, path: 'settings' },
        ]
    },

    user: {
        base: '/voter',
        menu: [
            { name: 'Tableau de bord', icon: LayoutDashboard, path: '' },
            { name: 'Mes scrutins', icon: Vote, path: 'scrutins' },
            { name: 'Paramètres', icon: Settings, path: 'settings' },
        ]
    },
    candidat: {
        base: '/candidat',
        menu: [
            { name: 'Tableau de bord', icon: LayoutDashboard, path: '' },
            { name: 'Mes scrutins', icon: Vote, path: 'scrutins' },
            { name: "Resultats", icon: ChartLine, path: 'results' },
            { name: "Mes Candidatures", icon: User, path: 'candidatures' },
            { name: 'Paramètres', icon: Settings, path: 'settings' },
        ]
    },
};

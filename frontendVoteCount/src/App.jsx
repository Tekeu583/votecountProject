// src/App.jsx

import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import AuthProvider from './context/AuthProvider';
import ProtectedRoute from './components/ProtectedRoute';
import VoterSessionProvider from './context/VoterSessionProvider';

// ── Layouts ───────────────────────────────────────────────────────
import Navbar from './components/layouts/Navbar';
import DashboardLayout from './components/layouts/DashboardLayout';
import Layout from './layout/Layout';

// ── Pages publiques ───────────────────────────────────────────────
import Home from './pages/Home';
import DemoPage from './pages/DemoPage';
import CommencerAujourdhui from './pages/CommencerAujourdhui';
import ContactPage from './pages/ContactPage';
import TarificationPage from './pages/TarificationPage';

import AccesScrutin from './pages/VotePrivate/AccesScrutin';
import ConfirmAccess from './pages/VotePrivate/ConfirmAccess';
import ElectionCandidats from './pages/VotePrivate/ElectionCandidats';
import CandidateDetails from './pages/VotePrivate/CandidateDetails';
import VoteValidation from './pages/VotePrivate/VoteValidation';
import VoteSuccess from './pages/VoteSuccess';


import Checkout from './pages/Checkout';
import PaymentSuccess from './pages/PaymentSuccess';
import CandidateApplicationPage from './pages/CandidateApplicationPage';
import UnauthorizedPage from './pages/UnauthorizedPage';
import VerifyEmailPage from './pages/auth/Verifyemailpage';
import ResetPasswordPage from './pages/auth/Resetpasswordpage';
// ── Auth ──────────────────────────────────────────────────────────
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';

// ── Vote public ───────────────────────────────────────────────────
import HomeElection from './pages/votePublic/HomeElection';
import PortailVote from './pages/votePublic/PortailVote';
import CandidateDetailsPublic from './pages/votePublic/CandidateDetailsPublic';
import VotePayment from './pages/votePublic/VotePayment';

// ── Super Admin ───────────────────────────────────────────────────
import DashboardSuperHome from './pages/dashboards/DashboardSuperAdmin/DashboardSuperHome';
import OrganisationsPage from './pages/dashboards/DashboardSuperAdmin/OrganisationsPage';
import SubscriptionsPage from './pages/dashboards/DashboardSuperAdmin/SubscriptionsPage';
import AuditLogsPage from './pages/dashboards/DashboardSuperAdmin/AuditLogsPage';
import AdminsPage from './pages/dashboards/DashboardSuperAdmin/AdminsPage';
import NotificationsPage from './pages/dashboards/DashboardSuperAdmin/NotificationsPage';
import SecurityPage from './pages/dashboards/DashboardSuperAdmin/SecurityPage';
import SettingsPage from './pages/dashboards/DashboardSuperAdmin/SettingsPage';
import Users from './pages/dashboards/DashboardSuperAdmin/Users';
import ElectionsPage from './pages/dashboards/DashboardSuperAdmin/ElectionsPage';
import CorbeillePage from './pages/dashboards/DashboardSuperAdmin/CorbeillePage';
import CategoriePage from './pages/dashboards/DashboardSuperAdmin/CategoriePage';
import TelescopePage from './pages/dashboards/DashboardSuperAdmin/TelescopePage';

// ── Admin Organisation ────────────────────────────────────────────
import DashboardHome from './pages/dashboards/DashboardAdminOrg/DashboardHome';
import AuditLogs from './pages/dashboards/DashboardAdminOrg/AuditLogs';
import Candidats from './pages/dashboards/DashboardAdminOrg/Candidats';
import Parametres from './pages/dashboards/DashboardAdminOrg/Parametres';
import SubscriptionPage from './pages/dashboards/DashboardAdminOrg/SubscriptionPage';
import Electeurs from './pages/dashboards/DashboardAdminOrg/Electeurs';
import Jurys from './pages/dashboards/DashboardAdminOrg/Jurys';
import Resultats from './pages/dashboards/DashboardAdminOrg/Resultats';
import Revenus from './pages/dashboards/DashboardAdminOrg/Revenus';
import Scrutins from './pages/dashboards/DashboardAdminOrg/Scrutins';
import CreateScrutin from './pages/dashboards/DashboardAdminOrg/CreateScrutin';
import Corbeille from './pages/dashboards/DashboardAdminOrg/Corbeille';

// ── Candidat ──────────────────────────────────────────────────────
import CandidateDashboard from './pages/dashboards/DashboardCandidat/CandidateDashboard';
import ScrutinsCandidat from './pages/dashboards/DashboardCandidat/Scrutins';
import ResultatsCandidat from './pages/dashboards/DashboardCandidat/Resultats';
import ParametresCandidat from './pages/dashboards/DashboardCandidat/Parametres';
import Candidatures from './pages/dashboards/DashboardCandidat/Candidatures';

// ── Jury ──────────────────────────────────────────────────────────
import DashboardJury from './pages/dashboards/DashboardJury/DashboardJury';
import ScrutinsJury from './pages/dashboards/DashboardJury/ScrutinsJury';
import ParametresJury from './pages/dashboards/DashboardJury/ParametresJury';
import CandidatsJury from './pages/dashboards/DashboardJury/CandidatsJury';
import EvaluationsJury from './pages/dashboards/DashboardJury/EvaluationsJury';
import ResultatsJury from './pages/dashboards/DashboardJury/ResultatsJury';
import CentersDetails from './components/dashboard/CentersDetails';

import './App.css';
import { ROLES } from '@utils/roles';
// ─────────────────────────────────────────────────────────────────
// CONSTANTES DE RÔLES
// Centralisées ici pour éviter les fautes de frappe dans les routes.
// ─────────────────────────────────────────────────────────────────

// Préfixes de routes où la Navbar publique est cachée
const NO_NAVBAR_PREFIXES = ['/super-admin', '/admin', '/jury', '/org', '/candidat', '/vote'];

// ─────────────────────────────────────────────────────────────────
// APP
// ─────────────────────────────────────────────────────────────────

function AppRoutes() {
    const location = useLocation();

    const showNavbar = !NO_NAVBAR_PREFIXES.some((prefix) =>
        location.pathname.startsWith(prefix)
    );

    return (
        <>
            {showNavbar && <Navbar />}

            <Toaster
                position="top-right"
                reverseOrder={false}
                gutter={8}
                containerStyle={{ top: 80, right: 20 }}
            />

            <Routes>

                {/* ── ROUTES PUBLIQUES ─────────────────────────── */}
                <Route path="/" element={<Layout />}>
                    <Route index element={<Home />} />
                    <Route path="auth/login" element={<LoginPage />} />
                    <Route path="auth/register" element={<RegisterPage />} />
                    <Route path="auth/forgot-password" element={<ForgotPasswordPage />} />
                    <Route path="demo" element={<DemoPage />} />
                    <Route path="inscription" element={<CommencerAujourdhui />} />
                    <Route path="contact" element={<ContactPage />} />
                    <Route path="pricing" element={<TarificationPage />} />

                    <Route path="elections" element={<HomeElection />} />
                    <Route path="elections/:electionUuid" element={<PortailVote />} />
                    <Route path="elections/:electionUuid/candidates" element={<CandidateApplicationPage />} />
                    <Route path="details/candidat/election/:electionUuid/candidate/:candidateUuid" element={<CandidateDetailsPublic />} />

                    <Route path="vote" element={<AccesScrutin />} />
                    <Route path="vote/private/:electionUuid/confirm-access" element={<ConfirmAccess />} />
                    <Route path="vote/private/:electionUuid/candidates" element={<ElectionCandidats />} />
                    <Route path="vote/private/:electionUuid/confirm" element={<VoteValidation />} />
                    <Route path="details/:id" element={<CandidateDetails />} />

                    <Route path="vote/success/:electionUuid" element={<VoteSuccess />} />
                    <Route path="vote/validate/:id" element={<VoteValidation />} />
                    <Route path="vote/payement/:electionUuid/candidate/:candidateUuid" element={<VotePayment />} />
                    <Route path="checkout" element={<Checkout />} />
                    <Route path="vote/payment-success/:electionUuid/candidate/:candidateUuid" element={<PaymentSuccess />} />

                    <Route path="auth/verify-email" element={<VerifyEmailPage />} />
                    <Route path="auth/reset-password" element={<ResetPasswordPage />} />
                    {/* Page 403 — accessible sans auth pour afficher un message propre */}
                    <Route path="unauthorized" element={<UnauthorizedPage />} />
                </Route>

                {/* ── SUPER ADMIN ──────────────────────────────── */}
                {/*
                 * DashboardLayout gère loading + authenticated.
                 * ProtectedRoute ajoute la vérification de rôle.
                 * Les deux sont nécessaires : DashboardLayout évite le flash
                 * de redirection, ProtectedRoute bloque les mauvais rôles.
                 */}
                <Route
                    path="/super-admin"
                    element={
                        <ProtectedRoute requiredRoles={[ROLES.SUPER_ADMIN]}>
                            <DashboardLayout />
                        </ProtectedRoute>
                    }
                >
                    <Route index element={<DashboardSuperHome />} />
                    <Route path="organisations" element={<OrganisationsPage />} />
                    <Route path="subscriptions" element={<SubscriptionsPage />} />
                    <Route path="audit-logs" element={<AuditLogsPage />} />
                    <Route path="admins" element={<AdminsPage />} />
                    <Route path="users" element={<Users />} />
                    <Route path="elections" element={<ElectionsPage />} />
                    <Route path="categories" element={<CategoriePage />} />
                    <Route path="notifications" element={<NotificationsPage />} />
                    <Route path="security" element={<SecurityPage />} />
                    <Route path="corbeille" element={<CorbeillePage />} />
                    <Route path="settings" element={<SettingsPage />} />
                    <Route path="telescope" element={<TelescopePage />} />
                </Route>

                {/* ── ADMIN ORGANISATION ───────────────────────── */}
                <Route
                    path="/org"
                    element={
                        <ProtectedRoute requiredRoles={[ROLES.ADMIN_ORG, ROLES.SUPER_ADMIN]}>
                            <DashboardLayout />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/org/:orgUuid"
                    element={
                        <ProtectedRoute requiredRoles={[ROLES.ADMIN_ORG]}>
                            <DashboardLayout />
                        </ProtectedRoute>
                    }
                >
                    <Route index element={<DashboardHome />} />
                    <Route path="audit-logs" element={<AuditLogs />} />
                    <Route path="candidats" element={<Candidats />} />
                    <Route path="electeurs" element={<Electeurs />} />
                    <Route path="jurys" element={<Jurys />} />
                    <Route path="scrutins" element={<Scrutins />} />
                    <Route path="CreateScrutin" element={<CreateScrutin />} />
                    <Route path="results" element={<Resultats />} />
                    <Route path="revenus" element={<Revenus />} />
                    <Route path="corbeille" element={<Corbeille />} />
                    <Route path="settings" element={<Parametres />} />
                    <Route path="setting/subscription" element={<SubscriptionPage />} />
                </Route>

                {/* ── JURY ─────────────────────────────────────── */}
                <Route
                    path="/jury"
                    element={
                        <ProtectedRoute requiredRoles={[ROLES.JURY, ROLES.SUPER_ADMIN]}>
                            <DashboardLayout />
                        </ProtectedRoute>
                    }
                >
                    <Route index element={<DashboardJury />} />
                    <Route path="scrutins" element={<ScrutinsJury />} />
                    <Route path="settings" element={<ParametresJury />} />
                    <Route path="candidats/:id?" element={<CandidatsJury />} />
                    <Route path="candidats/:id/evaluations/:id" element={<EvaluationsJury />} />
                    <Route path="results/:id?" element={<ResultatsJury />} />
                </Route>

                {/* ── CANDIDAT ─────────────────────────────────── */}
                <Route
                    path="/candidat"
                    element={
                        <ProtectedRoute requiredRoles={[ROLES.CANDIDAT, ROLES.SUPER_ADMIN]}>
                            <DashboardLayout />
                        </ProtectedRoute>
                    }
                >
                    <Route index element={<CandidateDashboard />} />
                    <Route path="scrutins" element={<ScrutinsCandidat />} />
                    <Route path="results/:id?" element={<ResultatsCandidat />} />
                    <Route path="candidatures" element={<Candidatures />} />
                    <Route path="settings" element={<ParametresCandidat />} />
                    <Route path="results/:id/centers" element={<CentersDetails />} />
                </Route>

                {/* ── FALLBACK ─────────────────────────────────── */}
                <Route path="*" element={<Navigate to="/" replace />} />

            </Routes>
        </>
    );
}

// AuthProvider enveloppe AppRoutes pour que useAuth soit disponible
// dans Navbar, ProtectedRoute, et tous les composants enfants.
function App() {
    return (
        <AuthProvider>
            <VoterSessionProvider>
                <AppRoutes />
            </VoterSessionProvider>
        </AuthProvider>
    );
}

export default App;
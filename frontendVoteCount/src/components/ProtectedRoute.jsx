// src/components/ProtectedRoute.jsx
//
// Guard de route universel.
// Gère trois niveaux de protection dans l'ordre :
//   1. Authentification (loading → authenticated)
//   2. Rôle(s) requis   (requiredRoles)
//   3. Permission(s) requise(s) (requiredPermissions)
//
// USAGE :
//
//   // Authentification seulement
//   <ProtectedRoute><Dashboard /></ProtectedRoute>
//
//   // Rôle requis
//   <ProtectedRoute requiredRoles={['super_admin']}>
//     <AdminPage />
//   </ProtectedRoute>
//
//   // Permission requise
//   <ProtectedRoute requiredPermissions={['manage users']}>
//     <UsersPage />
//   </ProtectedRoute>
//
//   // Plusieurs rôles acceptés (OR)
//   <ProtectedRoute requiredRoles={['super_admin', 'admin_org']}>
//     <SharedPage />
//   </ProtectedRoute>

import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@hooks/useAuth';
import { useRole } from '@hooks/useRole';
import { usePermission } from '@hooks/usePermission';

export default function ProtectedRoute({
    children,
    requiredRoles       = [],   // Au moins un de ces rôles (OR)
    requiredPermissions = [],   // Au moins une de ces permissions (OR)
    requireAllPermissions = false, // true = toutes les permissions (AND)
}) {
    const { loading, authenticated } = useAuth();
    const { hasRole }                = useRole();
    const { can, canAny, canAll }    = usePermission();
    const location                   = useLocation();

    // ── 1. LOADING ────────────────────────────────────────────────
    // Attendre la fin de checkAuth() — évite le flash de redirection.
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--color-background-white)]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm text-[var(--color-gray)]">Chargement...</p>
                </div>
            </div>
        );
    }

    // ── 2. AUTHENTIFICATION ───────────────────────────────────────
    // Sauvegarde la route cible pour rediriger après login.
    if (!authenticated) {
        return (
            <Navigate
                to="/auth/login"
                state={{ from: location.pathname }}
                replace
            />
        );
    }

    // ── 3. RÔLE ───────────────────────────────────────────────────
    // Si des rôles sont requis, l'utilisateur doit en avoir au moins un.
    if (requiredRoles.length > 0 && !hasRole(requiredRoles)) {
        return <Navigate to="/unauthorized" replace />;
    }

    // ── 4. PERMISSION ─────────────────────────────────────────────
    if (requiredPermissions.length > 0) {
        const allowed = requireAllPermissions
            ? canAll(requiredPermissions)
            : canAny(requiredPermissions);

        if (!allowed) {
            return <Navigate to="/unauthorized" replace />;
        }
    }

    return children;
}
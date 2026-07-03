// src/pages/UnauthorizedPage.jsx

import { useNavigate } from 'react-router-dom';
import { ShieldX } from 'lucide-react';
import { useAuth } from '@hooks/useAuth';
import { useRole } from '@hooks/useRole';
import { getRoleDefaultRoute } from '@utils/roleRoutes';

export default function UnauthorizedPage() {
    const navigate    = useNavigate();
    const { user }    = useAuth();
    const { primaryRole } = useRole();

    const handleGoBack = () => {
        // Redirige vers le dashboard du rôle courant, pas vers "/"
        // Un super_admin redirigé vers "/" verrait la landing page — confus.
        if (primaryRole) {
            navigate(getRoleDefaultRoute(primaryRole), { replace: true });
        } else {
            navigate('/login', { replace: true });
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--color-background-white)] px-4">
            <div className="max-w-md w-full text-center">

                <div className="flex justify-center mb-6">
                    <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center">
                        <ShieldX size={40} className="text-[var(--color-danger)]" />
                    </div>
                </div>

                <h1 className="text-3xl font-bold text-[var(--color-dark)] mb-2">
                    Accès refusé
                </h1>

                <p className="text-[var(--color-gray)] mb-2">
                    Vous n'avez pas les droits nécessaires pour accéder à cette page.
                </p>

                {user && (
                    <p className="text-sm text-[var(--color-gray)] mb-8">
                        Connecté en tant que{' '}
                        <span className="font-semibold text-[var(--color-dark)]">
                            {user.full_name || `${user.first_name} ${user.last_name}`}
                        </span>
                        {primaryRole && (
                            <> · <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded">{primaryRole}</span></>
                        )}
                    </p>
                )}

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                        onClick={handleGoBack}
                        className="
                            px-6 py-2.5 rounded-[var(--radius-md)]
                            bg-[var(--color-primary)] text-white
                            hover:bg-[var(--color-primary-hover)] transition
                            font-medium text-sm
                        "
                    >
                        Retour à ma page
                    </button>

                    <button
                        onClick={() => navigate(-1)}
                        className="
                            px-6 py-2.5 rounded-[var(--radius-md)]
                            border border-[var(--color-gray-light)]
                            text-[var(--color-dark)] hover:bg-gray-50 transition
                            font-medium text-sm
                        "
                    >
                        Page précédente
                    </button>
                </div>

            </div>
        </div>
    );
}
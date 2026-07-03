import { useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { CheckCircle, Home, ShieldCheck, ChevronLeft } from 'lucide-react';
import MiniFooter from '@components/layouts/Minifooter';
import Logo from '@components/Logo';

const VoteSuccess = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const states = location.state || {};

    const {
        electionTitle = states.electionTitle || 'Élection',
        candidateName = states.candidate?.full_name || 'Candidat',
        candidatePhoto = states.candidate?.photo || null,
        receiptCode = states.receiptCode || null,
        electionUuid = states.electionUuid || null,
    } = states;


    useEffect(() => {
        const hasData = states.electionTitle || states.candidate?.full_name || states.candidateName;
        const hasParams = window.location.search.includes('election=');

        if (!hasData && !hasParams) {
            navigate('/elections', { replace: true });
        }
    }, [states, navigate]);

    // Si pas de données, afficher un message de chargement
    if (!states.electionTitle && !states.candidate?.full_name && !states.candidateName) {
        return (
            <div className="bg-[var(--color-background-white)] pt-18 flex items-center justify-center p-4 min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-primary)] mx-auto mb-4"></div>
                    <p className="text-gray-600">Chargement...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-[var(--color-background-white)] pt-18 flex items-center justify-center p-4 min-h-screen">
            <div className="max-w-md w-full">
                <div className="bg-white rounded-2xl shadow-xl p-8 md:p-10 text-center">

                    <div className="flex justify-center mb-6">
                        <Logo />
                    </div>

                    {/* Icône succès */}
                    <div className="mx-auto w-20 h-20 rounded-full bg-green-50 flex items-center justify-center mb-6">
                        <CheckCircle size={44} className="text-green-500" />
                    </div>

                    <h1 className="text-2xl font-bold text-[var(--color-dark)] mb-2">
                        Vote enregistré !
                    </h1>
                    <p className="text-[var(--color-gray)] text-sm mb-8">
                        Votre participation à <strong className="text-[var(--color-dark)]">{electionTitle}</strong> a bien été prise en compte.
                    </p>

                    {/* Candidat voté */}
                    <div className="flex items-center gap-4 bg-gray-50 rounded-[var(--radius-md)] p-4 mb-6 text-left">
                        <div className="w-14 h-14 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                            {candidatePhoto
                                ? <img
                                    src={candidatePhoto}
                                    alt={candidateName}
                                    className="w-full h-full object-cover"
                                />
                                : <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-gray-300">
                                    {candidateName?.[0]}
                                </div>
                            }
                        </div>
                        <div>
                            <p className="text-xs text-[var(--color-gray)]">Vous avez voté pour</p>
                            <p className="font-semibold text-[var(--color-dark)]">{candidateName}</p>
                        </div>
                    </div>

                    {/* Code de reçu */}
                    {receiptCode && (
                        <div className="bg-blue-50 border border-blue-200 rounded-[var(--radius-md)] p-4 mb-6">
                            <p className="text-xs text-[var(--color-gray)] mb-1 flex items-center justify-center gap-1">
                                <ShieldCheck size={12} /> Code de vérification de votre vote
                            </p>
                            <p className="text-xl font-bold font-mono tracking-widest text-[var(--color-primary)]">
                                {receiptCode}
                            </p>
                            <p className="text-xs text-[var(--color-gray)] mt-1">
                                Conservez ce code pour vérifier votre vote ultérieurement.
                            </p>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-col gap-3">
                        {electionUuid ? (
                            <Link
                                to={`/elections/${electionUuid}`}
                                className="w-full btn-primary flex items-center justify-center gap-2"
                            >
                                <ChevronLeft size={16} /> Retour à l'élection
                            </Link>
                        ) : (
                            <Link
                                to="/elections"
                                className="w-full btn-primary flex items-center justify-center gap-2"
                            >
                                <Home size={16} /> Retour aux élections
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VoteSuccess;
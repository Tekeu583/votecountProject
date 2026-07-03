import { useMemo } from 'react';
import {
    Users, Award, TrendingUp, Search, RefreshCw, Eye, ChevronLeft, ChevronRight,
} from 'lucide-react';
import toast from 'react-hot-toast';
import TextInput from '@components/ui/TextInput';
import StatCard from '@components/dashboard/StatCard';
import { useNavigate, useSearchParams } from 'react-router-dom';

const JuryDashboard = () => {
    const [searchParams, setSearchParams] = useSearchParams();

    const search = searchParams.get('search') || '';
    const election = searchParams.get('election') || '';
    const status = searchParams.get('status') || '';
    const date = searchParams.get('date') || '';
    const currentPage = Number(searchParams.get('page')) || 1;

    const itemsPerPage = 6;

    const navigate = useNavigate();
    const elections = useMemo(() => [
        { id: 1, name: 'Élection Conseil Syndical', typeScrutin: 'Majoritaire', dateFermeture: '2026-05-30 18:30', status: 'En attente' },
        { id: 2, name: "Prix de l'Innovation 2026", typeScrutin: 'Classement', dateFermeture: '2026-05-15 18:30', status: 'En cours' },
        { id: 3, name: 'Direction Départementale', typeScrutin: 'Majoritaire', dateFermeture: '2026-04-30 18:30', status: 'En cours' },
        { id: 4, name: 'Comité Technique', typeScrutin: 'Proportionnel', dateFermeture: '2026-04-10 18:30', status: 'Terminé' },
        { id: 5, name: 'Élection Étudiante 2026', typeScrutin: 'Classement', dateFermeture: '2026-05-20 18:30', status: 'En cours' },
    ], []);

    const candidates = useMemo(() => [
        { id: 1, name: 'Fokam', avatar: 'https://i.pravatar.cc/150?u=fokam', electionId: 1, evaluated: false },
        { id: 2, name: 'Audrey', avatar: 'https://i.pravatar.cc/150?u=audrey', electionId: 1, evaluated: false },

        { id: 3, name: 'Tekeu Arsene', avatar: 'https://i.pravatar.cc/150?u=tekeu', electionId: 2, evaluated: false },
        { id: 4, name: 'Gertrude Valérie', avatar: 'https://i.pravatar.cc/150?u=gertrude', electionId: 2, evaluated: false },
        { id: 5, name: 'Muriel Rose', avatar: 'https://i.pravatar.cc/150?u=muriel', electionId: 2, evaluated: false },

        { id: 6, name: 'Latalle Pradier', avatar: 'https://i.pravatar.cc/150?u=pradier', electionId: 3, evaluated: false },
        { id: 7, name: 'Valérie NG', avatar: 'https://i.pravatar.cc/150?u=valerie', electionId: 3, evaluated: false },

        { id: 8, name: 'Benedict', avatar: 'https://i.pravatar.cc/150?u=benedict', electionId: 4, evaluated: true },
        { id: 9, name: 'Fortune', avatar: 'https://i.pravatar.cc/150?u=fortune', electionId: 4, evaluated: true },

        { id: 10, name: 'Kevin Ndzi', avatar: 'https://i.pravatar.cc/150?u=kevin', electionId: 5, evaluated: false },
        { id: 11, name: 'Sonia Mballa', avatar: 'https://i.pravatar.cc/150?u=sonia', electionId: 5, evaluated: false },
        { id: 12, name: 'Junior Ekani', avatar: 'https://i.pravatar.cc/150?u=junior', electionId: 5, evaluated: false },
    ], []);
    const statuses = ['Toutes', 'En attente', 'En cours', 'Terminé'];

    const enrichedCandidates = useMemo(() => {
        const now = new Date();
        return candidates.map(c => {
            const election = elections.find(e => e.id === c.electionId);
            const closingDate = new Date(election?.dateFermeture);

            const isClosed = closingDate < now;
            const isUrgent =
                !c.evaluated &&
                !isClosed &&
                (closingDate - now) / (1000 * 60 * 60 * 24) <= 2; // <= 2 jours

            return {
                ...c,
                electionName: election?.name,
                status: election?.status,
                dateFermeture: election?.dateFermeture,
                isClosed,
                isUrgent,
            };
        });
    }, [candidates, elections]);

    const filteredCandidates = useMemo(() => {
        return enrichedCandidates.filter(c => {
            return (
                (!search || c.name.toLowerCase().includes(search.toLowerCase())) &&
                (!election || String(c.electionId) === election) &&
                (!status || c.status === status) &&
                (!date || c.dateFermeture === date)
            );
        });
    }, [search, election, status, date, enrichedCandidates]);

    const totalPages = Math.ceil(filteredCandidates.length / itemsPerPage);
    const paginatedCandidates = filteredCandidates.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const goToPage = (newPage) => {
        if (newPage < 1 || newPage > totalPages) return;

        const params = new URLSearchParams(searchParams);
        if (newPage > 1) {
            params.set('page', newPage);
        } else {
            params.delete('page');
        }
        setSearchParams(params);
    };
    const updateParams = (newParams) => {
        const params = new URLSearchParams(searchParams);

        Object.entries(newParams).forEach(([key, value]) => {
            if (value) params.set(key, value);
            else params.delete(key);
        });
        params.set('page', 1);

        setSearchParams(params);
    };
    const resetFilters = () => {
        setSearchParams({});
        toast.success('Filtres réinitialisés');
    };

    const candidatesToEvaluate = useMemo(() => {
        return filteredCandidates.filter(c =>
            !c.evaluated &&
            !c.isClosed &&
            c.status === 'En cours'
        );
    }, [filteredCandidates]);

    const evaluatedCandidates = useMemo(() => {
        return filteredCandidates.filter(c => c.evaluated);
    }, [filteredCandidates]);

    const progress = useMemo(() => {
        const total = filteredCandidates.length;
        const done = evaluatedCandidates.length;

        return total ? Math.round((done / total) * 100) : 0;
    }, [filteredCandidates, evaluatedCandidates]);

    const urgentCandidates = useMemo(() => {
        return candidatesToEvaluate.filter(c => c.isUrgent);
    }, [candidatesToEvaluate]);

    const nearestDeadline = useMemo(() => {
        const dates = candidatesToEvaluate.map(c => new Date(c.dateFermeture));
        return dates.length ? new Date(Math.min(...dates)) : null;
    }, [candidatesToEvaluate]);

    const trendText = nearestDeadline
        ? `Clôture proche : ${nearestDeadline.toLocaleDateString()}`
        : 'Aucune action urgente';

    const variantClasses = {
        primary: 'btn-primary',
        default: 'btn-secondary',
        warning: 'btn-secondary bg-[var(--color-warning)]/20 disabled:outline-none text-[var(--color-warning)]',
        success: 'btn-secondary text-[var(--color-success)]! hover:border-[var(--color-success)]!',
    };
    const getActionConfig = (candidate) => {
        const { status, evaluated } = candidate;

        switch (status) {
            case 'Terminé':
                return {
                    label: 'Clôturé',
                    disabled: true,
                    variant: 'success',
                };

            case 'En attente':
                return {
                    label: 'En attente',
                    disabled: true,
                    variant: 'warning',
                };

            case 'En cours':
                if (evaluated) {
                    return {
                        label: 'Déjà évalué',
                        disabled: true,
                        variant: 'default',
                    };
                }

                return {
                    label: 'Évaluer',
                    disabled: false,
                    variant: 'primary',
                };

            default:
                return null;
        }
    };
    const handleEvaluate = (candidate) => {
        navigate(`/jury/candidats/${candidate.electionId}/evaluations/${candidate.id}`, { state: { candidate } });
    };

    return (
        <div className="flex-1 bg-[var(--color-background-white)] p-4 ">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8 lg:mb-10">
                    <h1 className="text-2xl lg:text-3xl font-bold text-[var(--color-dark)]">Tableau de bord Jury</h1>
                    <p className="text-gray-600 mt-1">Bienvenue sur votre espace de vote professionnel.</p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1  sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8 lg:mb-10">
                    <StatCard icon={Users} title="SCRUTINS ASSIGNÉS" value={elections.length} trend={`↑2 • Il y a 2h`} />
                    <StatCard icon={Award} title="CANDIDATS À ÉVALUER" value={candidatesToEvaluate.length} trend={`${urgentCandidates.length} urgents • ${candidatesToEvaluate.length} à traiter`} borderColor={'[var(--color-success)]'} delay={150} />
                    <StatCard icon={Users} title="URGENT" value={urgentCandidates.length} trend={trendText} borderColor={'[var(--color-danger)]'} className={'!text-[var(--color-danger)]'} delay={250} />
                    <StatCard icon={TrendingUp} title="PROGRESSION GLOBALE" value={`${progress}%`} trend={`${evaluatedCandidates.length} évalués`} borderColor={'[var(--color-success)]'} delay={350} />
                </div>

                {/* Candidats à évaluer */}
                <div className="bg-[var(--color-white)] rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-4 lg:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">

                        {/* Filtres - Responsive */}
                        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto lg:items-end">
                            <div className="gap-2">
                                <TextInput
                                    label="Rechercher"
                                    iconLeft={Search}
                                    placeholder="Rechercher un candidat..."
                                    value={search}
                                    onChange={(e) => {
                                        updateParams({ search: e.target.value });

                                    }}
                                    className="w-full lg:w-80"
                                />
                            </div>
                            <div className="gap-2">
                                <label htmlFor="electionFilter" className="block text-sm font-medium text-gray-700 mb-1">
                                    Élections
                                </label>
                                <select
                                    id="electionFilter"
                                    value={election}
                                    onChange={(e) => {
                                        updateParams({ election: e.target.value });

                                    }}
                                    className="border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 w-full lg:w-auto"
                                >
                                    <option value="">Toutes les elections</option>
                                    {elections.map(el => <option key={el.id} value={el.id}>{el.name}</option>)}
                                </select>
                            </div>

                            <div className="gap-2">
                                <label htmlFor="statusFilter" className="block text-sm font-medium text-gray-700 mb-1">
                                    Statut
                                </label>
                                <select
                                    id="statusFilter"
                                    value={status}
                                    onChange={(e) => {
                                        updateParams({ status: e.target.value });

                                    }}
                                    className="border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 w-full lg:w-auto"
                                >
                                    {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>

                            <div className="gap-2">
                                <TextInput
                                    type="date"
                                    label="Date de fermeture"
                                    value={date}
                                    onChange={(e) => {
                                        updateParams({ date: e.target.value });

                                    }}
                                    className="w-full lg:w-44"
                                />
                            </div>
                            <button
                                onClick={resetFilters}
                                className="flex items-center gap-2 px-5 py-3 btn-secondary text-sm font-medium whitespace-nowrap h-[46px]"
                            >
                                <RefreshCw size={18} />
                                Réinitialiser
                            </button>
                        </div>
                    </div>

                    {/* Tableau */}
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[850px]">
                            <thead className="bg-gray-50 border-b border-b-[var(--color-gray-light)]">
                                <tr className="text-xm uppercase text-[var(--color-dark)]">
                                    <th className="text-left px-3 py-2 font-medium">CANDIDAT</th>
                                    <th className="text-left px-3 py-2 font-medium">Election</th>
                                    <th className="text-left px-3 py-2 font-medium">DATE DE FERMETURE</th>
                                    <th className="text-left px-3 py-2 font-medium">STATUT</th>
                                    <th className="text-left px-3 py-2 font-medium">ACTION</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--color-gray-light)]">
                                {paginatedCandidates.map((candidate) => {
                                    const action = getActionConfig(candidate);
                                    return (
                                        <tr key={candidate.id} className={` transition ${candidate.isUrgent
                                            ? 'bg-red-100 hover:bg-red-200  border-l-4 border-l-red-600 rounded-l-[var(--radius-md)]'
                                            : 'hover:bg-[var(--color-gray-light)]  duration-300 ease-in-out'
                                            }`}>
                                            <td className="px-3 py-2">
                                                <div className="flex items-center gap-3">
                                                    <img
                                                        src={candidate.avatar}
                                                        alt={candidate.name}
                                                        className="w-10 h-10 rounded-full object-cover border border-gray-200"
                                                    />
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium text-gray-900">
                                                            {candidate.name}
                                                        </span>

                                                        {candidate.isUrgent && (
                                                            <span className="text-xs text-red-600 font-semibold bg-red-100 px-2 py-0.5 rounded-full">
                                                                URGENT
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-3 py-2 text-gray-700">{candidate.electionName}</td>
                                            <td className="px-3 py-2 text-gray-600 font-mono text-sm">
                                                {candidate.dateFermeture}
                                            </td>
                                            <td className="px-3 py-2">
                                                <span className={`inline-flex px-4 py-1 text-xs font-medium rounded-full whitespace-nowrap ${candidate.status === 'En attente' ? 'bg-amber-100 text-amber-700' :
                                                    candidate.status === 'En cours' ? 'bg-blue-100 text-blue-700' :
                                                        'bg-emerald-100 text-emerald-700'
                                                    }`}>
                                                    {candidate.status}
                                                </span>
                                            </td>
                                            <td className="px-3 py-2 text-right">
                                                {action && (
                                                    <button
                                                        disabled={action.disabled}
                                                        onClick={
                                                            action.disabled
                                                                ? undefined : () => handleEvaluate(candidate)
                                                        }
                                                        className={`
                                                                    ${variantClasses[action.variant]}
                                                                    text-sm font-medium flex items-center gap-2 transition-all
                                                                    disabled:cursor-not-allowed
                                                                `}
                                                    >
                                                        <Eye size={18} />
                                                        {action.label}
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    )
                                })}

                                {paginatedCandidates.length === 0 && (
                                    <tr>
                                        <td colSpan="5" className="p-20 text-center text-gray-500">
                                            Aucun candidat trouvé avec ces critères
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="flex flex-col lg:flex-row justify-between items-center px-3 py-2 text-sm gap-3">
                        <span className="text-[var(--color-gray)]">
                            Affichage de {(currentPage - 1) * itemsPerPage + 1} à{" "}
                            {Math.min(currentPage * itemsPerPage, filteredCandidates.length)} sur{" "}
                            {filteredCandidates.length}
                        </span>
                        <div className="flex gap-2">
                            <button
                                disabled={currentPage === 1}
                                onClick={() => goToPage(currentPage - 1)}
                                className="px-3 py-1 btn-secondary rounded"><ChevronLeft size={16} /></button>
                            <span className="px-3 py-1 bg-[var(--color-primary)] text-white rounded">
                                {currentPage} / {totalPages || 1}
                            </span>
                            <button
                                disabled={currentPage >= totalPages}
                                onClick={() => goToPage(currentPage + 1)}
                                className="px-3 py-1 btn-secondary "><ChevronRight size={16} /></button>
                        </div>
                    </div>
                </div>
            </div>
        </div >
    );
};

export default JuryDashboard;
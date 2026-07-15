import { useMemo, useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Trophy, Medal, Search, Users, TrendingUp, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

import TextInput from '@components/ui/TextInput';
import StatCard from '@components/dashboard/StatCard';
import { staffApi, candidatesApi, resultsApi } from '@services/api';
import { FadeLoader } from 'react-spinners';

const ResultatsManager = () => {
    const { electionId } = useParams();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const search = searchParams.get('search') || '';
    const [currentPage, setCurrentPage] = useState(1);

    const [elections, setElections] = useState([]);
    const [loadingElections, setLoadingElections] = useState(true);
    const [results, setResults] = useState([]);
    const [loadingResults, setLoadingResults] = useState(false);
    const [notReady, setNotReady] = useState(false);
    const [recalculating, setRecalculating] = useState(false);

    useEffect(() => {
        const fetchElections = async () => {
            setLoadingElections(true);
            try {
                const res = await staffApi.getMyElections();
                setElections(res.data?.data ?? []);
            } catch {
                toast.error('Impossible de charger vos élections.');
            } finally {
                setLoadingElections(false);
            }
        };
        fetchElections();
    }, []);

    const currentElection = useMemo(() => elections.find((e) => e.uuid === electionId), [elections, electionId]);
    const getElectionTitle = useCallback((uuid) => elections.find((e) => e.uuid === uuid)?.title ?? '-', [elections]);

    const fetchResults = useCallback(async () => {
        if (!electionId) {
            setResults([]);
            setNotReady(false);
            return;
        }

        setLoadingResults(true);
        setNotReady(false);
        try {
            const [finalRes, candidatesRes] = await Promise.all([
                resultsApi.final(electionId).catch((err) => {
                    if (err.response?.status === 404 || err.response?.status === 403) return null;
                    throw err;
                }),
                candidatesApi.getAll(electionId).catch(() => ({ data: { data: [] } })),
            ]);

            if (!finalRes) {
                setResults([]);
                setNotReady(true);
                return;
            }

            const candidatesByUuid = Object.fromEntries(
                (candidatesRes.data?.data ?? []).map((c) => [c.uuid, c])
            );

            const rows = (finalRes.data?.data?.results ?? []).map((r) => ({
                uuid: r.candidate_uuid,
                name: candidatesByUuid[r.candidate_uuid]?.full_name ?? '—',
                photo: candidatesByUuid[r.candidate_uuid]?.photo,
                votes: r.total_votes ?? 0,
                percentage: r.percentage ?? 0,
            }));

            setResults(rows);
        } catch {
            toast.error('Impossible de charger les résultats.');
        } finally {
            setLoadingResults(false);
        }
    }, [electionId]);

    useEffect(() => {
        fetchResults();
    }, [fetchResults]);

    const handleRecalculate = async () => {
        if (!electionId) return;
        setRecalculating(true);
        try {
            await resultsApi.calculate(electionId);
            toast.success('Calcul des résultats lancé — actualisation dans quelques secondes...');
            setTimeout(() => {
                fetchResults();
                setRecalculating(false);
            }, 4000);
        } catch (error) {
            toast.error(error.response?.data?.message ?? 'Erreur lors du lancement du calcul.');
            setRecalculating(false);
        }
    };

    const filtered = useMemo(() => {
        return results
            .filter((c) => c.name.toLowerCase().includes(search.toLowerCase()))
            .sort((a, b) => b.votes - a.votes);
    }, [results, search]);

    const totalVotes = filtered.reduce((sum, r) => sum + r.votes, 0);

    const handleSearch = (value) => {
        const params = new URLSearchParams(searchParams);
        if (value) params.set('search', value);
        else params.delete('search');
        setSearchParams(params);
        setCurrentPage(1);
    };

    const itemsPerPage = 5;
    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    const paginatedResultat = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const resetFilters = () => {
        setSearchParams({});
        navigate('/manager/results');
        setCurrentPage(1);
    };

    if (loadingElections) {
        return (
            <div className="h-[calc(100vh-68px)] flex items-center justify-center">
                <FadeLoader color="#1e40af" cssOverride={{ display: 'block', margin: '0 auto' }} />
            </div>
        );
    }

    return (
        <div className="flex-1 bg-[var(--color-background-white)] p-4">
            <div className="max-w-6xl mx-auto">
                <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
                        Résultats {electionId && (<span className="text-[var(--color-primary)]">{getElectionTitle(electionId)}</span>)}
                    </h1>
                    {currentElection?.status === 'closed' && (
                        <button
                            onClick={handleRecalculate}
                            disabled={recalculating}
                            className="btn-secondary flex items-center justify-center gap-2 font-medium px-6 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <RefreshCw size={18} className={recalculating ? 'animate-spin' : ''} />
                            {recalculating ? 'Calcul en cours...' : 'Recalculer les résultats'}
                        </button>
                    )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                    <StatCard icon={Users} title="TOTAL CANDIDATS" value={filtered.length} />
                    <StatCard icon={TrendingUp} title="TOTAL VOTES" value={totalVotes} delay={100} />
                    <StatCard icon={Trophy} title="EN TÊTE" value={filtered[0]?.name ?? '—'} delay={200} />
                </div>

                <div className="bg-white p-4 rounded-xl shadow-sm mb-6 flex flex-col md:flex-row gap-4">
                    <select
                        value={electionId || ''}
                        onChange={(e) => {
                            const value = e.target.value;
                            const query = searchParams.toString();
                            setCurrentPage(1);
                            if (value) navigate(query ? `/manager/results/${value}?${query}` : `/manager/results/${value}`);
                            else navigate(query ? `/manager/results?${query}` : `/manager/results`);
                        }}
                        className="border border-[var(--color-gray-light)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] rounded-xl px-4 py-3 text-sm"
                    >
                        <option value="">Sélectionner une élection</option>
                        {elections.map((el) => (
                            <option key={el.uuid} value={el.uuid}>{el.title}</option>
                        ))}
                    </select>
                    <TextInput
                        iconLeft={Search}
                        placeholder="Rechercher un candidat..."
                        value={search}
                        onChange={(e) => handleSearch(e.target.value)}
                    />
                    <button onClick={resetFilters} className="flex items-center gap-2 btn-secondary text-sm font-medium whitespace-nowrap">
                        <RefreshCw size={18} /> Réinitialiser
                    </button>
                </div>

                {!electionId ? (
                    <div className="bg-white rounded-2xl shadow-sm p-10 text-center text-gray-500">
                        Sélectionnez une élection pour voir ses résultats.
                    </div>
                ) : loadingResults ? (
                    <div className="bg-white rounded-2xl shadow-sm p-10 text-center text-gray-500">
                        Chargement des résultats...
                    </div>
                ) : notReady ? (
                    <div className="bg-white rounded-2xl shadow-sm p-10 text-center text-gray-500">
                        Les résultats ne sont pas encore disponibles pour cette élection.
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[800px]">
                                <thead className="bg-gray-50 text-[var(--color-dark)]">
                                    <tr>
                                        <th className="text-left px-3 py-2 font-medium">Candidat</th>
                                        <th className="text-left px-3 py-2 font-medium">Voix</th>
                                        <th className="text-left px-3 py-2 font-medium">Pourcentage</th>
                                        <th className="text-right px-3 py-2 font-medium">Position</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[var(--color-gray-light)]">
                                    {paginatedResultat.map((candidate, index) => (
                                        <tr key={candidate.uuid} className="hover:bg-gray-50 transition">
                                            <td className="px-3 py-2">
                                                <div className="flex items-center gap-3">
                                                    <img
                                                        src={candidate.photo || `https://i.pravatar.cc/150?u=${candidate.uuid}`}
                                                        alt={candidate.name}
                                                        className="w-10 h-10 rounded-full object-cover"
                                                    />
                                                    <span className="font-medium">{candidate.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-3 py-2 text-gray-600">{candidate.votes}</td>
                                            <td className="px-3 py-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-semibold">{candidate.percentage}%</span>
                                                    <div className="w-full bg-gray-200 h-2 rounded">
                                                        <div className="bg-blue-600 h-2 rounded" style={{ width: `${candidate.percentage}%` }} />
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-3 py-2 text-right">
                                                {index === 0 && <span className="inline-flex items-center gap-1 text-yellow-500 font-semibold"><Trophy size={16} /> 1er</span>}
                                                {index === 1 && <span className="inline-flex items-center gap-1 text-gray-400"><Medal size={16} /> 2e</span>}
                                                {index === 2 && <span className="inline-flex items-center gap-1 text-orange-400"><Medal size={16} /> 3e</span>}
                                                {index > 2 && <span className="text-gray-500">{index + 1}e</span>}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <div className="flex flex-col lg:flex-row justify-between items-center px-3 py-2 text-sm gap-3">
                                <span className="text-[var(--color-gray)]">
                                    Affichage de {filtered.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} à{" "}
                                    {Math.min(currentPage * itemsPerPage, filtered.length)} sur{" "}
                                    {filtered.length}
                                </span>
                                <div className="flex gap-2">
                                    <button disabled={currentPage === 1} onClick={() => setCurrentPage((p) => p - 1)} className="px-3 py-1 border rounded">
                                        <ChevronLeft size={16} />
                                    </button>
                                    <span className="px-3 py-1 bg-[var(--color-primary)] text-white rounded">
                                        {currentPage} / {totalPages === 0 ? 1 : totalPages}
                                    </span>
                                    <button disabled={currentPage >= totalPages || totalPages === 0} onClick={() => setCurrentPage((p) => p + 1)} className="px-3 py-1 border rounded">
                                        <ChevronRight size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                        {filtered.length === 0 && (
                            <div className="p-10 text-center text-gray-500">Aucun résultat trouvé</div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ResultatsManager;

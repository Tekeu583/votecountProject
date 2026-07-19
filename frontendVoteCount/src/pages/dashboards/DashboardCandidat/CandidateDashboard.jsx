import { useState, useEffect, useMemo, useCallback } from 'react';
import { User, Trophy, Percent, Star } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import toast from 'react-hot-toast';
import StatCard from '@components/dashboard/StatCard';
import { useAuth } from '@hooks/useAuth';
import { candidatesApi, resultsApi } from '@services/api';
import { FadeLoader } from 'react-spinners';

const CandidateDashboard = () => {
    const { user } = useAuth();

    const [candidacies, setCandidacies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [results, setResults] = useState([]);
    const [notReady, setNotReady] = useState(false);

    useEffect(() => {
        const fetchCandidacies = async () => {
            setLoading(true);
            try {
                const res = await candidatesApi.getMine();
                setCandidacies(res.data?.data ?? []);
            } catch {
                toast.error('Impossible de charger vos candidatures.');
            } finally {
                setLoading(false);
            }
        };
        fetchCandidacies();
    }, []);

    const featured = useMemo(() => {
        const withElection = candidacies.filter((c) => c.election);
        return withElection.find((c) => c.election.status === 'ongoing') ?? withElection[0] ?? null;
    }, [candidacies]);

    const loadResults = useCallback(async () => {
        if (!featured?.election) {
            setResults([]);
            setNotReady(false);
            return;
        }

        setNotReady(false);
        try {
            const [finalRes, candidatesRes] = await Promise.all([
                resultsApi.final(featured.election.uuid).catch((err) => {
                    if (err.response?.status === 404 || err.response?.status === 403) return null;
                    throw err;
                }),
                candidatesApi.getAll(featured.election.uuid).catch(() => ({ data: { data: [] } })),
            ]);

            if (!finalRes) {
                setResults([]);
                setNotReady(true);
                return;
            }

            const candidatesByUuid = Object.fromEntries(
                (candidatesRes.data?.data ?? []).map((c) => [c.uuid, c])
            );

            const rows = (finalRes.data?.data?.results ?? [])
                .map((r) => ({
                    uuid: r.candidate_uuid,
                    name: candidatesByUuid[r.candidate_uuid]?.full_name ?? '—',
                    votes: r.total_votes ?? 0,
                    percentage: r.percentage ?? 0,
                    self: r.candidate_uuid === featured.uuid,
                }))
                .sort((a, b) => b.votes - a.votes)
                .slice(0, 10);

            setResults(rows);
        } catch {
            toast.error('Impossible de charger les résultats.');
        }
    }, [featured]);

    useEffect(() => {
        loadResults();
    }, [loadResults]);

    const ownResult = results.find((r) => r.self);
    const showJuryScore = featured?.election?.vote_type === 'weighted';

    if (loading) {
        return (
            <div className="h-[calc(100vh-68px)] flex items-center justify-center">
                <FadeLoader color="#1e40af" cssOverride={{ display: 'block', margin: '0 auto' }} />
            </div>
        );
    }

    return (
        <main className="flex-1 md:px-2 lg:px-2 bg-[var(--color-background-white)]">

            {/* HEADER */}
            <header className="flex flex-col lg:flex-row lg:items-center gap-4 justify-between items-center mb-8">
                <div className='p-1'>
                    <h2 className="text-2xl font-bold text-gray-800 capitalize ">
                        Bienvenue, {user?.first_name} {user?.last_name}
                    </h2>
                    <div className="flex gap-6 mt-4 border-b border-gray-200">
                        <button className="text-blue-600 border-b-2 border-blue-600 pb-2 font-medium text-sm">Tableau de bord</button>
                        <NavLink to="/candidat/results" className="text-gray-500 pb-2 font-medium text-sm">Résultats détaillés</NavLink>
                    </div>
                </div>
                {featured?.election && (
                    <span className="text-sm text-gray-500">
                        {featured.election.title}
                    </span>
                )}
            </header>

            {!featured ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-10 text-center text-gray-500">
                    Vous n'avez aucune candidature pour le moment.
                </div>
            ) : (
                <>
                    {/* STATS GRID */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
                        <StatCard icon={User} title="Votes reçus" value={featured.statistics?.vote_count ?? 0} color="bg-blue-50" delay={0} />
                        <StatCard icon={Trophy} title="Classement actuel" value={featured.rank_label ?? '—'} color="bg-indigo-50" delay={100} />
                        <StatCard icon={Percent} title="Pourcentage" value={ownResult ? `${ownResult.percentage}%` : '—'} color="bg-blue-50" delay={200} />
                        {showJuryScore && (
                            <StatCard icon={Star} title="Score Jury" value={featured.statistics?.final_score ?? '—'} color="bg-purple-50" delay={300} />
                        )}
                    </div>

                    {/* RANKING TABLE */}
                    <section className="bg-[--color-white] rounded-xl shadow-sm border border-gray-100 mb-8 overflow-hidden">
                        <div className="p-4 md:p-6 border-b border-gray-50">
                            <h3 className="font-bold text-sm sm:text-base md:text-lg text-[var(--color-dark)]">Classement — {featured.election.title}</h3>
                        </div>

                        {notReady ? (
                            <div className="p-10 text-center text-gray-500">
                                Les résultats ne sont pas encore disponibles pour cette élection.
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-[500px] w-full text-left">
                                    <thead>
                                        <tr className="text-[var(--color-dark)] bg-[var(--color-gray-light)] text-xs border-b border-b-[var(--color-gray-light)] uppercase tracking-wider">
                                            <th className="p-2 font-semibold">Rang</th>
                                            <th className="p-2 font-semibold">Candidat</th>
                                            <th className="p-2 font-semibold">Votes</th>
                                            <th className="p-2 font-semibold">Part de voix</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[var(--color-gray-light)]">
                                        {results.map((row, i) => (
                                            <tr key={row.uuid} className="hover:bg-gray-50/50 transition-colors">
                                                <td className="p-2 text-xs md:text-sm">
                                                    <span className="w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold bg-gray-100 text-gray-600">
                                                        {i + 1}
                                                    </span>
                                                </td>
                                                <td className="p-2 text-xs md:text-sm">
                                                    <div className="flex items-center gap-3">
                                                        <span className="font-semibold text-sm text-[var(--color-dark)]">{row.name}</span>
                                                        {row.self && <span className="bg-[var(--color-primary)] text-[var(--color-white)] text-[10px] px-2 py-0.5 rounded-full uppercase font-bold">vous</span>}
                                                    </div>
                                                </td>
                                                <td className="p-2 text-xs md:text-sm font-bold text-[var(--color-primary)]">{row.votes}</td>
                                                <td className="p-2 text-xs md:text-sm">
                                                    <span className="bg-blue-50 text-[var(--color-primary)] px-3 py-1 rounded-full text-xs font-bold">{row.percentage}%</span>
                                                </td>
                                            </tr>
                                        ))}
                                        {results.length === 0 && (
                                            <tr>
                                                <td colSpan={4} className="text-center py-10 text-gray-500">Aucun résultat</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </section>
                </>
            )}

        </main>
    );
};

export default CandidateDashboard;

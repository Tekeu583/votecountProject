import { useState, useEffect, useMemo, useCallback } from "react";
import { User, Percent, Trophy, Star } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import VoteChart from "@components/dashboard/VoteChart";
import RankingTable from "@components/dashboard/RankingTable";
import StatCard from "@components/dashboard/StatCard";
import { candidatesApi, resultsApi } from "@services/api";
import { FadeLoader } from "react-spinners";

export default function Resultats() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [candidacies, setCandidacies] = useState([]);
    const [loadingCandidacies, setLoadingCandidacies] = useState(true);
    const [results, setResults] = useState([]);
    const [loadingResults, setLoadingResults] = useState(false);
    const [notReady, setNotReady] = useState(false);

    useEffect(() => {
        const fetchCandidacies = async () => {
            setLoadingCandidacies(true);
            try {
                const res = await candidatesApi.getMine();
                setCandidacies((res.data?.data ?? []).filter((c) => c.election));
            } catch {
                toast.error('Impossible de charger vos candidatures.');
            } finally {
                setLoadingCandidacies(false);
            }
        };
        fetchCandidacies();
    }, []);

    const selectedElectionUuid = id || candidacies[0]?.election.uuid || '';
    const selected = useMemo(
        () => candidacies.find((c) => c.election.uuid === selectedElectionUuid) ?? null,
        [candidacies, selectedElectionUuid]
    );

    const loadResults = useCallback(async () => {
        if (!selectedElectionUuid) {
            setResults([]);
            setNotReady(false);
            return;
        }

        setLoadingResults(true);
        setNotReady(false);
        try {
            const [finalRes, candidatesRes] = await Promise.all([
                resultsApi.final(selectedElectionUuid).catch((err) => {
                    if (err.response?.status === 404 || err.response?.status === 403) return null;
                    throw err;
                }),
                candidatesApi.getAll(selectedElectionUuid).catch(() => ({ data: { data: [] } })),
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
                    percent: r.percentage ?? 0,
                    finalScore: r.final_score,
                    self: selected && r.candidate_uuid === selected.uuid,
                }))
                .sort((a, b) => b.votes - a.votes);

            setResults(rows);
        } catch {
            toast.error('Impossible de charger les résultats.');
        } finally {
            setLoadingResults(false);
        }
    }, [selectedElectionUuid, selected]);

    useEffect(() => {
        loadResults();
    }, [loadResults]);

    const chartData = useMemo(() => {
        const own = results.find((r) => r.self);
        const others = results.filter((r) => !r.self);
        const rows = own ? [{ name: 'Vous', value: own.percent }, ...others.slice(0, 4).map((r) => ({ name: r.name, value: r.percent }))]
            : results.slice(0, 5).map((r) => ({ name: r.name, value: r.percent }));
        return rows;
    }, [results]);

    const ownResult = results.find((r) => r.self);
    const position = ownResult ? results.findIndex((r) => r.self) + 1 : null;
    const showJuryScore = selected?.election?.vote_type === 'weighted';

    if (loadingCandidacies) {
        return (
            <div className="h-[calc(100vh-68px)] flex items-center justify-center">
                <FadeLoader color="#1e40af" cssOverride={{ display: 'block', margin: '0 auto' }} />
            </div>
        );
    }

    if (candidacies.length === 0) {
        return (
            <main className="p-4">
                <div className="bg-white rounded-xl shadow-sm p-10 text-center text-gray-500">
                    Vous n'avez aucune candidature pour le moment.
                </div>
            </main>
        );
    }

    return (
        <main className="p-4 space-y-6">

            {/* HEADER */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between ">
                <div>
                    <h1 className="text-2xl font-bold">Résultats</h1>
                    <p className="text-gray-500 text-sm">
                        {selected?.election?.title}
                    </p>
                </div>

                {/* FILTRE */}
                <select
                    value={selectedElectionUuid}
                    onChange={(e) => navigate(`/candidat/results/${e.target.value}`)}
                    className="px-4 py-2 border border-[var(--color-gray-light)] rounded-md truncate focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent text-sm"
                >
                    {candidacies.map((c) => (
                        <option className="truncate" key={c.election.uuid} value={c.election.uuid}>
                            {c.election.title}
                        </option>
                    ))}
                </select>
            </div>

            {loadingResults ? (
                <div className="bg-white rounded-xl shadow-sm p-10 text-center text-gray-500">
                    Chargement des résultats...
                </div>
            ) : notReady ? (
                <div className="bg-white rounded-xl shadow-sm p-10 text-center text-gray-500">
                    Les résultats ne sont pas encore disponibles pour cette élection.
                </div>
            ) : (
                <>
                    {/* STATS */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <StatCard icon={User} title="Total des voix" value={ownResult?.votes ?? 0} color="bg-blue-50" delay={0} />
                        <StatCard icon={Percent} title="Pourcentage global %" value={ownResult ? `${ownResult.percent}%` : '—'} color="bg-indigo-50" delay={100} />
                        <StatCard icon={Trophy} title="Position actuelle" value={position ?? '—'} color="bg-blue-50" delay={200} />
                        {showJuryScore && (
                            <StatCard icon={Star} title="Score Jury" value={ownResult?.finalScore ?? '—'} color="bg-purple-50" delay={300} />
                        )}
                    </div>

                    {/* CONTENT */}
                    <div className="grid lg:grid-cols-3 gap-4">
                        <VoteChart data={chartData} />
                        <div className="lg:col-span-2">
                            <RankingTable data={results.map((r) => ({ id: r.uuid, name: r.self ? `${r.name} (vous)` : r.name, votes: r.votes, percent: r.percent }))} />
                        </div>
                    </div>
                </>
            )}
        </main>
    );
}

import React, { useState, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import { Link, useParams } from 'react-router-dom';
import { ChevronLeft, Users, Vote, TrendingUp, Clock } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { FadeLoader } from 'react-spinners';
import toast from 'react-hot-toast';
import { electionsApi, resultsApi } from '@services/api';
import { useLiveResults } from '@hooks/useLiveResults';
import StatCard from '@components/dashboard/StatCard';
import RankingTable from '@components/dashboard/RankingTable';

const TOP_LIMIT = 5;
const COLORS = ['#2563EB', '#7C3AED', '#059669', '#F59E0B', '#DC2626', '#94A3B8'];

// Regroupe les candidats au-delà de TOP_LIMIT dans une tranche "Autres",
// pour qu'un camembert reste lisible même avec 100 candidats.
const buildPieData = (rows) => {
    const sorted = [...rows].sort((a, b) => b.votes - a.votes);
    const top = sorted.slice(0, TOP_LIMIT);
    const rest = sorted.slice(TOP_LIMIT);
    const restTotal = rest.reduce((sum, r) => sum + r.votes, 0);

    const pie = top.map((r, i) => ({ name: r.name, value: r.votes, color: COLORS[i % COLORS.length] }));
    if (restTotal > 0) {
        pie.push({ name: `Autres (${rest.length})`, value: restTotal, color: COLORS[COLORS.length - 1] });
    }
    return pie;
};

const IrvRoundsDetail = ({ rounds, candidatesById }) => {
    const [open, setOpen] = useState(false);
    if (!rounds?.length) return null;

    const nameOf = (id) => candidatesById[id]?.full_name ?? `#${id}`;

    return (
        <div className="bg-white border border-[var(--color-gray-light)] rounded-[var(--radius-lg)] p-5 mt-6">
            <button
                onClick={() => setOpen((o) => !o)}
                className="text-sm font-semibold text-[var(--color-primary)]"
            >
                {open ? 'Masquer' : 'Afficher'} le détail du dépouillement (tours IRV)
            </button>
            {open && (
                <div className="mt-4 space-y-4">
                    {rounds.map((round) => (
                        <div key={round.round} className="text-sm border-t border-[var(--color-gray-light)] pt-3">
                            <p className="font-semibold text-gray-800">Tour {round.round}</p>
                            <ul className="mt-1 space-y-0.5 text-gray-600">
                                {Object.entries(round.counts).map(([candidateId, count]) => (
                                    <li key={candidateId}>{nameOf(candidateId)} : {count} voix</li>
                                ))}
                            </ul>
                            {round.exhausted_this_round > 0 && (
                                <p className="text-xs text-gray-500 mt-1">Bulletins épuisés ce tour : {round.exhausted_this_round}</p>
                            )}
                            {round.eliminated && (
                                <p className="text-xs text-red-600 mt-1">Éliminé : {nameOf(round.eliminated)}</p>
                            )}
                            {round.tie_break && (
                                <p className="text-xs text-amber-600 mt-1">
                                    Égalité départagée par : {round.tie_break.method}
                                </p>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

IrvRoundsDetail.propTypes = {
    rounds: PropTypes.array,
    candidatesById: PropTypes.object.isRequired,
};

const ElectionResultats = () => {
    const { electionUuid } = useParams();
    const [loading, setLoading] = useState(true);
    const [election, setElection] = useState(null);
    const [finalResults, setFinalResults] = useState(null);
    const [finalNotReady, setFinalNotReady] = useState(false);

    useEffect(() => {
        if (!electionUuid) return;

        const fetchData = async () => {
            try {
                setLoading(true);
                const response = await electionsApi.getPublicShow(electionUuid);
                const electionData = response.data.data;
                setElection(electionData);

                const isClosed = ['closed', 'completed'].includes(electionData.status);
                if (isClosed) {
                    try {
                        const finalResponse = await resultsApi.final(electionUuid);
                        setFinalResults(finalResponse.data.data);
                    } catch (error) {
                        if (error.response?.status === 404) {
                            setFinalNotReady(true);
                        } else {
                            throw error;
                        }
                    }
                }
            } catch (error) {
                console.error('Error:', error);
                toast.error('Erreur de chargement des résultats');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [electionUuid]);

    const isClosed = ['closed', 'completed'].includes(election?.status);

    const { liveScores } = useLiveResults(
        election?.id,
        !isClosed,
        election?.live_scores
    );

    const candidatesById = useMemo(() => {
        if (!election?.candidates) return {};
        return Object.fromEntries(election.candidates.map((c) => [c.id, c]));
    }, [election]);

    // Lignes de classement au format attendu par RankingTable : {id, name, votes, percent}
    const rankingRows = useMemo(() => {
        if (isClosed && finalResults) {
            return finalResults.results.map((r, idx) => ({
                id: r.candidate_id,
                name: candidatesById[r.candidate_id]?.full_name ?? `Candidat #${idx + 1}`,
                votes: r.total_votes,
                percent: r.percentage,
            }));
        }
        if (liveScores?.scores) {
            return liveScores.scores.map((s) => ({
                id: s.candidate_uuid,
                name: s.full_name,
                votes: s.vote_count,
                percent: s.percentage,
            }));
        }
        return [];
    }, [isClosed, finalResults, liveScores, candidatesById]);

    const pieData = useMemo(() => buildPieData(rankingRows), [rankingRows]);
    // Somme des voix de tous les candidats (pas election.total_votes, qui compte
    // les bulletins et sous-compte pour "multiple"/"ranked" où un bulletin
    // touche plusieurs candidats).
    const totalVotes = useMemo(
        () => rankingRows.reduce((sum, r) => sum + (r.votes || 0), 0),
        [rankingRows]
    );
    const participationRate = isClosed
        ? finalResults?.participation_rate
        : election?.statistics?.participation_rate;
    // Sans liste d'électeurs fixe (élection publique), le taux de
    // participation n'a pas de dénominateur fiable — on ne l'affiche que
    // pour les élections avec électorat connu (privée/restreinte).
    const showParticipation = election?.election_mode !== 'public';

    if (loading) {
        return (
            <div className="h-[calc(100vh-68px)] flex items-center justify-center">
                <div className="text-center">
                    <FadeLoader color="#1e40af" cssOverride={{ display: 'block', margin: '0 auto' }} />
                    <p className="mt-4 text-gray-600">Chargement des résultats...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="pt-24 pb-16 px-6 mx-auto">
            <Link
                to={`/elections/${electionUuid}`}
                className="inline-flex items-center gap-2 text-[var(--color-dark)] hover:text-blue-600 mb-6"
            >
                <ChevronLeft size={16} /> Retour à l'élection
            </Link>

            <div className="flex items-center gap-3 mb-8">
                <h1 className="text-3xl font-bold text-gray-900">{election?.title}</h1>
                {isClosed ? (
                    <span className="text-xs font-semibold px-3 py-1 rounded-full bg-gray-100 text-gray-700">
                        Résultats définitifs
                    </span>
                ) : (
                    <span className="text-xs font-semibold px-3 py-1 rounded-full bg-green-100 text-green-700 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> En direct
                    </span>
                )}
            </div>

            {!isClosed && election?.vote_type === 'ranked' && (
                <p className="text-sm text-amber-600 font-medium mb-6 bg-amber-50 border border-amber-200 rounded-[var(--radius-md)] px-4 py-3">
                    Classement provisoire — les transferts de voix ne sont calculés qu'à la clôture de l'élection.
                </p>
            )}

            {isClosed && finalNotReady && (
                <p className="text-sm text-gray-600 mb-6 bg-gray-50 border border-gray-200 rounded-[var(--radius-md)] px-4 py-3">
                    Les résultats définitifs n'ont pas encore été calculés par l'organisateur.
                </p>
            )}

            {(!isClosed || !finalNotReady) && (
                <>
                    <div className={`grid grid-cols-1 gap-6 mb-8 ${showParticipation ? 'md:grid-cols-4' : 'md:grid-cols-3'}`}>
                        <StatCard title="Total des votes" value={totalVotes} icon={Vote} />
                        {showParticipation && (
                            <StatCard
                                title="Taux de participation"
                                value={participationRate != null ? `${participationRate}%` : '—'}
                                icon={TrendingUp}
                            />
                        )}
                        <StatCard title="Candidats" value={election?.candidates?.length ?? 0} icon={Users} />
                        <StatCard
                            title="Statut"
                            value={isClosed ? 'Clôturée' : (election?.statistics?.remaining_time ?? 'En cours')}
                            icon={Clock}
                        />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                        <div className="bg-white rounded-2xl p-8 shadow-sm border border-[var(--color-gray-light)]">
                            <h3 className="font-medium text-gray-700 mb-6">RÉPARTITION DES VOIX</h3>
                            {pieData.length > 0 ? (
                                <div className="h-80">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie data={pieData} cx="50%" cy="50%" innerRadius={90} outerRadius={130} dataKey="value">
                                                {pieData.map((entry, index) => (
                                                    <Cell key={index} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                            <Legend verticalAlign="bottom" iconType="circle" />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            ) : (
                                <p className="text-gray-500 text-sm">Aucun vote pour le moment.</p>
                            )}
                        </div>

                        <RankingTable data={rankingRows} />
                    </div>

                    {isClosed && finalResults?.irv && (
                        <IrvRoundsDetail rounds={finalResults.irv.rounds} candidatesById={candidatesById} />
                    )}
                </>
            )}
        </div>
    );
};

export default ElectionResultats;

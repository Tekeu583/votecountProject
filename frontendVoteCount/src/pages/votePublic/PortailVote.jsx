import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, ChevronLeft, Wifi, WifiOff } from 'lucide-react';
import toast from 'react-hot-toast';
import TextInput from '@components/ui/TextInput';
import { Link, useNavigate, useParams } from 'react-router-dom';
import CandidateCard from '@components/CandidatCard';
import { electionsApi, votesApi } from '@services/api';
import { FadeLoader } from 'react-spinners';

import { useLiveResults } from '@hooks/useLiveResults';
import { useDebounce } from '@hooks/useDebounce';

// ── Barre de résultats live — classement en temps réel ────────────
// Affiche les barres de progression de chaque candidat,
// triées par score décroissant. Mise à jour à chaque broadcast.
const LiveResultsBar = ({ scores, totalVotes }) => {
    if (!scores || scores.length === 0) return null;

    return (
        <div className="bg-white border border-[var(--color-gray-light)] rounded-[var(--radius-lg)] p-5 mb-8 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
                <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
                <span className="text-sm font-semibold text-[var(--color-dark)]">
                    Résultats en direct — {totalVotes} vote{totalVotes > 1 ? 's' : ''}
                </span>
            </div>
            <div className="space-y-3">
                {scores.map((s, idx) => (
                    <div key={s.candidate_uuid} className="flex items-center gap-3">
                        {/* Rang */}
                        <span className={`text-xs font-bold w-6 text-center shrink-0 ${idx === 0 ? 'text-yellow-500' :
                            idx === 1 ? 'text-gray-400' :
                                idx === 2 ? 'text-amber-600' : 'text-gray-400'
                            }`}>
                            {s.rank_label ?? `${idx + 1}`}
                        </span>
                        {/* Nom */}
                        <span className="text-xs text-[var(--color-gray)] w-32 truncate shrink-0">
                            {s.full_name}
                        </span>
                        {/* Barre */}
                        <div className="flex-1 h-2 bg-[var(--color-gray-light)] rounded-full overflow-hidden">
                            <div
                                className="h-full bg-[var(--color-primary)] rounded-full transition-all duration-700"
                                style={{ width: `${s.percentage}%` }}
                            />
                        </div>
                        {/* Pourcentage + votes */}
                        <span className="text-xs font-semibold text-[var(--color-dark)] w-20 text-right shrink-0">
                            {s.percentage}% ({s.vote_count})
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};

// ── Page principale ───────────────────────────────────────────────
const PortailVote = () => {
    const { electionUuid } = useParams();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCandidateId, setSelectedCandidateId] = useState(null);
    const [voting, setVoting] = useState(false);
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [election, setElection] = useState({ data: {}, meta: {} });

    // Fetch l'élection depuis l'API
    useEffect(() => {
        if (!electionUuid) {
            setLoading(false);
            toast.error('Election UUID non trouvée');
            return;
        }
        const fetchData = async () => {
            try {
                setLoading(true);
                const response = await electionsApi.getPublicShow(electionUuid);
                setElection(response.data);
            } catch (error) {
                console.error('Error:', error);
                toast.error('Erreur de chargement');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [electionUuid]);

    const electionData = election.data;
    const isOngoing = electionData?.status === 'ongoing';
    const showResults = electionData?.real_time_results === true && isOngoing;

    const { liveScores, connected } = useLiveResults(
        electionData?.id,
        showResults
    );

    // À chaque broadcast, on met à jour rank, rank_label et statistics.vote_count
    // de chaque candidat sans recharger toute la page.
    const candidatesWithLiveRank = useCallback(() => {
        const candidates = electionData?.candidates ?? [];
        if (!liveScores?.scores?.length) return candidates;

        // Map uuid → score live reçu
        const scoreMap = Object.fromEntries(
            liveScores.scores.map(s => [s.candidate_uuid, s])
        );

        return candidates
            .map(c => {
                const live = scoreMap[c.uuid];
                if (!live) return c;
                return {
                    ...c,
                    rank: live.rank,
                    rank_label: live.rank_label,
                    statistics: {
                        ...c.statistics,
                        vote_count: live.vote_count,
                    },
                };
            })
            .sort((a, b) => (a.rank ?? 999) - (b.rank ?? 999));
    }, [electionData?.candidates, liveScores]);

    const handleVote = (electionUuid, candidate) => {
        const electionMode = electionData?.election_mode;
        const paymentType = electionData?.payment_type;

        if (electionMode === 'private') {
            navigate(`/vote/private/${electionUuid}/access`, {
                state: { electionTitle: electionData?.title },
            });
            return;
        }

        setSelectedCandidateId(candidate.uuid);

        if (paymentType === 'paid') {
            navigate(`/vote/payement/${electionUuid}/candidate/${candidate.uuid}`, {
                state: {
                    election: {
                        uuid: electionData.uuid,
                        title: electionData.title,
                        payment_type: electionData.payment_type,
                        vote_price: electionData.vote_price,
                        currency: electionData.currency,
                        vote_type: electionData.vote_type,
                    },
                    candidate: {
                        uuid: candidate.uuid,
                        full_name: candidate.full_name,
                        photo: candidate.photo,
                        candidate_number: candidate.candidate_number,
                    },
                },
            });
            return;
        }

        submitFreeVote(electionUuid, candidate);
    };

    const submitFreeVote = async (electionUuid, candidate) => {
        try {
            setVoting(true);
            await votesApi.submitPublic(electionUuid, {
                items: [{ candidate_id: candidate.uuid }],
                idempotency_key: crypto.randomUUID(),
            });
            toast.success(`Votre vote pour ${candidate.full_name} a été enregistré !`);
            navigate(`/vote/success/${electionUuid}`, {
                state: { candidate: { full_name: candidate.full_name, photo: candidate.photo }, electionTitle: electionData.title, electionUuid: electionUuid, },
            });

        } catch (error) {
            const message = error.response?.data?.message ?? 'Erreur lors du vote. Veuillez réessayer.';
            toast.error(message);
            setSelectedCandidateId(null);
        } finally {
            setVoting(false);
        }
    };

    const viewCandidateDetails = (electionUuid, candidate) => {
        navigate(`/details/candidat/election/${electionUuid}/candidate/${candidate.uuid}`, {
            state: {
                election: { uuid: electionData.uuid, title: electionData.title, candidateUuid: candidate.uuid }
            }
        });
    };

    // Filtrage par recherche
    const filteredCandidates = candidatesWithLiveRank().filter(c =>
        !searchTerm || c.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="h-[calc(100vh-68px)] flex items-center justify-center">
                <div className="text-center">
                    <FadeLoader color="#1e40af" cssOverride={{ display: 'block', margin: '0 auto' }} />
                    <p className="mt-4 text-gray-600">Chargement de l'élection...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="pt-17 bg-[var(--color-background-white)]">
            <div className="mx-auto px-6 pt-8 pb-16">

                {/* Hero : image + infos élection */}
                <div className="relative rounded overflow-hidden mb-16 shadow-2xl">
                    <Link
                        to="/elections"
                        className="inline-flex items-center gap-2 absolute text-[var(--color-dark)] hover:text-blue-600 cursor-pointer top-4 left-4 z-20"
                    >
                        <ChevronLeft size={16} /> Retour
                    </Link>
                    <img
                        src={electionData.banner || 'https://i.pravatar.cc/1200?u=gertrude'}
                        alt={electionData.title}
                        className="w-full h-[520px] object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-black/20" />
                    <div className="absolute inset-0 flex items-center justify-center px-6">
                        <div className="text-center text-white max-w-3xl">
                            <h1 className="text-4xl md:text-6xl font-bold leading-tight">
                                {electionData.title}
                            </h1>
                            <p className="text-lg md:text-xl mt-4 opacity-90">
                                {electionData.description}
                            </p>
                            {/* Indicateur connexion live */}
                            {showResults && (
                                <div className={`mt-4 inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-full font-medium ${connected ? 'bg-green-500/20 text-green-300' : 'bg-gray-500/20 text-gray-300'
                                    }`}>
                                    {connected
                                        ? <><Wifi size={12} /> Résultats en direct</>
                                        : <><WifiOff size={12} /> Connexion live...</>
                                    }
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {showResults && liveScores && (
                    <LiveResultsBar
                        scores={liveScores.scores}
                        totalVotes={liveScores.total_votes}
                    />
                )}

                {/* Section candidats */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h2 className="text-3xl font-bold text-gray-900">Candidates en Compétition</h2>
                        <p className="text-gray-600 mt-1">
                            {filteredCandidates.length} candidat{filteredCandidates.length > 1 ? 's' : ''}
                            {showResults && liveScores ? ' — classement en temps réel' : ''}
                        </p>
                    </div>
                    <div className="relative w-80">
                        <TextInput
                            iconLeft={Search}
                            placeholder="Rechercher un candidat..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* Grid des candidats — triés par rang si live actif */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {filteredCandidates.map((candidate) => (
                        <CandidateCard
                            key={candidate.uuid}
                            candidate={candidate}
                            electionUuid={electionUuid}
                            isSelected={selectedCandidateId === candidate.uuid}
                            onVote={handleVote}
                            viewCandidateDetails={viewCandidateDetails}
                            showResults={showResults}
                        />
                    ))}
                </div>

            </div>
        </div>
    );
};

export default PortailVote;
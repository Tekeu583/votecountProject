import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, ChevronLeft, Wifi, WifiOff, BarChart3, LayoutGrid } from 'lucide-react';
import toast from 'react-hot-toast';
import TextInput from '@components/ui/TextInput';
import { Link, useNavigate, useParams } from 'react-router-dom';
import CandidateCard from '@components/CandidatCard';
import RankedBallotForm from '@components/RankedBallotForm';
import MultipleBallotForm from '@components/MultipleBallotForm';
import { electionsApi, votesApi, resultsApi } from '@services/api';
import { FadeLoader } from 'react-spinners';

import { useLiveResults } from '@hooks/useLiveResults';
import { useDebounce } from '@hooks/useDebounce';

const rankLabel = (rank) => {
    if (rank === 1) return '1er';
    if (rank === 2) return '2ème';
    if (rank === 3) return '3ème';
    return `${rank}ème`;
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
    const isClosed = ['closed', 'completed'].includes(electionData?.status);
    // Gate du socket WebSocket uniquement (mises à jour à chaque vote).
    const liveEnabled = electionData?.real_time_results === true && isOngoing;
    // Gate d'affichage voix/rang sur la carte — indépendant du statut, pour
    // tous les types de vote : reste vrai même après la clôture de l'élection.
    const canShowResults = electionData?.public_results === true;

    const { liveScores, connected } = useLiveResults(
        electionData?.id,
        liveEnabled,
        electionData?.live_scores
    );

    // Une fois l'élection clôturée, les voix/rang affichés doivent venir du
    // vrai dépouillement final (IRV compris pour ranked), pas de
    // l'approximation live — sinon "provisoire" resterait affiché à tort.
    const [finalScores, setFinalScores] = useState(null);
    useEffect(() => {
        if (!isClosed || !electionData?.uuid) {
            setFinalScores(null);
            return;
        }
        resultsApi.final(electionData.uuid)
            .then(res => setFinalScores(res.data?.data?.results ?? null))
            .catch(() => setFinalScores(null));
    }, [isClosed, electionData?.uuid]);

    // Fusionne rank/rank_label/vote_count dans chaque candidat, depuis les
    // résultats finaux (élection clôturée) ou live (élection en cours).
    const candidatesWithResults = useCallback(() => {
        const candidates = electionData?.candidates ?? [];

        if (isClosed) {
            if (!finalScores?.length) return candidates;
            const scoreMap = Object.fromEntries(
                finalScores.map((s, idx) => [s.candidate_uuid, { ...s, rank: idx + 1 }])
            );
            return candidates
                .map(c => {
                    const final = scoreMap[c.uuid];
                    if (!final) return c;
                    return {
                        ...c,
                        rank: final.rank,
                        rank_label: rankLabel(final.rank),
                        statistics: { ...c.statistics, vote_count: final.total_votes },
                    };
                })
                .sort((a, b) => (a.rank ?? 999) - (b.rank ?? 999));
        }

        if (!liveScores?.scores?.length) return candidates;
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
    }, [electionData?.candidates, liveScores, isClosed, finalScores]);

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

    const submitRankedVote = async (items) => {
        try {
            setVoting(true);
            await votesApi.submitPublic(electionUuid, {
                items,
                idempotency_key: crypto.randomUUID(),
            });
            toast.success('Votre classement a été enregistré !');
            navigate(`/vote/success/${electionUuid}`, {
                state: { electionTitle: electionData.title, electionUuid: electionUuid },
            });
        } catch (error) {
            const message = error.response?.data?.message ?? 'Erreur lors du vote. Veuillez réessayer.';
            toast.error(message);
        } finally {
            setVoting(false);
        }
    };

    // Vote multiple : toujours payant, aucun vote n'est créé ici — on
    // transmet juste la sélection (candidat + montant par candidat) à la
    // page de paiement, qui créera le vote au moment de payer (même
    // principe que le vote payant single, cf. VotePayment.jsx).
    const continueMultipleToPayment = (items) => {
        navigate(`/vote/payement-multiple/${electionUuid}`, {
            state: {
                election: {
                    uuid: electionData.uuid,
                    title: electionData.title,
                    payment_type: electionData.payment_type,
                    vote_price: electionData.vote_price,
                    currency: electionData.currency,
                    vote_type: electionData.vote_type,
                },
                candidates: items,
            },
        });
    };

    const viewCandidateDetails = (electionUuid, candidate) => {
        navigate(`/details/candidat/election/${electionUuid}/candidate/${candidate.uuid}`, {
            state: {
                election: { uuid: electionData.uuid, title: electionData.title, candidateUuid: candidate.uuid }
            }
        });
    };

    // Filtrage par recherche
    const filteredCandidates = candidatesWithResults().filter(c =>
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
                            {liveEnabled && (
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

                {/* Section candidats */}
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
                    <div>
                        <h2 className="text-3xl font-bold text-gray-900">Candidates en Compétition</h2>
                        <p className="text-gray-600 mt-1">
                            {filteredCandidates.length} candidat{filteredCandidates.length > 1 ? 's' : ''}
                            {liveEnabled && liveScores ? ' — classement en temps réel' : ''}
                            {isClosed && finalScores ? ' — résultats définitifs' : ''}
                        </p>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                        {electionData?.has_categories === true && (
                            <Link
                                to={`/elections/${electionUuid}/categories`}
                                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-[var(--radius-md)] border border-[var(--color-primary)] text-[var(--color-primary)] font-semibold text-sm hover:bg-[var(--color-primary)]/5 transition-colors shrink-0"
                            >
                                <LayoutGrid size={16} /> Voir par catégorie
                            </Link>
                        )}
                        {electionData?.public_results === true && (
                            <Link
                                to={`/elections/${electionUuid}/results`}
                                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-[var(--radius-md)] border border-[var(--color-primary)] text-[var(--color-primary)] font-semibold text-sm hover:bg-[var(--color-primary)]/5 transition-colors shrink-0"
                            >
                                <BarChart3 size={16} /> Voir les résultats
                            </Link>
                        )}
                        <div className="relative w-full sm:w-64 lg:w-80">
                            <TextInput
                                iconLeft={Search}
                                placeholder="Rechercher un candidat..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                {/* Grid des candidats — triés par rang si live actif — ou bulletin dédié pour ranked/multiple */}
                {electionData?.vote_type === 'ranked' ? (
                    electionData?.payment_type === 'free' ? (
                        <RankedBallotForm
                            candidates={filteredCandidates}
                            submitting={voting}
                            onSubmit={submitRankedVote}
                            showResults={canShowResults}
                        />
                    ) : (
                        <div className="text-center text-gray-500 py-12 bg-white border border-[var(--color-gray-light)] rounded-[var(--radius-lg)]">
                            Le vote par classement payant n'est pas encore disponible.
                        </div>
                    )
                ) : electionData?.vote_type === 'multiple' ? (
                    <MultipleBallotForm
                        candidates={filteredCandidates}
                        votePrice={electionData?.vote_price}
                        currency={electionData?.currency}
                        onContinue={continueMultipleToPayment}
                        showResults={canShowResults}
                    />
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {filteredCandidates.map((candidate) => (
                            <CandidateCard
                                key={candidate.uuid}
                                candidate={candidate}
                                electionUuid={electionUuid}
                                isSelected={selectedCandidateId === candidate.uuid}
                                onVote={handleVote}
                                viewCandidateDetails={viewCandidateDetails}
                                showResults={canShowResults}
                            />
                        ))}
                    </div>
                )}

            </div>
        </div>
    );
};

export default PortailVote;
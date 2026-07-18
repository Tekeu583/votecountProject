import React, { useEffect, useMemo } from 'react';
import { Lock, ChevronLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import CandidateCard from '@components/CandidatCard';
import { useNavigate, useParams, useLocation, Link } from 'react-router-dom';
import { useVoterSession } from '@hooks/useVoterSession';

import { useLiveResults } from '@hooks/useLiveResults';
const ElectionCandidats = () => {
    const navigate = useNavigate();
    const { electionUuid } = useParams();
    const location = useLocation();
    const { voterSession, hasActiveSession } = useVoterSession();

    // location.state existe juste après l'OTP ; voterSession persiste au-delà.
    const stateData = location.state ?? {};
    const sessionToken = stateData.sessionToken ?? voterSession?.sessionToken;
    const electorName = stateData.electorName ?? voterSession?.electorName;
    const electionTitle = stateData.electionTitle ?? voterSession?.electionTitle;
    const realTimeResults = stateData.realTimeResults ?? voterSession?.realTimeResults;
    const candidates = stateData.candidates ?? voterSession?.candidates;
    const electionBanner = stateData.electionBanner ?? voterSession?.electionBanner;
    const electionDescription = stateData.electionDescription ?? voterSession?.electionDescription;

    const electionId = stateData.electionId ?? voterSession?.electionId;

    const liveScoresInitial = stateData.liveScoresInitial ?? voterSession?.liveScoresInitial;
    const showResults = realTimeResults === true;
    const { liveScores } = useLiveResults(electionId, showResults, liveScoresInitial);

    const displayedCandidates = useMemo(() => {
        if (!candidates) return [];
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
    }, [candidates, liveScores]);

    useEffect(() => {
        if (!hasActiveSession(electionUuid) || !candidates) {
            toast.error('Session expirée. Veuillez vous reconnecter.');
            navigate('/vote', { replace: true });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [electionUuid]);

    const handleVote = (electionUuidParam, candidate) => {
        // Étape 3 : demande du code de confirmation finale pour ce candidat.
        navigate(`/vote/private/${electionUuid}/confirm`, {
            state: {
                sessionToken,
                candidate: { uuid: candidate.uuid, full_name: candidate.full_name, photo: candidate.photo },
                electionTitle,
            },
        });
    };

    const handleCandidateDetails = (electionUuidParam, candidate) => {
        navigate(`/details/${candidate.uuid}`, {
            state: {
                candidate,
                election: { uuid: electionUuid, title: electionTitle },
                sessionToken,
                electorName,
            },
        });
    };

    if (!sessionToken || !candidates) return null;

    return (
        <div className="mx-auto p-6 pt-18 bg-[var(--color-background-white)]">

            <div className="relative rounded overflow-hidden mb-16 shadow-2xl">
                <Link
                    to="/"
                    className="inline-flex items-center gap-2 absolute text-[var(--color-primary)] hover:text-blue-600 cursor-pointer top-4 left-4 z-20"
                >
                    <ChevronLeft size={16} /> Retour
                </Link>
                <img
                    src={electionBanner || 'https://i.pravatar.cc/1200?u=gertrude'}
                    alt={electionTitle}
                    className="w-full h-[520px] object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-black/20" />
                <div className="absolute inset-0 flex items-center justify-center px-6">
                    <div className="text-center text-white max-w-3xl">
                        <div className="inline-flex items-center gap-2 bg-blue-500/20 text-blue-200 text-sm font-medium px-4 py-1.5 rounded-full mb-4">
                            <Lock size={14} /> Scrutin privé — accès vérifié
                        </div>
                        <h1 className="text-4xl md:text-6xl font-bold leading-tight">
                            {electionTitle}
                        </h1>
                        {electionDescription && (
                            <p className="text-lg md:text-xl mt-4 opacity-90">
                                {electionDescription}
                            </p>
                        )}
                        {electorName && (
                            <p className="text-sm mt-4 opacity-80">
                                Connecté en tant que <span className="font-medium">{electorName}</span>
                            </p>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {displayedCandidates.map((candidate) => (
                    <CandidateCard
                        key={candidate.uuid}
                        candidate={candidate}
                        electionUuid={electionUuid}
                        isSelected={false}
                        onVote={handleVote}
                        viewCandidateDetails={handleCandidateDetails}
                        showResults={showResults}
                    />
                ))}
            </div>
        </div>
    );
};

export default ElectionCandidats;
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { CheckCircle, Trophy, Medal } from 'lucide-react';

// Même logique que CandidatCard.getRankBadge — classement LIVE de
// l'élection (approximation par 1ers choix), distinct du choix de
// l'électeur dans son propre bulletin.
const getRankBadge = (rank) => {
    if (rank === 1) return { icon: Trophy, color: 'text-yellow-500' };
    if (rank === 2) return { icon: Medal, color: 'text-gray-400' };
    if (rank === 3) return { icon: Medal, color: 'text-amber-600' };
    return null;
};

// ── Bulletin de classement (vote ranked / IRV)------------
const RankedBallotForm = ({ candidates, submitting, onSubmit, showResults = false }) => {
    const [rankedList, setRankedList] = useState([]);

    const rankOf = (candidateUuid) => {
        const idx = rankedList.indexOf(candidateUuid);
        return idx === -1 ? '' : idx + 1;
    };

    const rankLabel = (n) => {
        if (n === 1) return '1er choix';
        return `${n}e choix`;
    };

    const handleRankChange = (candidateUuid, rawValue) => {
        setRankedList((prev) => {
            const next = prev.filter((uuid) => uuid !== candidateUuid);
            if (rawValue === '') return next;

            const desiredIndex = Math.min(Number(rawValue) - 1, next.length);
            next.splice(desiredIndex, 0, candidateUuid);
            return next;
        });
    };

    const handleSubmit = () => {
        const items = rankedList.map((candidateUuid, index) => ({
            candidate_id: candidateUuid,
            rank_position: index + 1,
        }));
        onSubmit(items);
    };

    return (
        <div>
            <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-900">Classez les candidats par ordre de préférence</h3>
                <p className="text-sm text-gray-600 mt-1">
                    Vous pouvez classer tout ou partie des candidats. Votre 1er choix reçoit vos voix en priorité ;
                    en cas d'élimination, elles sont transférées à votre choix suivant.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {candidates.map((candidate) => {
                    const rank = rankOf(candidate.uuid);
                    const isRanked = rank !== '';
                    const liveBadge = showResults ? getRankBadge(candidate.rank) : null;

                    return (
                        <div
                            key={candidate.uuid}
                            className={`bg-[var(--color-white)] rounded-xl overflow-hidden border transition-all duration-300 group
                                ${isRanked
                                    ? 'border-[var(--color-primary)] shadow-xl scale-[1.02]'
                                    : 'border-gray-100 hover:shadow-xl hover:-translate-y-1'
                                }`}
                        >
                            <div className="relative">
                                <img
                                    src={candidate.photo}
                                    alt={candidate.full_name}
                                    className="w-full h-90 object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                                {candidate.candidate_number && (
                                    <div className="absolute top-3 left-3 bg-[var(--color-primary)] text-white px-3 py-1 rounded-[var(--radius-md)] font-bold text-sm shadow">
                                        N°{candidate.candidate_number}
                                    </div>
                                )}
                                {liveBadge && (
                                    <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm px-3.5 py-1 rounded-[var(--radius-md)] text-sm font-bold flex items-center gap-1.5 shadow">
                                        <liveBadge.icon className={`w-5 h-5 ${liveBadge.color}`} />
                                        {candidate.rank_label}
                                    </div>
                                )}
                                {showResults && (
                                    <div className="absolute bottom-4 right-4 bg-black/60 text-white px-3.5 py-1 rounded-2xl text-sm font-medium shadow">
                                        {candidate.statistics?.vote_count ?? 0} vote{(candidate.statistics?.vote_count ?? 0) > 1 ? 's' : ''}
                                    </div>
                                )}
                            </div>

                            <div className="p-4">
                                <h3 className="font-bold text-xl text-gray-900">{candidate.full_name}</h3>
                                {candidate.slogan && (
                                    <p className="text-sm text-gray-500 italic mt-1">« {candidate.slogan} »</p>
                                )}
                                {candidate.bio && (
                                    <p className="text-sm text-gray-600 mt-4 line-clamp-3 min-h-[60px]">
                                        {candidate.bio}
                                    </p>
                                )}

                                <select
                                    value={rank}
                                    onChange={(e) => handleRankChange(candidate.uuid, e.target.value)}
                                    className={`mt-6 w-full py-4 px-4 rounded-2xl font-semibold text-center appearance-none cursor-pointer transition-all
                                        ${isRanked
                                            ? 'btn-secondary text-[var(--color-primary)]!'
                                            : 'btn-primary'
                                        }`}
                                >
                                    <option value="">Non classé</option>
                                    {candidates.map((_, index) => (
                                        <option key={index} value={index + 1}>
                                            {rankLabel(index + 1)}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    );
                })}
            </div>

            <button
                onClick={handleSubmit}
                disabled={rankedList.length === 0 || submitting}
                className="mt-8 w-full py-4 rounded-2xl font-semibold flex items-center justify-center gap-2 transition-all btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <CheckCircle size={20} />
                {submitting ? 'Envoi en cours...' : 'Valider mon classement'}
            </button>
        </div>
    );
};

RankedBallotForm.propTypes = {
    candidates: PropTypes.arrayOf(
        PropTypes.shape({
            uuid: PropTypes.string.isRequired,
            full_name: PropTypes.string.isRequired,
            photo: PropTypes.string,
            slogan: PropTypes.string,
            bio: PropTypes.string,
            candidate_number: PropTypes.number,
            rank: PropTypes.number,
            rank_label: PropTypes.string,
            statistics: PropTypes.shape({
                vote_count: PropTypes.number,
            }),
        })
    ).isRequired,
    submitting: PropTypes.bool,
    onSubmit: PropTypes.func.isRequired,
    showResults: PropTypes.bool,
};

export default RankedBallotForm;

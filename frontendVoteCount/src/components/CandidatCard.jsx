import React from 'react';
import PropTypes from 'prop-types';
import { Trophy, Medal, CheckCircle } from 'lucide-react';

const CandidateCard = ({ candidate, electionUuid, isSelected, onVote, viewCandidateDetails, showResults = false }) => {
    const getRankBadge = (rank) => {
        if (rank === 1) return { icon: Trophy, color: 'text-yellow-500', bg: 'bg-yellow-100' };
        if (rank === 2) return { icon: Medal, color: 'text-gray-400', bg: 'bg-gray-100' };
        if (rank === 3) return { icon: Medal, color: 'text-amber-600', bg: 'bg-amber-100' };
        return null;
    };

    const rankBadge = showResults ? getRankBadge(candidate.rank) : null;

    return (
        <div className={`bg-[var(--color-white)] rounded-xl overflow-hidden border transition-all duration-300 group
            ${isSelected
                ? 'border-[var(--color-success)] shadow-xl scale-[1.02]'
                : 'border-gray-100 hover:shadow-xl hover:-translate-y-1'
            }`}
        >
            {/* Photo + Rank */}
            <div className="relative">
                <button onClick={() => viewCandidateDetails(electionUuid, candidate)}
                    className='w-full'>
                    <img
                        src={candidate.photo}
                        alt={candidate.full_name}
                        className="w-full h-90 object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                </button>
                <div className="absolute top-3 left-3 bg-[var(--color-primary)] text-white px-3 py-1 rounded-[var(--radius-md)] font-bold text-sm shadow">
                    N°{candidate.candidate_number}
                </div>
                {showResults && candidate.rank > 0 && candidate.rank <= 3 && (
                    <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm px-3.5 py-1 rounded-[var(--radius-md)] text-sm font-bold flex items-center gap-1.5 shadow">
                        {rankBadge && <rankBadge.icon className={`w-5 h-5 ${rankBadge.color}`} />}
                        {candidate.rank_label}
                    </div>
                )}

                {/* Nombre de votes — uniquement si résultats en temps réel activés */}
                {showResults && (
                    <div className="absolute bottom-4 right-4 bg-black/60 text-[var(--color-white)] px-3.5 py-1 rounded-2xl text-sm font-medium flex items-center gap-1.5 shadow">
                        {candidate.statistics?.vote_count ?? 0} votes
                    </div>
                )}
            </div>

            {/* Contenu */}
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
                <button
                    onClick={() => onVote(electionUuid, candidate)}
                    className={`mt-6 w-full py-4 rounded-2xl font-semibold flex items-center justify-center gap-2 transition-all ${isSelected
                        ? 'btn-secondary text-success!'
                        : 'btn-primary'
                        }`}
                >
                    {isSelected ? (
                        <>Vous avez voté</>
                    ) : (
                        <>
                            <CheckCircle size={20} />
                            Voter maintenant
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

CandidateCard.propTypes = {
    candidate: PropTypes.shape({
        uuid: PropTypes.string.isRequired,
        full_name: PropTypes.string.isRequired,
        statistics: PropTypes.shape({
            vote_count: PropTypes.number,
        }),
        rank: PropTypes.number,
        rank_label: PropTypes.string,
        photo: PropTypes.string,
        slogan: PropTypes.string,
        bio: PropTypes.string,
        candidate_number: PropTypes.number,
    }).isRequired,
    electionUuid: PropTypes.string.isRequired,
    isSelected: PropTypes.bool,
    onVote: PropTypes.func.isRequired,
    viewCandidateDetails: PropTypes.func,
    showResults: PropTypes.bool,
};

export default CandidateCard;
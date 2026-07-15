import React, { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import { ArrowRight, Banknote, Trophy, Medal } from 'lucide-react';
import TextInput from '@components/ui/TextInput';
import { computeVoteQuantity } from '@utils/voteAmount';


const getRankBadge = (rank) => {
    if (rank === 1) return { icon: Trophy, color: 'text-yellow-500' };
    if (rank === 2) return { icon: Medal, color: 'text-gray-400' };
    if (rank === 3) return { icon: Medal, color: 'text-amber-600' };
    return null;
};

const MultipleBallotForm = ({ candidates, votePrice, currency = 'XAF', onContinue, showResults = false }) => {
    // { [candidateUuid]: amountString }
    const [amounts, setAmounts] = useState({});

    const toggleCandidate = (candidateUuid) => {
        setAmounts((prev) => {
            const next = { ...prev };
            if (candidateUuid in next) {
                delete next[candidateUuid];
            } else {
                next[candidateUuid] = String(votePrice);
            }
            return next;
        });
    };

    const setAmount = (candidateUuid, value) => {
        setAmounts((prev) => ({ ...prev, [candidateUuid]: value }));
    };

    const selection = useMemo(() => {
        return Object.entries(amounts).map(([uuid, amount]) => {
            const { isValid, quantity } = computeVoteQuantity(amount, votePrice);
            return { uuid, amount, isValid, quantity };
        });
    }, [amounts, votePrice]);

    const totalAmount = selection.reduce((sum, s) => sum + (s.isValid ? parseFloat(s.amount) : 0), 0);
    const allValid = selection.length > 0 && selection.every((s) => s.isValid);

    const handleContinue = () => {
        const items = candidates
            .filter((c) => c.uuid in amounts)
            .map((c) => ({ ...c, amount: amounts[c.uuid] }));
        onContinue(items);
    };

    return (
        <div>
            <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-900">Choisissez vos candidats et répartissez votre montant</h3>
                <p className="text-sm text-gray-600 mt-1">
                    Sélectionnez un ou plusieurs candidats, puis indiquez le montant que vous voulez attribuer à chacun
                    (multiple exact de {votePrice} {currency}). Un seul paiement couvre l'ensemble.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {candidates.map((candidate) => {
                    const isSelected = candidate.uuid in amounts;
                    const amount = amounts[candidate.uuid] ?? '';
                    const { isValid, quantity } = computeVoteQuantity(amount, votePrice);
                    const liveBadge = showResults ? getRankBadge(candidate.rank) : null;

                    return (
                        <div
                            key={candidate.uuid}
                            className={`bg-[var(--color-white)] rounded-xl overflow-hidden border transition-all duration-300 group
                                ${isSelected
                                    ? 'border-[var(--color-primary)] shadow-xl scale-[1.02]'
                                    : 'border-gray-100 hover:shadow-xl hover:-translate-y-1'
                                }`}
                        >
                            <button
                                type="button"
                                onClick={() => toggleCandidate(candidate.uuid)}
                                className="relative w-full block"
                            >
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
                                <div className={`absolute bottom-4 left-4 w-7 h-7 rounded-full border-2 flex items-center justify-center shadow ${isSelected
                                        ? 'bg-[var(--color-primary)] border-[var(--color-primary)] text-white'
                                        : 'bg-white/90 border-gray-300'
                                    }`}>
                                    {isSelected && '✓'}
                                </div>
                                {showResults && (
                                    <div className="absolute bottom-4 right-4 bg-black/60 text-white px-3.5 py-1 rounded-2xl text-sm font-medium shadow">
                                        {candidate.statistics?.vote_count ?? 0} vote{(candidate.statistics?.vote_count ?? 0) > 1 ? 's' : ''}
                                    </div>
                                )}
                            </button>

                            <div className="p-4">
                                <h3 className="font-bold text-xl text-gray-900">{candidate.full_name}</h3>
                                {candidate.slogan && (
                                    <p className="text-sm text-gray-500 italic mt-1">« {candidate.slogan} »</p>
                                )}

                                {isSelected && (
                                    <div className="mt-4">
                                        <TextInput
                                            type="number"
                                            label={`Montant (${currency})`}
                                            placeholder={String(votePrice)}
                                            value={amount}
                                            onChange={(e) => setAmount(candidate.uuid, e.target.value)}
                                            iconLeft={Banknote}
                                            className="w-full"
                                        />
                                        <p className={`text-xs mt-2 font-medium ${isValid ? 'text-[var(--color-primary)]' : 'text-amber-600'}`}>
                                            {isValid
                                                ? `= ${quantity} voix pour ce candidat`
                                                : `Doit être un multiple exact de ${votePrice} ${currency}`}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="mt-8 bg-white border border-[var(--color-gray-light)] rounded-[var(--radius-lg)] p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="text-sm text-gray-700">
                    <p><strong>{selection.length}</strong> candidat{selection.length > 1 ? 's' : ''} sélectionné{selection.length > 1 ? 's' : ''}</p>
                    <p className="text-lg font-bold text-gray-900 mt-1">{totalAmount} {currency}</p>
                </div>
                <button
                    onClick={handleContinue}
                    disabled={!allValid}
                    className="py-4 px-8 rounded-2xl font-semibold flex items-center justify-center gap-2 transition-all btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Continuer vers le paiement <ArrowRight size={18} />
                </button>
            </div>
        </div>
    );
};

MultipleBallotForm.propTypes = {
    candidates: PropTypes.arrayOf(
        PropTypes.shape({
            uuid: PropTypes.string.isRequired,
            full_name: PropTypes.string.isRequired,
            photo: PropTypes.string,
            slogan: PropTypes.string,
            candidate_number: PropTypes.number,
            rank: PropTypes.number,
            rank_label: PropTypes.string,
            statistics: PropTypes.shape({
                vote_count: PropTypes.number,
            }),
        })
    ).isRequired,
    votePrice: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    currency: PropTypes.string,
    onContinue: PropTypes.func.isRequired,
    showResults: PropTypes.bool,
};

export default MultipleBallotForm;

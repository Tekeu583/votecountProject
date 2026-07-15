import { useState } from 'react';
import PropTypes from 'prop-types';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import JuryCriteriaManager from './JuryCriteriaManager';

// Étape du wizard de création — n'existe que pour vote_type='weighted'
// (inséré conditionnellement entre "Général" et "Candidats" par
// CreateScrutin.jsx). electionUuid est garanti non-null ici : le brouillon
// est déjà créé à la fin de l'étape 1.
const StepJuryCriteria = ({ electionUuid, onNext, onPrevious }) => {
    const [criteriaCount, setCriteriaCount] = useState(0);

    const handleNext = () => {
        if (criteriaCount === 0) {
            toast.error('Ajoutez au moins un critère de notation pour continuer.');
            return;
        }
        onNext();
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6">
            <div>
                <h2 className="text-xl font-semibold text-[var(--color-dark)]">Critères de notation du jury</h2>
                <p className="text-[var(--color-gray)] text-sm mt-1">
                    Définissez les critères sur lesquels les membres du jury noteront les candidats. Vous pourrez affecter les jurés eux-mêmes après la création du scrutin.
                </p>
            </div>

            <JuryCriteriaManager electionUuid={electionUuid} onChange={(list) => setCriteriaCount(list.length)} />

            <div className="flex justify-between pt-4 border-t border-[var(--color-gray-light)]">
                <button onClick={onPrevious} className="flex items-center gap-2 px-6 py-3 btn-secondary font-medium">
                    <ArrowLeft size={20} /> Précédent
                </button>
                <button onClick={handleNext} className="flex items-center gap-2 btn-primary font-medium">
                    Continuer vers les candidats <ArrowRight size={20} />
                </button>
            </div>
        </div>
    );
};

StepJuryCriteria.propTypes = {
    electionUuid: PropTypes.string.isRequired,
    onNext: PropTypes.func.isRequired,
    onPrevious: PropTypes.func.isRequired,
};

export default StepJuryCriteria;

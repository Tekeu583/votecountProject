import PropTypes from 'prop-types';

export default function TopCandidates({ candidates = [] }) {
    return (
        <div className="bg-[var(--color-white)] rounded-[var(--radius-md)] shadow-[var(--shadow-md)] p-4">

            <h2 className="font-semibold mb-4">
                Classement Candidats (Top 3)
            </h2>

            {candidates.length === 0 ? (
                <p className="text-sm text-[var(--color-gray)]">
                    Aucun résultat disponible pour le moment.
                </p>
            ) : (
                <div className="space-y-4">
                    {candidates.map((c) => (
                        <div key={c.uuid}>

                            <div className="flex justify-between text-sm mb-1">
                                <span>{c.name}</span>
                                <span>{c.percentage}%</span>
                            </div>

                            <div className="h-2 bg-[var(--color-gray-light)] rounded-[var(--radius-md)]">
                                <div
                                    className="h-2 bg-[var(--color-primary)] rounded-[var(--radius-md)]"
                                    style={{ width: `${c.percentage}%` }}
                                />
                            </div>

                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

TopCandidates.propTypes = {
    candidates: PropTypes.arrayOf(PropTypes.shape({
        uuid: PropTypes.string,
        name: PropTypes.string,
        percentage: PropTypes.number,
    })),
};

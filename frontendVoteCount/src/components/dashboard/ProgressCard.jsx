import PropTypes from 'prop-types';

const STATUS_LABELS = {
    draft: 'Brouillon',
    pending: 'En attente',
    published: 'Publiée',
    ongoing: 'En cours',
    paused: 'En pause',
    closed: 'Clôturée',
    completed: 'Terminée',
    cancelled: 'Annulée',
    archived: 'Archivée',
};

export default function ProgressCard({ electionsByStatus = {} }) {
    const entries = Object.entries(electionsByStatus);
    const total = entries.reduce((sum, [, count]) => sum + count, 0);

    return (
        <div className="bg-[var(--color-white)] p-4 rounded-[var(--radius-md)] shadow-[var(--shadow-md)]">

            <h2 className="font-semibold mb-4">Répartition des scrutins</h2>

            {entries.length === 0 ? (
                <p className="text-sm text-[var(--color-gray)]">Aucun scrutin pour le moment.</p>
            ) : (
                <div className="space-y-4">
                    {entries.map(([status, count]) => {
                        const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                        return (
                            <div key={status}>
                                <div className="flex justify-between text-sm">
                                    <span>{STATUS_LABELS[status] ?? status}</span>
                                    <span>{count} ({pct}%)</span>
                                </div>
                                <div className="h-2 bg-[var(--color-gray-light)] rounded mt-1">
                                    <div className="h-2 bg-[var(--color-primary)] rounded" style={{ width: `${pct}%` }} />
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

ProgressCard.propTypes = {
    electionsByStatus: PropTypes.object,
};

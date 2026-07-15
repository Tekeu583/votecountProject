import PropTypes from 'prop-types';

export default function ActivityFeed({ activities = [] }) {
    return (
        <div className="bg-[var(--color-white)] p-4 rounded-[var(--radius-md)] shadow-[var(--shadow-md)]">

            <h2 className="font-semibold mb-4">
                Activités Récentes
            </h2>

            {activities.length === 0 ? (
                <p className="text-sm text-[var(--color-gray)]">Aucune activité récente.</p>
            ) : (
                <div className="space-y-3 text-sm">
                    {activities.map((a) => (
                        <div key={a.vote_uuid} className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-[var(--color-primary)] rounded-full shrink-0"></span>
                            <span>
                                Vote enregistré — <strong>{a.election_title}</strong>
                                <span className="text-[var(--color-gray)]"> · {new Date(a.timestamp).toLocaleString('fr-FR')}</span>
                            </span>
                        </div>
                    ))}
                </div>
            )}

        </div>
    );
}

ActivityFeed.propTypes = {
    activities: PropTypes.arrayOf(PropTypes.shape({
        vote_uuid: PropTypes.string,
        election_title: PropTypes.string,
        timestamp: PropTypes.string,
    })),
};

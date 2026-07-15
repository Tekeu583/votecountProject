import PropTypes from 'prop-types';

export default function ScrutinsTable({ elections = [] }) {
    return (
        <div className="bg-[var(--color-background-white)] rounded-[var(--radius-md)] shadow-[var(--shadow-md)]">

            {/* HEADER */}
            <div className="flex justify-between  items-center p-4">
                <h2 className="font-semibold text-[var(--color-dark)]">
                    Mes Scrutins Récents
                </h2>
            </div>

            {/* TABLE */}
            <div className="overflow-x-auto space-y-4 bg-[var(--color-white)]">
                <table className="w-full text-sm">

                    {/* HEAD */}
                    <thead className="bg-[var(--color-gray-light)] text-[var(--color-dark)] rounded-[var(--radius-md)] text-xs uppercase">
                        <tr>
                            <th className="text-left px-4 py-3">Titre</th>
                            <th className="text-left px-4 py-3">Statut</th>
                            <th className="text-left px-4 py-3">Participation</th>
                            <th className="text-left px-4 py-3">Date de fin</th>
                        </tr>
                    </thead>

                    {/* BODY */}
                    <tbody className="p-2">
                        {elections.map((election) => {
                            const participation = Math.round(election.statistics?.participation_rate ?? 0);
                            return (
                                <tr
                                    key={election.uuid}
                                    className="hover:bg-[var(--color-gray-light)] transition"
                                >
                                    <td className="px-4 py-3 font-medium text-[var(--color-dark)]">
                                        {election.title}
                                    </td>

                                    <td className="px-4 py-3">
                                        <span
                                            className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap
                                        ${election.status === "ongoing"
                                                    ? "bg-green-100 text-[var(--color-success)]"
                                                    : "bg-gray-200 text-[var(--color-gray)]"
                                                }`}
                                        >
                                            {election.status_label ?? election.status}
                                        </span>
                                    </td>

                                    <td className="px-4 py-3 min-w-[200px]">
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 h-2 bg-[var(--color-gray-light)] rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-blue-500 transition-all duration-500"
                                                    style={{ width: `${participation}%` }}
                                                />
                                            </div>
                                            <span className="text-xs text-[var(--color-gray)] w-10 text-right">
                                                {participation}%
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-[var(--color-gray)]">
                                        {election.end_at ? new Date(election.end_at).toLocaleDateString('fr-FR') : '—'}
                                    </td>
                                </tr>
                            );
                        })}

                        {elections.length === 0 && (
                            <tr>
                                <td colSpan={4} className="px-4 py-6 text-center text-[var(--color-gray)]">
                                    Aucun scrutin pour le moment
                                </td>
                            </tr>
                        )}
                    </tbody>

                </table>
            </div>
        </div>
    );
}

ScrutinsTable.propTypes = {
    elections: PropTypes.array,
};

export default function ScrutinsTable() {
    const data = [
        {
            title: "Élection Bureau 2026",
            status: "En cours",
            participation: 65,
            date: "31 Déc 2024",
        },
        {
            title: "Conseil Administration",
            status: "En cours",
            participation: 42,
            date: "15 Jan 2025",
        },
        {
            title: "Vote Budget Annuel",
            status: "Terminé",
            participation: 100,
            date: "10 Déc 2024",
        },
        {
            title: "Élection Bureau 2026",
            status: "En cours",
            participation: 65,
            date: "31 Déc 2024",
        },
        {
            title: "Conseil Administration",
            status: "En cours",
            participation: 42,
            date: "15 Jan 2025",
        },
        {
            title: "Vote Budget Annuel",
            status: "Terminé",
            participation: 100,
            date: "10 Déc 2024",
        },
    ];

    return (
        <div className="bg-[var(--color-background-white)] rounded-[var(--radius-md)] shadow-[var(--shadow-md)]">

            {/* HEADER */}
            <div className="flex justify-between  items-center p-4">
                <h2 className="font-semibold text-[var(--color-dark)]">
                    Mes Scrutins Actifs
                </h2>

                <button className="text-sm text-[var(--color-primary)] hover:underline">
                    Voir tout
                </button>
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
                        {data.map((item, i) => (
                            <tr
                                key={i}
                                className="hover:bg-[var(--color-gray-light)] transition"
                            >
                                {/* TITLE */}
                                <td className="px-4 py-3 font-medium text-[var(--color-dark)]">
                                    {item.title}
                                </td>

                                {/* STATUS */}
                                <td className="px-4 py-3">
                                    <span
                                        className={`px-2 py-1 rounded-full text-xs font-medium
                                        ${item.status === "En cours"
                                                ? "bg-green-100 text-[var(--color-success)]"
                                                : "bg-gray-200 text-[var(--color-gray)]"
                                            }`}
                                    >
                                        {item.status}
                                    </span>
                                </td>

                                {/* PROGRESS */}
                                <td className="px-4 py-3 min-w-[200px]">
                                    <div className="flex items-center gap-2">
                                        {/* FIX IMPORTANT */}
                                        <div className="flex-1 h-2 bg-[var(--color-gray-light)] rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-blue-500 transition-all duration-500"
                                                style={{ width: `${item.participation}%` }}
                                            />
                                        </div>
                                        <span className="text-xs text-[var(--color-gray)] w-10 text-right">
                                            {item.participation}%
                                        </span>
                                    </div>
                                </td>
                                {/* DATE */}
                                <td className="px-4 py-3 text-[var(--color-gray)]">
                                    {item.date}
                                </td>
                            </tr>
                        ))}
                    </tbody>

                </table>
            </div>
        </div>
    );
}
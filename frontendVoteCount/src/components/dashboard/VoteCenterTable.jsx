import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Eye } from "lucide-react";
export default function VoteCenterTable({ data = [] }) {
    const [page, setPage] = useState(1);
    const perPage = 5;

    const paginated = useMemo(() => {
        const start = (page - 1) * perPage;
        return data.slice(start, start + perPage);
    }, [data, page]);

    const totalPages = Math.ceil(data.length / perPage);

    return (
        <div className="bg-white p-5 rounded shadow w-full min-w-0">
            <h3 className="font-semibold mb-4">Centres de vote</h3>

            {data.length === 0 ? (
                <p className="text-gray-500">Aucun centre</p>
            ) : (
                <>
                    <div className="overflow-x-auto w-full">
                        <table className="w-full text-sm">
                            <thead>
                                <tr>
                                    <th className="px-3 py-2 text-left ">Centre</th>
                                    <th className="px-3 py-2 text-left">Votes</th>
                                    <th className="px-3 py-2 text-left whitespace-nowrap">Pourcentage %</th>
                                    <th className="px-3 py-2 text-left">Statut</th>
                                    <th className="px-3 py-2 text-left">Details</th>
                                </tr>
                            </thead>

                            <tbody>
                                {paginated.map((c, i) => (
                                    <tr key={i} className="border-t border-t-[var(--color-gray-light)]">
                                        <td className="px-3 py-2 whitespace-nowrap">{c.name}</td>
                                        <td className="px-3 py-2">{c.votes}</td>
                                        <td className="px-3 py-2">{c.percent}%</td>
                                        <td className="px-3 py-2">
                                            <span className={`px-2 py-1 rounded-xl text-xs whitespace-nowrap ${c.status === "VALIDÉ"
                                                ? "bg-blue-100 text-[var(--color-primary)]"
                                                : "bg-orange-100 text-orange-600"
                                                }`}>
                                                {c.status}
                                            </span>
                                        </td>
                                        <td className="px-3 py-2">
                                            <button title="Voir les résultats détaillés dans le centre" className="flex gap-3 text-[var(--color-primary)] hover:text-[var(--color-primary)]">
                                                <Eye /> Voir
                                            </button>
                                        </td>

                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="flex justify-end gap-2 mt-3">
                        <button onClick={() => setPage(p => p - 1)} disabled={page === 1}>
                            <ChevronLeft size={16} />
                        </button>
                        <span>{page}/{totalPages || 1}</span>
                        <button onClick={() => setPage(p => p + 1)} disabled={page === totalPages}>
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}
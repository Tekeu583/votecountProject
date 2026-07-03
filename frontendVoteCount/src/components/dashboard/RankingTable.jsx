import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function RankingTable({ data = [] }) {
    const [page, setPage] = useState(1);
    const perPage = 5;

    const paginated = useMemo(() => {
        const start = (page - 1) * perPage;
        return data.slice(start, start + perPage);
    }, [data, page]);

    const totalPages = Math.ceil(data.length / perPage);

    return (
        <div className="bg-white p-5 rounded shadow w-full min-w-0">
            <h3 className="font-semibold mb-4">Classement</h3>
            <div className="overflow-x-auto w-full">
                <table className="w-full text-sm">
                    <thead>
                        <tr>
                            <th className="px-3 text-left">Rang</th>
                            <th className="px-3 text-left">Nom</th>
                            <th className="px-3 text-left">Votes</th>
                            <th className="px-3 text-left whitespace-nowrap">pourcentage %</th>
                        </tr>
                    </thead>

                    <tbody>
                        {paginated.map((item, i) => (
                            <tr key={item.id} className="border-t border-t-[var(--color-gray-light)]">
                                <td className="px-3 py-2">{(page - 1) * perPage + i + 1}</td>
                                <td className="px-3 py-2">{item.name}</td>
                                <td className="px-3 py-2">{item.votes}</td>
                                <td className="px-3 py-2 text-blue-600">{item.percent}%</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* pagination */}
            <div className="flex justify-end gap-2 mt-3">
                <button onClick={() => setPage(p => p - 1)} disabled={page === 1}>
                    <ChevronLeft size={16} />
                </button>
                <span>{page}/{totalPages || 1}</span>
                <button onClick={() => setPage(p => p + 1)} disabled={page === totalPages}>
                    <ChevronRight size={16} />
                </button>
            </div>
        </div>
    );
}
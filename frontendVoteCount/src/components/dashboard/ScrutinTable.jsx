import { Eye, ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useState, useMemo } from "react";

export default function ScrutinTable({ data }) {
    const navigate = useNavigate();
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const paginatedClassement = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return data.slice(start, start + itemsPerPage);
    }, [data, currentPage]);

    const totalPages = Math.ceil(data.length / itemsPerPage);

    const getStatusStyle = (status) => {
        switch (status) {
            case "EN COURS":
                return "bg-blue-100 text-blue-600";
            case "TERMINÉ":
                return "bg-green-100 text-green-600";
            case "À VENIR":
                return "bg-orange-100 text-orange-600";
            default:
                return "bg-gray-100 text-gray-600";
        }
    };

    return (
        <div className="bg-white p-5 rounded-xl shadow">
            <h3 className="font-semibold mb-4">Liste des scrutins</h3>

            <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[600px]">
                    <thead className="text-[var(--color-dark)] text-left">
                        <tr>
                            <th className="pb-3">Élection</th>
                            <th>Statut</th>
                            <th>Votre rang</th>
                            <th className="text-right">Action</th>
                        </tr>
                    </thead>

                    <tbody>
                        {paginatedClassement.map((scrutin) => (
                            <tr key={scrutin.id} className="border-t border-t-[var(--color-gray-light)] hover:bg-[var(--color-gray-light)]">
                                <td className="py-3 font-medium">{scrutin.name}</td>

                                <td>
                                    <span
                                        className={`px-2 py-1 rounded text-xs ${getStatusStyle(
                                            scrutin.status
                                        )}`}
                                    >
                                        {scrutin.status}
                                    </span>
                                </td>

                                <td className="font-semibold text-gray-700">
                                    {scrutin.rank}
                                </td>

                                <td className="text-right">
                                    <button
                                        onClick={() => navigate(`/candidat/results/${scrutin.id}`)}
                                        className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800"
                                    >
                                        <Eye size={16} />
                                        Voir
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {/* FOOTER_Pagination */}
            <div className="flex flex-col lg:flex-row justify-between items-center p-4 text-sm gap-3">
                <span className="text-[var(--color-gray)]">
                    Affichage de {(currentPage - 1) * itemsPerPage + 1} à{" "}
                    {Math.min(currentPage * itemsPerPage, data.length)} sur{" "}
                    {data.length}
                </span>

                <div className="flex gap-2">
                    <button
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage((p) => p - 1)}
                        className="px-3 py-1 border rounded"><ChevronLeft size={16} /></button>
                    <span className="px-3 py-1 bg-[var(--color-primary)] text-white rounded">
                        {currentPage} / {totalPages}
                    </span>
                    <button
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage((p) => p + 1)}
                        className="px-3 py-1 border rounded"><ChevronRight size={16} /></button>
                </div>
            </div>
        </div>
    );
}
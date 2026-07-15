import { Eye, ChevronLeft, ChevronRight } from "lucide-react";
import StatusBadge from "./StatusBadge";
import { useNavigate } from "react-router-dom";
import { useState, useMemo } from "react";
import PropTypes from "prop-types";

export default function CandidatureTable({ data }) {
    const navigate = useNavigate();
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const paginatedCandidature = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return data.slice(start, start + itemsPerPage);
    }, [data, currentPage]);

    const totalPages = Math.ceil(data.length / itemsPerPage);

    return (
        <div className="bg-white p-6 rounded-xl shadow w-full min-w-0">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold">Liste des candidatures</h3>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="text-[var(--color-dark)] text-left">
                        <tr>
                            <th className="pb-3">Élection</th>
                            <th>Statut</th>
                            <th className="text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedCandidature.map((item) => (
                            <tr
                                key={item.id}
                                className="border-t border-t-[var(--color-gray-light)] hover:bg-[var(--color-gray-light)] transition"
                            >
                                <td className="py-3 font-medium text-gray-800">
                                    {item.election}
                                </td>
                                <td>
                                    <StatusBadge status={item.status} />
                                </td>
                                <td className="text-right">
                                    <button title="Voir les résultats"
                                        onClick={() => navigate(`/candidat/results/${item.electionUuid}`)}
                                        className="inline-flex items-center gap-1 px-2 text-blue-600 hover:text-blue-800"
                                    >
                                        <Eye size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {paginatedCandidature.length === 0 && (
                            <div className="text-center py-10 text-gray-400">
                                Aucune candidature trouvée
                            </div>
                        )}
                    </tbody>
                </table>
            </div>
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
CandidatureTable.propTypes={
    data: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.string.isRequired,
        election: PropTypes.string.isRequired,
        electionUuid: PropTypes.string.isRequired,
        status: PropTypes.oneOf(['ACCEPTÉ', 'EN ATTENTE', 'REJETÉ', 'BLOQUÉ']).isRequired,
    })).isRequired,
}
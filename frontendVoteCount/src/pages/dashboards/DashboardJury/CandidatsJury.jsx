import { useState, useMemo } from "react";
import {
    Search,
    RefreshCcw,
    ChevronLeft,
    ChevronRight
} from "lucide-react";
import TextInput from "@components/ui/TextInput";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";


export default function CandidatesList() {

    const { id } = useParams();
    const navigate = useNavigate();
    // STATE
    const [searchParams, setSearchParams] = useSearchParams();
    const selectedElection = id ? Number(id) : null;
    const search = searchParams.get('search') || '';

    const [statusFilter, setStatusFilter] = useState("ALL");
    const [currentPage, setCurrentPage] = useState(1);
    const perPage = 5;

    // MOCK DATA
    const elections = useMemo(() => [
        { id: 1, name: 'Élection Conseil Syndical', status: "En cours", },
        { id: 2, name: "Prix de l'Innovation 2026", status: "En attente", },
        { id: 3, name: 'Direction Départementale', status: "Terminé", },
        { id: 4, name: 'Comité Technique', status: "En cours", },
        { id: 5, name: 'Élection Étudiante 2026', status: "En attente", },
    ], []);
    const getElectionById = (id) => {
        const election = elections.find(election => election.id === Number(id));
        return election ? election.name : '-';
    }
    const candidatesData = useMemo(() => [
        { id: 1, name: "Fokam", email: "fokam@gmail.com", electionId: 1, status: "NOTÉ", },
        { id: 2, name: "Pradier", email: "pradier@gmail.com", electionId: 2, status: "EN COURS", },
        { id: 3, name: "Arsene", email: "arsene@gmail.com", electionId: 3, status: "EN ATTENTE", },
        { id: 4, name: "Leo", email: "leo@gmail.com", electionId: 4, status: "EN ATTENTE", },
    ], []);

    // FILTER
    const filteredData = useMemo(() => {
        return candidatesData.filter((c) => {
            const matchSearch =
                c.name.toLowerCase().includes(search.toLowerCase()) ||
                c.email.toLowerCase().includes(search.toLowerCase());

            const matchScrutin = !selectedElection || c.electionId === selectedElection;
            const matchStatus = statusFilter === "ALL" || c.status === statusFilter;

            return matchSearch && matchScrutin && matchStatus;
        });
    }, [search, selectedElection, statusFilter, candidatesData]);

    // PAGINATION
    const totalPages = Math.ceil(filteredData.length / perPage);

    const paginated = useMemo(() => {
        const start = (currentPage - 1) * perPage;
        return filteredData.slice(start, start + perPage);
    }, [filteredData, currentPage]);
    const handleSearch = (value) => {
        const params = new URLSearchParams(searchParams);

        if (value) {
            params.set('search', value);
        } else {
            params.delete('search');
        }

        setSearchParams(params);
        setCurrentPage(1);
    };
    // RESET
    const handleReset = () => {
        setSearchParams({});
        setStatusFilter("ALL");
        navigate('/jury/candidats')
        setCurrentPage(1);
    };

    // STATUS STYLE
    const getStatusStyle = (status) => {
        switch (status) {
            case "NOTÉ":
                return "bg-green-100 text-green-600";
            case "EN COURS":
                return "bg-orange-100 text-orange-600";
            default:
                return "bg-gray-100 text-gray-600";
        }
    };

    // UI
    return (
        <main className="p-4  space-y-6">

            {/* HEADER */}
            <div className="flex flex-col md:flex-row justify-between gap-4">
                <h1 className="text-2xl font-bold ">Liste des candidats {selectedElection && (<> <p>de l'election </p> <span className="text-[var(--color-primary)]">{getElectionById(selectedElection)} </span></>)} </h1>

                {/* SEARCH */}
                <div className="w-full md:w-80">
                    <TextInput
                        type="text"
                        placeholder="Rechercher un candidat..."
                        value={search}
                        iconLeft={Search}
                        onChange={(e) => {
                            handleSearch(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="w-full  focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>
            </div>

            {/* FILTERS */}
            <div className="bg-white p-4 rounded-xl shadow flex flex-col md:flex-row gap-4">

                <select
                    value={selectedElection || ''}
                    onChange={(e) => {
                        const value = e.target.value;
                        const query = searchParams.toString();
                        setCurrentPage(1);
                        if (value) {
                            navigate(query ? `/jury/candidats/${value}?${query}` : `/jury/candidats/${value}`);
                        } else {
                            navigate(query ? `/jury/candidats?${query}` : `/jury/candidats`);
                        }
                    }}
                    className="px-4 py-2 input rounded-lg"
                >
                    <option value=''>Tous les scrutins</option>
                    {elections.map(el => (
                        <option key={el.id} value={el.id}>
                            {el.name}
                        </option>
                    ))}
                </select>

                <select
                    value={statusFilter}
                    onChange={(e) => {
                        setStatusFilter(e.target.value);
                        setCurrentPage(1);
                    }}
                    className="px-4 py-2 input rounded-lg"
                >
                    <option value="ALL">Tous les statuts</option>
                    <option value="NOTÉ">Noté</option>
                    <option value="EN COURS">En cours</option>
                    <option value="EN ATTENTE">En attente</option>
                </select>

                {/* RESET */}
                <button
                    onClick={handleReset}
                    className="flex items-center justify-center gap-2 px-4 py-2 btn-secondary"
                >
                    <RefreshCcw size={16} />
                    Réinitialiser
                </button>
            </div>

            {/* TABLE */}
            <div className="bg-white rounded-xl shadow overflow-hidden">

                <div className="overflow-x-auto">
                    <table className="min-w-[700px] w-full">

                        <thead className="bg-gray-50 text-left">
                            <tr>
                                <th className="px-4 py-3">Candidat</th>
                                <th className="px-4 py-3">Election</th>
                                <th className="px-4 py-3">Statut</th>
                                <th className="px-4 py-3 text-right">Action</th>
                            </tr>
                        </thead>

                        <tbody>
                            {paginated.map((candidate) => (
                                <tr
                                    key={candidate.id}
                                    className="border-t border-t-[var(--color-gray-light)] hover:bg-[var(--color-gray-light)]"
                                >
                                    {/* USER */}
                                    <td className="px-4 py-3">
                                        <div>
                                            <p className="font-medium">{candidate.name}</p>
                                            <p className="text-gray-500 text-xs">
                                                {candidate.email}
                                            </p>
                                        </div>
                                    </td>

                                    <td className="px-4 py-3">
                                        {candidate.electionId ? getElectionById(candidate.electionId) : '-'}
                                    </td>

                                    {/* STATUS */}
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-1 rounded text-xs ${getStatusStyle(candidate.status)}`}>
                                            {candidate.status}
                                        </span>
                                    </td>

                                    {/* ACTION */}
                                    <td className="px-4 py-3 text-right">
                                        {candidate.status === "EN COURS" ? (
                                            <button
                                                onClick={() => navigate(`/jury/candidats/${candidate.electionId}/evaluations`, { state: { candidate } })}
                                                className="bg-blue-600 text-white px-3 py-1 rounded">
                                                Continuer
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => navigate(`/jury/candidats/${candidate.electionId}/evaluations/${candidate.id}`, { state: { candidate } })} 
                                                className="text-blue-600 font-medium">
                                                Évaluer
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}

                            {paginated.length === 0 && (
                                <tr>
                                    <td colSpan="4" className="text-center py-6 text-gray-500">
                                        Aucun candidat trouvé
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* PAGINATION */}
                <div className="flex flex-col md:flex-row justify-between items-center p-4 gap-3 text-sm">
                    <span className="text-gray-500">
                        {(currentPage - 1) * perPage + 1} -{" "}
                        {Math.min(currentPage * perPage, filteredData.length)} sur{" "}
                        {filteredData.length}
                    </span>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setCurrentPage((p) => p - 1)}
                            disabled={currentPage === 1}
                            className="px-3 py-1 border rounded disabled:opacity-50"
                        >
                            <ChevronLeft size={16} />
                        </button>

                        <span className="px-3 py-1 bg-blue-600 text-white rounded">
                            {currentPage}/{totalPages || 1}
                        </span>

                        <button
                            onClick={() => setCurrentPage((p) => p + 1)}
                            disabled={currentPage === totalPages}
                            className="px-3 py-1 border rounded disabled:opacity-50"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            </div>
        </main>
    );
}
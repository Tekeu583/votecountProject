import { useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
    Trophy,
    Medal,
    Search,
    Users,
    TrendingUp,
    ChevronLeft,
    ChevronRight,
    RefreshCw,
} from 'lucide-react';

import TextInput from '@components/ui/TextInput';
import StatCard from '@components/dashboard/StatCard';
const ResultatsJury = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const selectedElection = id ? Number(id) : null;
    const search = searchParams.get('search') || '';
    const [currentPage, setCurrentPage] = useState(1);

    // DATA MOCK (remplacer par API plus tard)
    const elections = useMemo(() => [
        { id: 1, name: 'Élection Conseil Syndical' },
        { id: 2, name: "Prix de l'Innovation 2026" },
        { id: 3, name: 'Direction Départementale' },
        { id: 4, name: 'Comité Technique' },
        { id: 5, name: 'Élection Étudiante 2026' },
    ], []);

    const results = useMemo(() => [

        { id: 1, electionId: 1, name: 'Fokam', score: 8.5, votes: 45, avatar: 'https://i.pravatar.cc/150?u=1' },
        { id: 2, electionId: 1, name: 'Audrey', score: 9.2, votes: 52, avatar: 'https://i.pravatar.cc/150?u=2' },
        { id: 3, electionId: 1, name: 'Tekeu Arsene', score: 7.8, votes: 38, avatar: 'https://i.pravatar.cc/150?u=3' },

        { id: 4, electionId: 2, name: 'Gertrude', score: 6.9, votes: 20, avatar: 'https://i.pravatar.cc/150?u=4' },
        { id: 5, electionId: 2, name: 'Muriel', score: 8.9, votes: 47, avatar: 'https://i.pravatar.cc/150?u=5' },
        { id: 6, electionId: 2, name: 'Leo', score: 7.5, votes: 30, avatar: 'https://i.pravatar.cc/150?u=6' },

        { id: 7, electionId: 3, name: 'Valérie', score: 9, votes: 60, avatar: 'https://i.pravatar.cc/150?u=7' },
        { id: 8, electionId: 3, name: 'Fortune', score: 7.2, votes: 25, avatar: 'https://i.pravatar.cc/150?u=8' },

        { id: 9, electionId: 4, name: 'Pradier', score: 8.1, votes: 40, avatar: 'https://i.pravatar.cc/150?u=9' },
        { id: 10, electionId: 4, name: 'Benedict', score: 6.8, votes: 18, avatar: 'https://i.pravatar.cc/150?u=10' },
        { id: 11, electionId: 4, name: 'Tekeu Arsene', score: 7.1, votes: 38, avatar: 'https://i.pravatar.cc/150?u=3' },

    ], []);

    const getElectionById = (id) => {
        const election = elections.find(election => election.id === Number(id));
        return election ? election.name : '-';
    }
    //Filtrage
    const filtered = useMemo(() => {
        return results
            .filter(r => !selectedElection || r.electionId === selectedElection)
            .filter(c => c.name.toLowerCase().includes(search.toLowerCase()))
            .sort((a, b) => b.score - a.score)
    }, [results, selectedElection, search]);

    const maxScore = filtered.length
        ? Math.max(...filtered.map(r => r.score))
        : 0;
    const totalVotes = filtered.reduce((sum, r) => sum + r.votes, 0);
    const avgScore = filtered.length
        ? (filtered.reduce((sum, r) => sum + r.score, 0) / filtered.length).toFixed(2)
        : 0;
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
    // Pagination
    const itemsPerPage = 5;
    const totalPages = Math.ceil(filtered.length / itemsPerPage);

    const paginatedResultat = filtered.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );
    const resetFilters = () => {
        setSearchParams({});
        navigate('/jury/results');
        setCurrentPage(1);
    };
    return (
        <div className="flex-1 bg-[var(--color-background-white)] p-4">
            <div className="max-w-6xl mx-auto">

                {/* HEADER */}
                <div className="mb-8">
                    <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
                        Résultats du scrutin {id && (<span className="text-[var(--color-primary)]">{id ? getElectionById(id) : ''}</span>)}
                    </h1>
                </div>

                {/* STATS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                    <StatCard icon={Users} title="TOTAL CANDIDATS" value={filtered.length} />
                    <StatCard icon={TrendingUp} title="MOYENNE GLOBALE" value={avgScore} delay={100} />
                    <StatCard icon={Trophy} title="TOTAL VOTES" value={totalVotes} delay={200} />
                </div>

                {/* SEARCH */}
                <div className="bg-white p-4 rounded-xl shadow-sm mb-6  flex flex-col md:flex-row gap-4">
                    <select
                        value={selectedElection || ''}
                        onChange={(e) => {
                            const value = e.target.value;
                            const query = searchParams.toString();
                            setCurrentPage(1);
                            if (value) {
                                navigate(query ? `/jury/results/${value}?${query}` : `/jury/results/${value}`);
                            } else {
                                navigate(query ? `/jury/results?${query}` : `/jury/results`);
                            }
                        }}
                        className="border border-[var(--color-gray-light)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] rounded-xl px-4 py-3 text-sm"
                    >
                        <option value="">Toutes les élections</option>
                        {elections.map(el => (
                            <option key={el.id} value={el.id}>
                                {el.name}
                            </option>
                        ))}
                    </select>
                    <TextInput
                        iconLeft={Search}
                        placeholder="Rechercher un candidat..."
                        value={search}
                        onChange={(e) => {
                            handleSearch(e.target.value)
                            setCurrentPage(1);
                        }}
                    />
                    <button
                        onClick={resetFilters}
                        className="flex items-center gap-2  btn-secondary text-sm font-medium whitespace-nowrap"
                    >
                        <RefreshCw size={18} />
                        Réinitialiser
                    </button>
                </div>

                {/* TABLEAU */}
                <div className="bg-white rounded-2xl shadow-sm overflow-hidden">

                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[800px] ">

                            {/* HEADER */}
                            <thead className="bg-gray-50 text-[var(--color-dark)]">
                                <tr>
                                    <th className="text-left px-3 py-2 font-medium">Candidat</th>
                                    <th className="text-left px-3 py-2 font-medium">Election</th>
                                    <th className="text-left px-3 py-2 font-medium">Score</th>
                                    <th className="text-left px-3 py-2 font-medium">Votes</th>
                                    <th className="text-right px-3 py-2 font-medium">Position</th>
                                </tr>
                            </thead>

                            {/* BODY */}
                            <tbody className="divide-y divide-[var(--color-gray-light)]">
                                {paginatedResultat.map((candidate, index) => (
                                    <tr
                                        key={candidate.id}
                                        className="hover:bg-gray-50 transition"
                                    >
                                        {/* CANDIDAT */}
                                        <td className="px-3 py-2">
                                            <div className="flex items-center gap-3">
                                                <img
                                                    src={candidate.avatar}
                                                    alt={candidate.name}
                                                    className="w-10 h-10 rounded-full"
                                                />
                                                <span className="font-medium">
                                                    {candidate.name}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-3 py-2 text-gray-600">
                                            {candidate.electionId ? getElectionById(candidate.electionId) : '-'}
                                        </td>

                                        {/* SCORE */}
                                        <td className="px-3 py-2">
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold">
                                                    {candidate.score}/10
                                                </span>
                                                <div className="w-full bg-gray-200 h-2 rounded">
                                                    <div
                                                        className="bg-blue-600 h-2 rounded"
                                                        style={{
                                                            width: `${maxScore ? (candidate.score / maxScore) * 100 : 0}`,
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </td>

                                        {/* VOTES */}
                                        <td className="px-3 py-2 text-gray-600">
                                            {candidate.votes}
                                        </td>

                                        {/* POSITION */}
                                        <td className="px-3 py-2 text-right">
                                            {index === 0 && (
                                                <span className="inline-flex items-center gap-1 text-yellow-500 font-semibold">
                                                    <Trophy size={16} /> 1er
                                                </span>
                                            )}
                                            {index === 1 && (
                                                <span className="inline-flex items-center gap-1 text-gray-400">
                                                    <Medal size={16} /> 2e
                                                </span>
                                            )}
                                            {index === 2 && (
                                                <span className="inline-flex items-center gap-1 text-orange-400">
                                                    <Medal size={16} /> 3e
                                                </span>
                                            )}
                                            {index > 2 && (
                                                <span className="text-gray-500">
                                                    {index + 1}e
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {/* Pagination */}
                        <div className="flex flex-col lg:flex-row justify-between items-center px-3 py-2 text-sm gap-3">
                            <span className="text-[var(--color-gray)]">
                                Affichage de {(currentPage - 1) * itemsPerPage + 1} à{" "}
                                {Math.min(currentPage * itemsPerPage, filtered.length)} sur{" "}
                                {filtered.length}
                            </span>
                            <div className="flex gap-2">
                                <button
                                    disabled={currentPage === 1}
                                    onClick={() => setCurrentPage((p) => p - 1)}
                                    className="px-3 py-1 border rounded"><ChevronLeft size={16} /></button>
                                <span className="px-3 py-1 bg-[var(--color-primary)] text-white rounded">
                                    {currentPage} / {totalPages === 0 ? 1 : totalPages}
                                </span>
                                <button
                                    disabled={currentPage >= totalPages || totalPages === 0}
                                    onClick={() => setCurrentPage((p) => p + 1)}
                                    className="px-3 py-1 border rounded"><ChevronRight size={16} /></button>
                            </div>
                        </div>
                    </div>
                    {/* EMPTY STATE */}
                    {filtered.length === 0 && (
                        <div className="p-10 text-center text-gray-500">
                            Aucun résultat trouvé
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ResultatsJury;

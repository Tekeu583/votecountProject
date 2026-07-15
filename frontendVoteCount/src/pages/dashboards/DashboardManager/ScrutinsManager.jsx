import { useState, useEffect, useMemo } from 'react';
import { Search, Calendar, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import TextInput from '@components/ui/TextInput';
import { useNavigate } from 'react-router-dom';
import { staffApi, candidatesApi } from '@services/api';
import { FadeLoader } from 'react-spinners';

const MAX_ELECTIONS_FETCHED = 20;

const statusLabel = (status) => {
    if (status === 'ongoing') return 'En cours';
    if (['closed', 'completed', 'archived', 'cancelled'].includes(status)) return 'Terminé';
    return 'En attente';
};

const STATUS_STYLES = {
    'En cours': 'bg-blue-100 text-blue-700',
    'En attente': 'bg-gray-100 text-gray-600',
    'Terminé': 'bg-emerald-100 text-emerald-700',
};

const ScrutinsManager = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('Tous');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;
    const navigate = useNavigate();

    const [scrutins, setScrutins] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const electionsRes = await staffApi.getMyElections();
                const elections = (electionsRes.data?.data ?? []).slice(0, MAX_ELECTIONS_FETCHED);

                const enriched = await Promise.all(
                    elections.map(async (election) => {
                        const pending = await candidatesApi.getAll(election.uuid, { status: 'pending' })
                            .then((res) => res.data?.meta?.total ?? (res.data?.data ?? []).length)
                            .catch(() => 0);

                        return {
                            uuid: election.uuid,
                            titre: election.title,
                            dateLimite: election.end_at ? election.end_at.slice(0, 10) : '—',
                            candidatsCount: election.candidates_count ?? 0,
                            pending,
                            status: statusLabel(election.status),
                        };
                    })
                );

                setScrutins(enriched);
            } catch {
                toast.error('Impossible de charger vos scrutins.');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const filteredScrutins = useMemo(() => {
        return scrutins.filter((scrutin) => {
            const matchesSearch = scrutin.titre.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = statusFilter === 'Tous' || scrutin.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [searchTerm, statusFilter, scrutins]);

    const totalPages = Math.ceil(filteredScrutins.length / itemsPerPage);
    const paginatedScrutins = filteredScrutins.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const resetFilters = () => {
        setSearchTerm('');
        setStatusFilter('Tous');
        setCurrentPage(1);
    };

    if (loading) {
        return (
            <div className="h-[calc(100vh-68px)] flex items-center justify-center">
                <FadeLoader color="#1e40af" cssOverride={{ display: 'block', margin: '0 auto' }} />
            </div>
        );
    }

    return (
        <div className="flex-1 bg-[var(--color-background-white)] p-4">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Mes scrutins gérés</h1>
                    <p className="text-gray-600 mt-1">Scrutins pour lesquels vous êtes gestionnaire.</p>
                </div>

                <div className="bg-white p-4 rounded-2xl shadow-sm mb-6 flex flex-col lg:flex-row gap-4 lg:items-end">
                    <div className="flex-1">
                        <TextInput
                            iconLeft={Search}
                            placeholder="Rechercher par titre..."
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                        />
                    </div>
                    <div className="w-full lg:w-56">
                        <label className="block text-xs font-medium text-gray-500 mb-1">STATUT</label>
                        <select
                            value={statusFilter}
                            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-600"
                        >
                            <option value="Tous">Tous les statuts</option>
                            <option value="En cours">En cours</option>
                            <option value="En attente">En attente</option>
                            <option value="Terminé">Terminé</option>
                        </select>
                    </div>
                    <button onClick={resetFilters} className="flex items-center gap-2 btn-secondary text-sm font-medium whitespace-nowrap">
                        <RefreshCw size={18} /> Réinitialiser
                    </button>
                </div>

                <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[900px]">
                            <thead className="bg-gray-50 border-b border-b-[var(--color-gray-light)]">
                                <tr className="text-xs uppercase text-[var(--color-dark)]">
                                    <th className="text-left px-3 py-2 font-medium">TITRE DU SCRUTIN</th>
                                    <th className="text-left px-3 py-2 font-medium">DATE LIMITE</th>
                                    <th className="text-left px-3 py-2 font-medium">CANDIDATS</th>
                                    <th className="text-left px-3 py-2 font-medium">STATUT</th>
                                    <th className="text-left px-3 py-2 font-medium">ACTION</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--color-gray-light)]">
                                {paginatedScrutins.map((scrutin) => (
                                    <tr key={scrutin.uuid} className="hover:bg-[var(--color-gray-light)] transition-colors">
                                        <td className="px-3 py-2">
                                            <p className="font-semibold text-gray-900">{scrutin.titre}</p>
                                        </td>
                                        <td className="px-3 py-2">
                                            <div className="flex items-center gap-2 text-red-600">
                                                <Calendar size={16} />
                                                <span className="font-medium">{scrutin.dateLimite}</span>
                                            </div>
                                        </td>
                                        <td className="px-3 py-2 text-center">
                                            <span className="inline-flex items-center gap-1 bg-gray-100 px-3 py-1 rounded-full text-sm">
                                                {scrutin.candidatsCount} ({scrutin.pending} en attente)
                                            </span>
                                        </td>
                                        <td className="px-3 py-2 text-center">
                                            <span className={`inline-flex px-4 py-1 text-xs font-medium rounded-full ${STATUS_STYLES[scrutin.status]}`}>
                                                {scrutin.status}
                                            </span>
                                        </td>
                                        <td className="px-3 py-2 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => navigate(`/manager/candidats/${scrutin.uuid}`)}
                                                    className="btn-secondary text-sm font-medium"
                                                >
                                                    Candidats
                                                </button>
                                                <button
                                                    onClick={() => navigate(`/manager/results/${scrutin.uuid}`)}
                                                    className="btn-primary text-sm font-medium"
                                                >
                                                    Résultats
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {paginatedScrutins.length === 0 && (
                                    <tr>
                                        <td colSpan="5" className="text-center py-10 text-gray-500">Aucun scrutin trouvé</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex flex-col lg:flex-row justify-between items-center px-3 py-2 text-sm gap-3">
                        <span className="text-[var(--color-gray)]">
                            Affichage de {filteredScrutins.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} à{" "}
                            {Math.min(currentPage * itemsPerPage, filteredScrutins.length)} sur{" "}
                            {filteredScrutins.length}
                        </span>
                        <div className="flex gap-2">
                            <button disabled={currentPage === 1} onClick={() => setCurrentPage((p) => p - 1)} className="px-3 py-1 border rounded">
                                <ChevronLeft size={16} />
                            </button>
                            <span className="px-3 py-1 bg-[var(--color-primary)] text-white rounded">
                                {currentPage} / {totalPages || 1}
                            </span>
                            <button disabled={currentPage === totalPages || totalPages === 0} onClick={() => setCurrentPage((p) => p + 1)} className="px-3 py-1 border rounded">
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ScrutinsManager;

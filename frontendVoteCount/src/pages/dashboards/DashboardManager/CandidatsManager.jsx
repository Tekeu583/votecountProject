import { useState, useEffect, useMemo, useCallback } from 'react';
import { Search, RefreshCcw, ChevronLeft, ChevronRight, Check, X } from 'lucide-react';
import toast from 'react-hot-toast';
import TextInput from '@components/ui/TextInput';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { staffApi, candidatesApi } from '@services/api';
import { FadeLoader } from 'react-spinners';

const MAX_ELECTIONS_FETCHED = 20;

const STATUS_CONFIG = {
    approved: { label: 'Approuvé', cls: 'bg-green-100 text-green-700' },
    pending: { label: 'En attente', cls: 'bg-amber-100 text-amber-700' },
    rejected: { label: 'Rejeté', cls: 'bg-red-100 text-red-700' },
};

const CandidatsManager = () => {
    const { electionId } = useParams();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const search = searchParams.get('search') || '';

    const [elections, setElections] = useState([]);
    const [loadingElections, setLoadingElections] = useState(true);
    const [candidates, setCandidates] = useState([]);
    const [loadingCandidates, setLoadingCandidates] = useState(false);

    const [statusFilter, setStatusFilter] = useState('ALL');
    const [currentPage, setCurrentPage] = useState(1);
    const perPage = 5;

    useEffect(() => {
        const fetchElections = async () => {
            setLoadingElections(true);
            try {
                const res = await staffApi.getMyElections();
                setElections(res.data?.data ?? []);
            } catch {
                toast.error('Impossible de charger vos élections.');
            } finally {
                setLoadingElections(false);
            }
        };
        fetchElections();
    }, []);

    const getElectionTitle = useCallback((uuid) => {
        const election = elections.find((e) => e.uuid === uuid);
        return election ? election.title : '-';
    }, [elections]);

    const loadCandidates = useCallback(async () => {
        if (elections.length === 0) {
            setCandidates([]);
            return;
        }

        setLoadingCandidates(true);
        try {
            const targets = electionId
                ? elections.filter((e) => e.uuid === electionId)
                : elections.slice(0, MAX_ELECTIONS_FETCHED);

            const results = await Promise.all(
                targets.map((election) =>
                    candidatesApi.getAll(election.uuid)
                        .then((res) => (res.data?.data ?? []).map((c) => ({ ...c, electionUuid: election.uuid })))
                        .catch(() => [])
                )
            );

            setCandidates(results.flat());
        } finally {
            setLoadingCandidates(false);
        }
    }, [elections, electionId]);

    useEffect(() => {
        loadCandidates();
    }, [loadCandidates]);

    const filteredData = useMemo(() => {
        return candidates.filter((c) => {
            const matchSearch = c.full_name?.toLowerCase().includes(search.toLowerCase());
            const matchStatus = statusFilter === 'ALL' || c.status === statusFilter;
            return matchSearch && matchStatus;
        });
    }, [search, statusFilter, candidates]);

    const totalPages = Math.ceil(filteredData.length / perPage);
    const paginated = useMemo(() => {
        const start = (currentPage - 1) * perPage;
        return filteredData.slice(start, start + perPage);
    }, [filteredData, currentPage]);

    const handleSearch = (value) => {
        const params = new URLSearchParams(searchParams);
        if (value) params.set('search', value);
        else params.delete('search');
        setSearchParams(params);
        setCurrentPage(1);
    };

    const handleReset = () => {
        setSearchParams({});
        setStatusFilter('ALL');
        navigate('/manager/candidats');
        setCurrentPage(1);
    };

    const handleApprove = async (candidate) => {
        try {
            await candidatesApi.approve(candidate.uuid);
            toast.success(`${candidate.full_name} approuvé.`);
            loadCandidates();
        } catch (err) {
            toast.error(err.response?.data?.message ?? "Erreur lors de l'approbation.");
        }
    };

    const handleReject = async (candidate) => {
        const reason = window.prompt('Raison du rejet (optionnel) :') ?? '';
        try {
            await candidatesApi.reject(candidate.uuid, reason);
            toast.success(`${candidate.full_name} rejeté.`);
            loadCandidates();
        } catch (err) {
            toast.error(err.response?.data?.message ?? 'Erreur lors du rejet.');
        }
    };

    if (loadingElections) {
        return (
            <div className="h-[calc(100vh-68px)] flex items-center justify-center">
                <FadeLoader color="#1e40af" cssOverride={{ display: 'block', margin: '0 auto' }} />
            </div>
        );
    }

    return (
        <main className="p-4 space-y-6">
            <div className="flex flex-col md:flex-row justify-between gap-4">
                <h1 className="text-2xl font-bold">
                    Candidats {electionId && (<><span className="text-gray-600 font-normal"> de </span><span className="text-[var(--color-primary)]">{getElectionTitle(electionId)}</span></>)}
                </h1>
                <div className="w-full md:w-80">
                    <TextInput
                        type="text"
                        placeholder="Rechercher un candidat..."
                        value={search}
                        iconLeft={Search}
                        onChange={(e) => handleSearch(e.target.value)}
                        className="w-full"
                    />
                </div>
            </div>

            <div className="bg-white p-4 rounded-xl shadow flex flex-col md:flex-row gap-4">
                <select
                    value={electionId || ''}
                    onChange={(e) => {
                        const value = e.target.value;
                        const query = searchParams.toString();
                        setCurrentPage(1);
                        if (value) navigate(query ? `/manager/candidats/${value}?${query}` : `/manager/candidats/${value}`);
                        else navigate(query ? `/manager/candidats?${query}` : `/manager/candidats`);
                    }}
                    className="px-4 py-2 input rounded-lg"
                >
                    <option value="">Tous les scrutins</option>
                    {elections.map((el) => (
                        <option key={el.uuid} value={el.uuid}>{el.title}</option>
                    ))}
                </select>

                <select
                    value={statusFilter}
                    onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                    className="px-4 py-2 input rounded-lg"
                >
                    <option value="ALL">Tous les statuts</option>
                    <option value="pending">En attente</option>
                    <option value="approved">Approuvé</option>
                    <option value="rejected">Rejeté</option>
                </select>

                <button onClick={handleReset} className="flex items-center justify-center gap-2 px-4 py-2 btn-secondary">
                    <RefreshCcw size={16} /> Réinitialiser
                </button>
            </div>

            <div className="bg-white rounded-xl shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-[750px] w-full">
                        <thead className="bg-gray-50 text-left">
                            <tr>
                                <th className="px-4 py-3">Candidat</th>
                                <th className="px-4 py-3">Élection</th>
                                <th className="px-4 py-3">Statut</th>
                                <th className="px-4 py-3 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loadingCandidates ? (
                                <tr><td colSpan="4" className="text-center py-6 text-gray-500">Chargement...</td></tr>
                            ) : paginated.map((candidate) => {
                                const cfg = STATUS_CONFIG[candidate.status] ?? STATUS_CONFIG.pending;
                                return (
                                    <tr key={`${candidate.electionUuid}-${candidate.uuid}`} className="border-t border-t-[var(--color-gray-light)] hover:bg-[var(--color-gray-light)]">
                                        <td className="px-4 py-3">
                                            <p className="font-medium">{candidate.full_name}</p>
                                        </td>
                                        <td className="px-4 py-3">{getElectionTitle(candidate.electionUuid)}</td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 rounded text-xs font-medium ${cfg.cls}`}>{cfg.label}</span>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            {candidate.status === 'pending' ? (
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => handleApprove(candidate)}
                                                        title="Approuver"
                                                        className="p-1.5 rounded hover:bg-green-50 text-green-600"
                                                    >
                                                        <Check size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleReject(candidate)}
                                                        title="Rejeter"
                                                        className="p-1.5 rounded hover:bg-red-50 text-red-600"
                                                    >
                                                        <X size={18} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <span className="text-gray-400 text-sm">—</span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                            {!loadingCandidates && paginated.length === 0 && (
                                <tr>
                                    <td colSpan="4" className="text-center py-6 text-gray-500">Aucun candidat trouvé</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="flex flex-col md:flex-row justify-between items-center p-4 gap-3 text-sm">
                    <span className="text-gray-500">
                        {filteredData.length === 0 ? 0 : (currentPage - 1) * perPage + 1} -{" "}
                        {Math.min(currentPage * perPage, filteredData.length)} sur{" "}
                        {filteredData.length}
                    </span>
                    <div className="flex items-center gap-2">
                        <button onClick={() => setCurrentPage((p) => p - 1)} disabled={currentPage === 1} className="px-3 py-1 border rounded disabled:opacity-50">
                            <ChevronLeft size={16} />
                        </button>
                        <span className="px-3 py-1 bg-blue-600 text-white rounded">{currentPage}/{totalPages || 1}</span>
                        <button onClick={() => setCurrentPage((p) => p + 1)} disabled={currentPage === totalPages || totalPages === 0} className="px-3 py-1 border rounded disabled:opacity-50">
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            </div>
        </main>
    );
};

export default CandidatsManager;

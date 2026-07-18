import { Search, Eye, ChevronLeft, ChevronRight, Wallet, Clock, CheckCircle, BadgeDollarSign } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import WithdrawalReviewModal from './WithdrawalReviewModal';
import TextInput from '@components/ui/TextInput';
import { withdrawalsApi } from '@services/api';
import StatCard from '@components/dashboard/StatCard';
import { FadeLoader } from 'react-spinners';

const STATUS_STYLES = {
    pending: 'bg-yellow-100 text-yellow-700',
    approved: 'bg-blue-100 text-blue-700',
    paid: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
    cancelled: 'bg-gray-100 text-gray-700',
};

const EMPTY_PAGE = {
    data: [],
    meta: { current_page: 1, last_page: 1, per_page: 15, total: 0, from: 0, to: 0 },
};

function useDebounce(value, delay = 400) {
    const [debounced, setDebounced] = useState(value);
    useEffect(() => {
        const timer = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(timer);
    }, [value, delay]);
    return debounced;
}

export default function WithdrawalsPage() {
    const [selected, setSelected] = useState(null);
    const [openModal, setOpenModal] = useState(false);
    const [loading, setLoading] = useState(false);

    const [withdrawals, setWithdrawals] = useState(EMPTY_PAGE);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [page, setPage] = useState(1);
    const debouncedSearch = useDebounce(search, 400);

    const fetchWithdrawals = useCallback(async () => {
        setLoading(true);
        try {
            const response = await withdrawalsApi.getAll({
                page,
                status: statusFilter || undefined,
                per_page: 15,
            });
            const data = response.data?.data ?? [];
            const meta = response.data?.meta ?? EMPTY_PAGE.meta;
            setWithdrawals({ data, meta });
        } catch {
            toast.error('Impossible de charger les demandes de retrait');
            setWithdrawals(EMPTY_PAGE);
        } finally {
            setLoading(false);
        }
    }, [page, statusFilter]);

    useEffect(() => {
        fetchWithdrawals();
    }, [fetchWithdrawals]);

    useEffect(() => {
        setPage(1);
    }, [debouncedSearch, statusFilter]);

    const { data: rows, meta } = withdrawals;
    const filteredRows = debouncedSearch
        ? rows.filter((w) => (w.organization?.name ?? '').toLowerCase().includes(debouncedSearch.toLowerCase()))
        : rows;

    const pendingCount = rows.filter((w) => w.status === 'pending').length;
    const approvedCount = rows.filter((w) => w.status === 'approved').length;
    const paidTotal = rows.filter((w) => w.status === 'paid').reduce((sum, w) => sum + Number(w.amount ?? 0), 0);

    const openReview = (withdrawal) => {
        setSelected(withdrawal);
        setOpenModal(true);
    };

    return (
        <div className="p-2 space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <h1 className="text-xl lg:text-2xl font-bold text-[var(--text-primary)]">
                    Demandes de retrait
                </h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard
                    title="En attente"
                    value={pendingCount}
                    icon={Clock}
                    className="text-yellow-600"
                    borderColor="[var(--color-warning)]"
                    color="bg-yellow-50"
                    delay={100}
                />
                <StatCard
                    title="Approuvées (à payer)"
                    value={approvedCount}
                    icon={CheckCircle}
                    className="text-blue-600"
                    borderColor="[var(--color-primary)]"
                    color="bg-blue-50"
                    delay={200}
                />
                <StatCard
                    title="Total payé (page)"
                    value={`${paidTotal.toLocaleString('fr-FR')} CFA`}
                    icon={BadgeDollarSign}
                    className="text-green-600"
                    borderColor="[var(--color-success)]"
                    color="bg-green-50"
                    delay={300}
                />
            </div>

            <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
                <div className="relative w-full lg:w-2/3">
                    <TextInput
                        type="text"
                        placeholder="Rechercher une organisation..."
                        iconLeft={Search}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full lg:w-auto border border-[var(--color-gray-light)] bg-[var(--color-white)] rounded-[var(--radius-md)] px-5 py-3.5 text-sm focus:outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] transition-all"
                >
                    <option value="">Tous les statuts</option>
                    <option value="pending">En attente</option>
                    <option value="approved">Approuvé</option>
                    <option value="paid">Payé</option>
                    <option value="rejected">Rejeté</option>
                    <option value="cancelled">Annulé</option>
                </select>
            </div>

            <div className="bg-[var(--color-background-white)] rounded-[var(--radius-sm)] shadow-[var(--shadow-md)] overflow-x-auto">
                {(() => {
                    if (loading) {
                        return (
                            <div className="flex items-center justify-center">
                                <div className="text-center">
                                    <FadeLoader color="#1e40af" size={48} cssOverride={{ display: 'block', margin: '0 auto' }} />
                                    <p className="mt-4 text-gray-600">Chargement...</p>
                                </div>
                            </div>
                        );
                    }
                    if (filteredRows.length === 0) {
                        return (
                            <div className="flex flex-col items-center justify-center p-12 text-center">
                                <Wallet size={48} className="text-gray-300 mb-4" />
                                <h3 className="text-lg font-semibold text-gray-600">Aucune demande de retrait</h3>
                            </div>
                        );
                    }
                    return (
                        <table className="w-full text-sm">
                            <thead className="bg-[var(--color-gray-light)] text-[var(--color-dark)] text-md capitalize">
                                <tr>
                                    <th className="p-2 text-left">Organisation</th>
                                    <th className="p-2 text-left">Montant</th>
                                    <th className="p-2 text-left">Numéro</th>
                                    <th className="p-2 text-left">Statut</th>
                                    <th className="p-2 text-left">Date</th>
                                    <th className="p-2 text-left">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredRows.map((w) => (
                                    <tr key={w.uuid} className="hover:bg-[var(--color-gray-light)] border-t border-t-[var(--color-gray-light)]">
                                        <td className="p-2 font-medium">{w.organization?.name ?? '—'}</td>
                                        <td className="p-2">{Number(w.amount).toLocaleString('fr-FR')} {w.currency}</td>
                                        <td className="p-2">{w.phone_number}</td>
                                        <td className="p-2">
                                            <span className={`px-2 py-1 rounded-full text-xs whitespace-nowrap ${STATUS_STYLES[w.status] ?? 'bg-gray-100 text-gray-600'}`}>
                                                {w.status_label}
                                            </span>
                                        </td>
                                        <td className="p-2">{new Date(w.created_at).toLocaleDateString('fr-FR')}</td>
                                        <td className="p-2">
                                            <button
                                                onClick={() => openReview(w)}
                                                className="text-[var(--color-gray)] hover:text-[var(--color-primary)]"
                                                title="Examiner la demande"
                                            >
                                                <Eye size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    );
                })()}

                {!loading && meta.total > 0 && (
                    <div className="flex flex-col lg:flex-row justify-between items-center p-4 text-sm gap-3">
                        <span className="text-[var(--color-gray)]">
                            {meta.from}–{meta.to} sur {meta.total} demandes
                        </span>
                        <div className="flex gap-2 items-center">
                            <button
                                disabled={meta.current_page === 1}
                                onClick={() => setPage((p) => p - 1)}
                                className="px-3 py-1 border rounded disabled:opacity-40"
                            >
                                <ChevronLeft size={16} />
                            </button>
                            <span className="px-3 py-1 bg-[var(--color-primary)] text-white rounded">
                                {meta.current_page} / {meta.last_page}
                            </span>
                            <button
                                disabled={meta.current_page === meta.last_page}
                                onClick={() => setPage((p) => p + 1)}
                                className="px-3 py-1 border rounded disabled:opacity-40"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {openModal && selected && (
                <WithdrawalReviewModal
                    withdrawal={selected}
                    onClose={() => setOpenModal(false)}
                    onSuccess={(message) => {
                        setOpenModal(false);
                        toast.success(message);
                        fetchWithdrawals();
                    }}
                    onError={(message) => toast.error(message)}
                />
            )}
        </div>
    );
}

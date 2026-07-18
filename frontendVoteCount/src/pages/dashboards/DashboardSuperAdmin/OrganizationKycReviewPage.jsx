import { ShieldCheck, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import KycReviewModal from './KycReviewModal';
import { kycApi } from '@services/api';
import { FadeLoader } from 'react-spinners';

const EMPTY_PAGE = {
    data: [],
    meta: { current_page: 1, last_page: 1, per_page: 15, total: 0, from: 0, to: 0 },
};

export default function OrganizationKycReviewPage() {
    const [selected, setSelected] = useState(null);
    const [openModal, setOpenModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [organizations, setOrganizations] = useState(EMPTY_PAGE);

    const fetchPending = useCallback(async () => {
        setLoading(true);
        try {
            const response = await kycApi.getPending({ page, per_page: 15 });
            const data = response.data?.data ?? [];
            const meta = response.data?.meta ?? EMPTY_PAGE.meta;
            setOrganizations({ data, meta });
        } catch {
            toast.error('Impossible de charger les demandes de vérification KYC');
            setOrganizations(EMPTY_PAGE);
        } finally {
            setLoading(false);
        }
    }, [page]);

    useEffect(() => {
        fetchPending();
    }, [fetchPending]);

    const { data: orgs, meta } = organizations;

    const openReview = (org) => {
        setSelected(org);
        setOpenModal(true);
    };

    return (
        <div className="p-2 space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <h1 className="text-xl lg:text-2xl font-bold text-[var(--text-primary)]">
                    Vérifications KYC en attente
                </h1>
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
                    if (orgs.length === 0) {
                        return (
                            <div className="flex flex-col items-center justify-center p-12 text-center">
                                <ShieldCheck size={48} className="text-gray-300 mb-4" />
                                <h3 className="text-lg font-semibold text-gray-600">Aucune demande en attente</h3>
                            </div>
                        );
                    }
                    return (
                        <table className="w-full text-sm">
                            <thead className="bg-[var(--color-gray-light)] text-[var(--color-dark)] text-md capitalize">
                                <tr>
                                    <th className="p-2 text-left">Organisation</th>
                                    <th className="p-2 text-left">Représentant légal</th>
                                    <th className="p-2 text-left">Soumis le</th>
                                    <th className="p-2 text-left">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orgs.map((org) => (
                                    <tr key={org.uuid} className="hover:bg-[var(--color-gray-light)] border-t border-t-[var(--color-gray-light)]">
                                        <td className="p-2 flex items-center gap-3">
                                            <img src={org.logo} alt={org.name} className="w-10 h-10 rounded-full object-cover" />
                                            <div>
                                                <p className="font-medium">{org.name}</p>
                                                <p className="text-xs text-[var(--color-gray)]">{org.email}</p>
                                            </div>
                                        </td>
                                        <td className="p-2">{org.kyc_legal_representative_name ?? '—'}</td>
                                        <td className="p-2">
                                            {org.kyc_submitted_at ? new Date(org.kyc_submitted_at).toLocaleDateString('fr-FR') : '—'}
                                        </td>
                                        <td className="p-2">
                                            <button
                                                onClick={() => openReview(org)}
                                                className="text-[var(--color-gray)] hover:text-[var(--color-primary)]"
                                                title="Examiner"
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
                <KycReviewModal
                    organization={selected}
                    onClose={() => setOpenModal(false)}
                    onSuccess={(message) => {
                        setOpenModal(false);
                        toast.success(message);
                        fetchPending();
                    }}
                    onError={(message) => toast.error(message)}
                />
            )}
        </div>
    );
}

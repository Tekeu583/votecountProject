// pages/dashboards/DashboardAdminOrg/Categories.jsx
//
// Vue d'ensemble en lecture seule des catégories de toutes les élections
// de l'organisation. Une catégorie appartient toujours à une élection
// précise — la création/renommage/suppression se fait depuis la page
// d'édition de ce scrutin (CategoryManager, EditScrutin.jsx), pas ici.
import { Search, ChevronLeft, ChevronRight, Notebook, Pencil } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { NavLink } from 'react-router-dom';
import { useDebounce } from '@hooks/useDebounce';
import toast from 'react-hot-toast';
import TextInput from '@components/ui/TextInput';
import { categoriesApi } from '@services/api';
import { useOrg } from '@hooks/useOrg';
import { FadeLoader } from 'react-spinners';

const EMPTY_PAGE = {
    data: [],
    meta: { current_page: 1, last_page: 1, per_page: 15, total: 0, from: 0, to: 0 },
};

export default function Categories() {
    const { org } = useOrg();

    const [categories, setCategories] = useState(EMPTY_PAGE);
    const [loading, setLoading] = useState(false);

    const [search, setSearch] = useState('');
    const debouncedSearch = useDebounce(search, 400);
    const [statusFilter, setStatusFilter] = useState('all');
    const [page, setPage] = useState(1);

    const fetchCategories = useCallback(async () => {
        if (!org?.uuid) return;
        setLoading(true);
        try {
            const res = await categoriesApi.getAll({
                organization_uuid: org.uuid,
                page,
                per_page: 15,
                search: debouncedSearch || undefined,
                status: statusFilter !== 'all' ? statusFilter : undefined,
            });
            setCategories({
                data: res.data?.data ?? [],
                meta: res.data?.meta ?? EMPTY_PAGE.meta,
            });
        } catch {
            toast.error('Impossible de charger les catégories.');
            setCategories(EMPTY_PAGE);
        } finally {
            setLoading(false);
        }
    }, [org?.uuid, page, debouncedSearch, statusFilter]);

    useEffect(() => { fetchCategories(); }, [fetchCategories]);
    useEffect(() => { setPage(1); }, [debouncedSearch, statusFilter]);

    const { data: items, meta } = categories;

    return (
        <div className="p-2 space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                    <h1 className="text-xl lg:text-2xl font-bold text-[var(--color-dark)]">
                        Catégories
                    </h1>
                    <p className="text-sm text-[var(--color-gray)]">
                        Toutes les catégories de vos scrutins — la gestion (ajout, renommage, suppression) se fait depuis la page de chaque scrutin.
                    </p>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
                <div className="relative w-full lg:w-2/3">
                    <TextInput
                        type="text"
                        placeholder="Rechercher une catégorie..."
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
                    <option value="all">Tous les statuts</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                </select>
            </div>

            <div className="bg-[var(--color-white)] rounded-[var(--radius-md)] shadow-[var(--shadow-md)] border border-gray-100 overflow-x-auto">
                {(() => {
                    if (loading) {
                        return (
                            <div className="flex items-center justify-center py-20">
                                <FadeLoader color="#1e40af" cssOverride={{ display: 'block', margin: '0 auto' }} />
                            </div>
                        );
                    }
                    if (items.length === 0) {
                        return (
                            <div className="text-center py-20">
                                <Notebook size={40} className="text-gray-300 mx-auto mb-3" />
                                <p className="text-[var(--color-gray)] font-medium">Aucune catégorie trouvée</p>
                                <p className="text-sm text-gray-700 mt-1">
                                    Activez les catégories lors de la création d'un scrutin pour en ajouter.
                                </p>
                            </div>
                        );
                    }
                    return (
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-[var(--color-gray-light)] border-b border-[var(--color-gray-light)]">
                                    <th className="text-left px-5 py-3.5 font-medium text-[var(--color-dark)]">Nom</th>
                                    <th className="text-left px-5 py-3.5 font-medium text-[var(--color-dark)]">Élection</th>
                                    <th className="text-left px-5 py-3.5 font-medium text-[var(--color-dark)]">Statut</th>
                                    <th className="text-center px-5 py-3.5 font-medium text-[var(--color-dark)]">Candidats</th>
                                    <th className="w-12 px-5 py-3.5" />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--color-gray-light)]">
                                {items.map((c) => (
                                    <tr key={c.uuid} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-5 py-3">
                                            <div className="flex items-center gap-2">
                                                <span className="w-3 h-3 rounded-full inline-block shrink-0" style={{ backgroundColor: c.color || '#3B82F6' }} />
                                                <span className="font-medium text-[var(--color-dark)]">{c.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3 text-gray-700">
                                            {c.election?.title ?? '—'}
                                        </td>
                                        <td className="px-5 py-3">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${c.status === 'active' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'}`}>
                                                {c.status === 'active' ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3 text-center">{c.candidates_count ?? 0}</td>
                                        <td className="px-5 py-3">
                                            {c.election?.uuid && (
                                                <NavLink
                                                    to={`/org/${org?.uuid}/scrutins/${c.election.uuid}/edit`}
                                                    className="text-[var(--color-gray)] hover:text-[var(--color-primary)]"
                                                    title="Gérer depuis le scrutin"
                                                >
                                                    <Pencil size={16} />
                                                </NavLink>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    );
                })()}
            </div>

            {!loading && meta.total > 0 && (
                <div className="flex flex-col lg:flex-row justify-between items-center p-4 text-sm gap-3">
                    <span className="text-[var(--color-gray)]">
                        {meta.from}–{meta.to} sur {meta.total} catégorie{meta.total > 1 ? 's' : ''}
                    </span>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setPage((p) => Math.max(p - 1, 1))}
                            disabled={page === 1}
                            className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <button className="px-3 py-1 bg-[var(--color-primary)] text-white rounded">
                            {meta.current_page} / {meta.last_page}
                        </button>
                        <button
                            onClick={() => setPage((p) => Math.min(p + 1, meta.last_page || 1))}
                            disabled={page >= (meta.last_page || 1)}
                            className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

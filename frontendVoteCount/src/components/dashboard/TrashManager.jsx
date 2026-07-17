import { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import {
    Search,
    Trash2,
    RotateCw,
    FileText,
    Users,
    AlertCircle,
    ChevronLeft,
    ChevronRight,
    RefreshCw,
} from 'lucide-react';
import toast from 'react-hot-toast';
import TextInput from '@components/ui/TextInput';
import { FadeLoader } from 'react-spinners';
import { useDebounce } from '@hooks/useDebounce';
import { trashApi } from '@services/api';

const ENTITY_ICONS = {
    'App\\Models\\Election': { icon: FileText, color: 'bg-blue-100 text-blue-600' },
    'App\\Models\\Candidate': { icon: Users, color: 'bg-purple-100 text-purple-600' },
};

const remainingDays = (expiresAt) => {
    const diff = new Date(expiresAt).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
};

const getRemainingColor = (days) => {
    if (days <= 5) return 'text-red-600';
    if (days <= 15) return 'text-orange-600';
    return 'text-emerald-600';
};

/**
 * Corbeille (soft-delete) — partagée entre la vue org-owner (scopée sur son
 * organisation, via le wrapper Corbeille.jsx qui lit useOrg()) et la vue
 * super-admin (globale, ou filtrée par organisation via le sélecteur).
 * Ne dépend pas de useOrg() elle-même — utilisable hors OrgProvider.
 */
const TrashManager = ({ organizationUuid, ready = true }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearch = useDebounce(searchTerm, 400);
    const [selectedItems, setSelectedItems] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);

    const [loading, setLoading] = useState(true);
    const [items, setItems] = useState([]);
    const [meta, setMeta] = useState({ total: 0, last_page: 1 });

    const loadTrash = useCallback(async () => {
        if (!ready) return;
        setLoading(true);
        try {
            const res = await trashApi.getAll({
                ...(organizationUuid ? { organization_uuid: organizationUuid } : {}),
                search: debouncedSearch || undefined,
                page: currentPage,
                per_page: 10,
            });
            setItems(res.data?.data ?? []);
            setMeta(res.data?.meta ?? { total: 0, last_page: 1 });
        } catch {
            toast.error('Erreur de chargement de la corbeille.');
        } finally {
            setLoading(false);
        }
    }, [ready, organizationUuid, debouncedSearch, currentPage]);

    useEffect(() => { loadTrash(); }, [loadTrash]);
    useEffect(() => { setCurrentPage(1); }, [organizationUuid]);

    const toggleSelect = (uuid) => {
        setSelectedItems(prev =>
            prev.includes(uuid) ? prev.filter(item => item !== uuid) : [...prev, uuid]
        );
    };

    const toggleSelectAll = () => {
        setSelectedItems(selectedItems.length === items.length ? [] : items.map(item => item.uuid));
    };

    const handleRestore = async (uuid) => {
        try {
            await trashApi.restore(uuid);
            toast.success('Élément restauré avec succès', { duration: 3000 });
            setSelectedItems((prev) => prev.filter((id) => id !== uuid));
            loadTrash();
        } catch (error) {
            toast.error(error.response?.data?.message ?? 'Erreur lors de la restauration.');
        }
    };

    const handleForceDelete = async (uuid) => {
        if (!window.confirm('Supprimer définitivement cet élément ? Cette action est irréversible.')) return;
        try {
            await trashApi.forceDelete(uuid);
            toast.success('Élément supprimé définitivement.');
            setSelectedItems((prev) => prev.filter((id) => id !== uuid));
            loadTrash();
        } catch (error) {
            toast.error(error.response?.data?.message ?? 'Erreur lors de la suppression.');
        }
    };

    const handleRestoreSelected = async () => {
        if (selectedItems.length === 0) {
            toast.error("Aucun élément sélectionné");
            return;
        }
        try {
            await Promise.all(selectedItems.map((uuid) => trashApi.restore(uuid)));
            toast.success(`${selectedItems.length} élément(s) restauré(s)`);
            setSelectedItems([]);
            loadTrash();
        } catch {
            toast.error('Erreur lors de la restauration groupée.');
        }
    };

    const handleDeleteSelected = async () => {
        if (selectedItems.length === 0) {
            toast.error("Aucun élément sélectionné");
            return;
        }
        if (!window.confirm(`Supprimer définitivement ${selectedItems.length} élément(s) ? Cette action est irréversible.`)) return;
        try {
            await Promise.all(selectedItems.map((uuid) => trashApi.forceDelete(uuid)));
            toast.success(`${selectedItems.length} élément(s) supprimé(s) définitivement`);
            setSelectedItems([]);
            loadTrash();
        } catch {
            toast.error('Erreur lors de la suppression groupée.');
        }
    };

    const resetFilters = () => {
        setSearchTerm('');
        setSelectedItems([]);
        setCurrentPage(1);
    };

    return (
        <div className="flex-1 bg-[var(--color-background-white)] p-4 lg:p-6 min-h-screen">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl lg:text-3xl font-semibold text-[var(--color-dark)]">Corbeille</h1>
                    <p className="text-[var(--color-gray)] mt-1">Éléments supprimés récemment</p>
                </div>
            </div>

            {/* Info Banner */}
            <div className="bg-blue-50 border border-blue-200 rounded-[var(--radius-md)] p-4 mb-8 flex items-start gap-4">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <AlertCircle size={20} className="text-blue-600" />
                </div>
                <div>
                    <p className="font-medium text-blue-900">Rétention automatique</p>
                    <p className="text-sm text-blue-700 mt-1">
                        Les éléments supprimés sont conservés pendant <strong>60 jours</strong> avant d'être définitivement effacés de nos serveurs sécurisés.
                    </p>
                </div>
            </div>

            {/* Search Bar */}
            <div className="bg-white rounded-[var(--radius-md)] shadow-sm p-4 mb-6 flex items-center gap-4">
                <div className="text-sm text-[var(--color-gray)] whitespace-nowrap">
                    {meta.total} élément{meta.total > 1 ? 's' : ''} trouvé{meta.total > 1 ? 's' : ''}
                </div>
                <div className="flex-1 relative">
                    <TextInput
                        iconLeft={Search}
                        placeholder="Rechercher dans la corbeille..."
                        value={searchTerm}
                        onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                        className="w-full"
                    />
                </div>
                <div className="flex items-end">
                    <button
                        onClick={resetFilters}
                        className="flex items-center gap-2 px-5 py-3 btn-secondary  font-medium"
                    >
                        <RefreshCw size={18} />
                        Réinitialiser
                    </button>
                </div>

            </div>
            {selectedItems.length > 0 && (
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-[var(--color-gray-light)] text-[var(--color-dark)] px-4 md:px-6 py-3 rounded-md mb-4">
                    <span>{selectedItems.length} élément(s) sélectionné(s)</span>

                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full md:w-auto">
                        <button
                            onClick={handleRestoreSelected}
                            className="bg-white text-[var(--color-primary)] btn-secondary px-4 py-1 rounded w-full sm:w-auto"
                        >
                            Restaurer
                        </button>

                        <button
                            onClick={handleDeleteSelected}
                            className="bg-red-600 px-4 py-1 rounded text-[var(--color-white)] min-h-10 w-full sm:w-auto"
                        >
                            Supprimer définitivement
                        </button>
                    </div>
                </div>
            )}

            {/* Table */}
            <div className="bg-white rounded-[var(--radius-md)] shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                    <h2 className="font-semibold text-lg text-[var(--color-dark)]">Historique des suppressions</h2>
                    <span className="text-xs bg-gray-100 px-3 py-1 rounded-full text-gray-600">
                        {meta.total} éléments
                    </span>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full min-w-[900px]">
                        <thead>
                            <tr className="border-b border-[var(--color-gray-light)] bg-gray-50 text-xs uppercase tracking-wider text-[var(--color-dark)]">
                                <th className="text-left p-4 font-medium">NOM DE L'ÉLÉMENT</th>
                                <th className="text-left p-4 font-medium">TYPE</th>
                                <th className="text-left p-4 font-medium">SUPPRIMÉ LE</th>
                                <th className="text-left p-4 font-medium">DÉLAI RESTANT</th>
                                <th className="text-left p-4 font-medium pr-8">ACTIONS</th>
                                <th className=" text-left p-4">
                                    <input
                                        type="checkbox"
                                        checked={items.length > 0 && selectedItems.length === items.length}
                                        onChange={toggleSelectAll}
                                    />
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--color-gray-light)]">
                            {loading ? (
                                <tr><td colSpan={6} className="text-center py-16"><FadeLoader color="#1e40af" cssOverride={{ display: 'inline-block' }} /></td></tr>
                            ) : items.map((item) => {
                                const { icon: Icon, color } = ENTITY_ICONS[item.entity_type] ?? { icon: FileText, color: 'bg-gray-100 text-gray-600' };
                                const days = remainingDays(item.expires_at);
                                return (
                                    <tr key={item.uuid} className="hover:bg-[var(--color-gray-light)] transition-colors">
                                        <td className="px-3 py-2">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}>
                                                    <Icon size={20} />
                                                </div>
                                                <p className="font-medium text-[var(--color-dark)]">{item.name}</p>
                                            </div>
                                        </td>

                                        <td className="px-3 py-2">
                                            <span className="inline-flex px-3 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">
                                                {item.entity_label}
                                            </span>
                                        </td>

                                        <td className="px-3 py-2 text-sm text-gray-600">{new Date(item.deleted_at).toLocaleDateString('fr-FR')}</td>

                                        <td className="px-3 py-2">
                                            <div className={`text-xs font-medium ${getRemainingColor(days)}`}>
                                                {days} jour{days > 1 ? 's' : ''} restant{days > 1 ? 's' : ''}
                                            </div>
                                        </td>

                                        <td className="px-3 py-2 text-right pr-8">
                                            <div className="flex items-center justify-end gap-3">
                                                <button
                                                    onClick={() => handleRestore(item.uuid)}
                                                    className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors"
                                                >
                                                    <RotateCw size={16} />
                                                    Restaurer
                                                </button>
                                                <button
                                                    onClick={() => handleForceDelete(item.uuid)}
                                                    className="flex items-center gap-1.5 text-red-600 hover:text-red-700 font-medium text-sm transition-colors"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                        <td className="px-3 py-2">
                                            <input
                                                type="checkbox"
                                                checked={selectedItems.includes(item.uuid)}
                                                onChange={() => toggleSelect(item.uuid)}
                                            />
                                        </td>
                                    </tr>
                                );
                            })}

                            {!loading && items.length === 0 && (
                                <tr>
                                    <td colSpan="6" className="p-16 text-center">
                                        <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                            <Trash2 size={32} className="text-gray-400" />
                                        </div>
                                        <p className="text-gray-500">Aucun élément trouvé dans la corbeille</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between text-sm text-[var(--color-gray)]">
                    <span>{meta.total} élément{meta.total > 1 ? 's' : ''}</span>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                            disabled={currentPage === 1}
                            className="p-2 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ChevronLeft size={18} />
                        </button>
                        <button className="px-4 py-1 bg-[var(--color-primary)] text-white rounded">{currentPage}</button>
                        <button
                            onClick={() => setCurrentPage((p) => Math.min(p + 1, meta.last_page || 1))}
                            disabled={currentPage >= (meta.last_page || 1)}
                            className="p-2 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

TrashManager.propTypes = {
    organizationUuid: PropTypes.string,
    ready: PropTypes.bool,
};

export default TrashManager;

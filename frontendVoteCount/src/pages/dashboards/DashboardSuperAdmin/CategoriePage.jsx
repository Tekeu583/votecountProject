import {
    Plus,
    Pencil,
    Trash2,
    Search,
    RefreshCw,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";

import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import TextInput from "@components/ui/TextInput";
import CategorieModal from "./CategorieModal";
import { categoriesApi } from "@services/api";

// Empêche un appel API à chaque frappe : attend 400ms d'inactivité.
function useDebounce(value, delay = 400) {
    const [debounced, setDebounced] = useState(value);
    useEffect(() => {
        const timer = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(timer);
    }, [value, delay]);
    return debounced;
}

const EMPTY_PAGE = {
    data: [],
    meta: { current_page: 1, last_page: 1, per_page: 15, total: 0, from: 0, to: 0 },
};

export default function CategoriePage() {
    // STATE
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState(EMPTY_PAGE);

    const [search, setSearch] = useState("");
    const debouncedSearch = useDebounce(search);
    const [openModal, setOpenModal] = useState(false);
    const [selected, setSelected] = useState(null);
    const [page, setPage] = useState(1);

    const fetchCategories = useCallback(async () => {
        setLoading(true);
        try {
            const response = await categoriesApi.getAll({
                page,
                per_page: 10,
                ...(debouncedSearch ? { search: debouncedSearch } : {}),
            });
            setCategories({
                data: response.data?.data ?? [],
                meta: response.data?.meta ?? EMPTY_PAGE.meta,
            });
        } catch (error) {
            toast.error(error.response?.data?.message ?? "Impossible de charger les catégories");
            setCategories(EMPTY_PAGE);
        } finally {
            setLoading(false);
        }
    }, [page, debouncedSearch]);

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    // Revenir à la page 1 à chaque nouvelle recherche
    useEffect(() => {
        setPage(1);
    }, [debouncedSearch]);

    // DELETE
    const handleDelete = async (uuid) => {
        if (!window.confirm("Supprimer cette catégorie ?")) return;
        try {
            await categoriesApi.delete(uuid);
            toast.success("Catégorie supprimée");
            fetchCategories();
        } catch (error) {
            toast.error(error.response?.data?.message ?? "Impossible de supprimer cette catégorie");
        }
    };

    const { data: items, meta } = categories;

    return (
        <div className="p-2 space-y-6">

            {/* HEADER */}
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <h1 className="text-xl lg:text-2xl font-bold">
                        Gestion des Catégories
                    </h1>
                    <p className="text-sm text-[var(--color-gray)]">
                        Créez et gérez les catégories d’élections
                    </p>
                </div>

                <button
                    onClick={() => {
                        setSelected(null);
                        setOpenModal(true);
                    }}
                    className="btn-primary flex items-center justify-center gap-2 w-full lg:w-auto"
                >
                    <Plus size={16} />
                    Nouvelle Catégorie
                </button>
            </div>

            {/* SEARCH */}
            <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
                <div className="relative w-full md:w-1/2">
                    <TextInput
                        iconLeft={Search}
                        placeholder="Rechercher une catégorie..."
                        className="w-full pl-9"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <button
                    onClick={() => {
                        setSearch('');
                    }}
                    className="flex items-center gap-2 btn-secondary font-medium transition-colors  whitespace-nowrap"
                >
                    <RefreshCw size={16} />Réinitialiser
                </button>
            </div>

            {/* TABLE DESKTOP */}
            <div className="bg-[var(--color-white)] rounded shadow overflow-x-auto">
                <table className="w-full text-sm min-w-[600px]">
                    <thead className="bg-[var(--color-gray-light)] text-left">
                        <tr>
                            <th className="p-3">Nom</th>
                            <th className="p-3">Statut</th>
                            <th className="p-3">Candidats</th>
                            <th className="p-3">Description</th>
                            <th className="p-3 text-center">Actions</th>
                        </tr>
                    </thead>

                    <tbody>
                        {loading && (
                            <tr>
                                <td className="p-6 text-center text-[var(--color-gray)]" colSpan={5}>
                                    Chargement...
                                </td>
                            </tr>
                        )}
                        {!loading && items.map((c) => (
                            <tr key={c.uuid} className="border-t border-t-[var(--color-gray-light)] hover:bg-[var(--color-gray-light)]">
                                <td className="p-3 font-medium flex items-center gap-2">
                                    <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: c.color || '#3B82F6' }} />
                                    {c.name}
                                </td>
                                <td className="p-3">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${c.status === 'active' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'}`}>
                                        {c.status === 'active' ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                                <td className="p-3">{c.candidates_count ?? 0}</td>
                                <td className="p-3 truncate max-w-[250px]">
                                    {c.description || '—'}
                                </td>

                                <td className="p-3 flex justify-center gap-3">
                                    <Pencil
                                        size={16}
                                        className="cursor-pointer text-[var(--color-primary)]"
                                        onClick={() => {
                                            setSelected(c);
                                            setOpenModal(true);
                                        }}
                                    />

                                    <Trash2
                                        size={16}
                                        className="cursor-pointer text-[var(--color-danger)]"
                                        onClick={() => handleDelete(c.uuid)}
                                    />
                                </td>
                            </tr>
                        ))}
                        {!loading && items.length === 0 && (
                            <tr>
                                <td className="p-6 text-center text-[var(--color-gray)]" colSpan={5}>
                                    Aucune catégorie trouvée
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            {/* Pagination */}
            {!loading && meta.total > 0 && (
                <div className="flex flex-col lg:flex-row justify-between items-center p-4 text-sm gap-3">
                    <span className="text-[var(--color-gray)]">
                        Affichage de {meta.from} à {meta.to} sur {meta.total}
                    </span>

                    <div className="flex gap-2">
                        <button
                            disabled={page === 1}
                            onClick={() => setPage((p) => p - 1)}
                            className="px-3 py-1 border rounded disabled:opacity-50"><ChevronLeft size={16} /></button>
                        <span className="px-3 py-1 bg-[var(--color-primary)] text-white rounded">
                            {meta.current_page} / {meta.last_page}
                        </span>
                        <button
                            disabled={page === meta.last_page}
                            onClick={() => setPage((p) => p + 1)}
                            className="px-3 py-1 border rounded disabled:opacity-50"><ChevronRight size={16} /></button>
                    </div>
                </div>
            )}

            {/* MODAL */}
            {openModal && (
                <CategorieModal
                    data={selected}
                    onClose={() => {
                        setOpenModal(false);
                        setSelected(null);
                    }}
                    onSuccess={(message) => {
                        toast.success(message);
                        setOpenModal(false);
                        setSelected(null);
                        fetchCategories();
                    }}
                    onError={(msg) => toast.error(msg)}
                />
            )}
        </div>
    );
}

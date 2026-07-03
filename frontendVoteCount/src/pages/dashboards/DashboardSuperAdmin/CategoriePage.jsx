import {
    Plus,
    Pencil,
    Trash2,
    Search,
    RefreshCw,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";

import { useState, useMemo, useEffect } from "react";
import toast from "react-hot-toast";
import TextInput from "@components/ui/TextInput";
import CategorieModal from "./CategorieModal";
import { categoriesApi } from "@services/api";


export default function CategoriePage() {
    // STATE
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState([
        {
            id: 1,
            name: "Miss",
            label: "Concours de beauté",
            description: "Élections de type Miss",
        },
        {
            id: 2,
            name: "Académique",
            label: "Milieu éducatif",
            description: "Votes universitaires",
        },
        {
            id: 3,
            name: "Business",
            label: "Entreprise",
            description: "Votes internes d’entreprise",
        },
        {
            id: 4,
            name: "Professionnel",
            label: "StartUp",
            description: "Votes internes d’entreprise",
        },
    ]);

    const [search, setSearch] = useState("");
    const [openModal, setOpenModal] = useState(false);
    const [selected, setSelected] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 3;
    // FILTER

    //recuperer tout les categories de l'api

    useEffect(() => {
        const fetchCategories = async () => {
            setLoading(true);
            try {
                const response = await categoriesApi.getAll({});
                // setCategories(response.data);
                console.log(response.data);
            } catch (error) {
                console.log(error);
                toast.error(error.message);
            }finally{
                setLoading(false);
            }
        };
        fetchCategories();
    }, []);


    const filtered = useMemo(() => {
        return categories.filter((c) =>
            c.name.toLowerCase().includes(search.toLowerCase()) ||
            c.label.toLowerCase().includes(search.toLowerCase())
        );
    }, [search, categories]);

    const paginatedCategories = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filtered.slice(start, start + itemsPerPage);
    }, [filtered, currentPage]);

    const totalPages = Math.ceil(filtered.length / itemsPerPage);

    // CREATE / UPDATE
    const handleSave = (data) => {
        if (selected) {
            // update
            setCategories((prev) =>
                prev.map((c) =>
                    c.id === selected.id ? { ...c, ...data } : c
                )
            );
            toast.success("Catégorie mise à jour");
        } else {
            // create
            const newCat = {
                id: Date.now(),
                ...data,
            };
            setCategories((prev) => [newCat, ...prev]);
            toast.success("Catégorie créée");
        }

        setOpenModal(false);
        setSelected(null);
    };

    // DELETE
    const handleDelete = (id) => {
        if (!confirm("Supprimer cette catégorie ?")) return;

        setCategories((prev) => prev.filter((c) => c.id !== id));
        toast.success("Catégorie supprimée");
    };

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
                            <th className="p-3">Label</th>
                            <th className="p-3">Description</th>
                            <th className="p-3 text-center">Actions</th>
                        </tr>
                    </thead>

                    <tbody>
                        {paginatedCategories.map((c) => (
                            <tr key={c.id} className="border-t border-t-[var(--color-gray-light)] hover:bg-[var(--color-gray-light)]">
                                <td className="p-3 font-medium">{c.name}</td>
                                <td className="p-3">{c.label}</td>
                                <td className="p-3 truncate max-w-[250px]">
                                    {c.description}
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
                                        onClick={() => handleDelete(c.id)}
                                    />
                                </td>
                            </tr>
                        ))}
                        {/* si pas de categorie */}
                        {filtered.length === 0 && (
                            <div className="text-center py-10 text-[var(--color-gray)]">
                                Aucune catégorie trouvée
                            </div>
                        )}
                    </tbody>
                </table>
            </div>
            {/* Pagination */}

            <div className="flex flex-col lg:flex-row justify-between items-center p-4 text-sm gap-3">
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
                        {currentPage} / {totalPages}
                    </span>
                    <button
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage((p) => p + 1)}
                        className="px-3 py-1 border rounded"><ChevronRight size={16} /></button>
                </div>
            </div>

            {/* MODAL */}
            {openModal && (
                <CategorieModal
                    data={selected}
                    onClose={() => {
                        setOpenModal(false);
                        setSelected(null);
                    }}
                    onSuccess={(message) => {
                        handleSave(message);
                    }}
                    onError={(msg) => toast.error(msg)}
                />
            )}
        </div>
    );
}

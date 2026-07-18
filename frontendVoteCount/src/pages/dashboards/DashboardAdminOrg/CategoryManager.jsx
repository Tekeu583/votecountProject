// CategoryManager.jsx
// Gestion des catégories d'une élection (ajout/renommage/suppression),
// utilisable après la création du scrutin (contrairement à la sous-étape
// "catégories" de l'assistant, qui n'est accessible qu'à la création).
import { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { Plus, Edit2, Trash2, X, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { electionsApi } from '@services/api';
import { FadeLoader } from 'react-spinners';

const EMPTY_FORM = { name: '', description: '', color: '#3B82F6' };

export default function CategoryManager({ electionUuid, onChange }) {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [adding, setAdding] = useState(false);
    const [newCategory, setNewCategory] = useState(EMPTY_FORM);
    const [submitting, setSubmitting] = useState(false);
    const [editingUuid, setEditingUuid] = useState(null);
    const [editForm, setEditForm] = useState(EMPTY_FORM);

    const loadCategories = useCallback(async () => {
        if (!electionUuid) return;
        setLoading(true);
        try {
            const res = await electionsApi.getCategories(electionUuid);
            const list = res.data?.data ?? [];
            setCategories(list);
            onChange?.(list);
        } catch {
            toast.error('Impossible de charger les catégories.');
        } finally {
            setLoading(false);
        }
    }, [electionUuid, onChange]);

    useEffect(() => {
        loadCategories();
    }, [loadCategories]);

    const handleAdd = async (e) => {
        e.preventDefault();
        if (!newCategory.name.trim()) {
            toast.error('Le nom de la catégorie est requis.');
            return;
        }
        setSubmitting(true);
        try {
            await electionsApi.createCategory(electionUuid, newCategory);
            toast.success('Catégorie créée.');
            setNewCategory(EMPTY_FORM);
            setAdding(false);
            loadCategories();
        } catch (error) {
            toast.error(error.response?.data?.message ?? 'Erreur lors de la création.');
        } finally {
            setSubmitting(false);
        }
    };

    const openEdit = (category) => {
        setEditingUuid(category.uuid);
        setEditForm({
            name: category.name ?? '',
            description: category.description ?? '',
            color: category.color ?? '#3B82F6',
        });
    };

    const cancelEdit = () => {
        setEditingUuid(null);
        setEditForm(EMPTY_FORM);
    };

    const handleUpdate = async (categoryUuid) => {
        if (!editForm.name.trim()) {
            toast.error('Le nom de la catégorie est requis.');
            return;
        }
        setSubmitting(true);
        try {
            await electionsApi.updateCategory(electionUuid, categoryUuid, editForm);
            toast.success('Catégorie mise à jour.');
            cancelEdit();
            loadCategories();
        } catch (error) {
            toast.error(error.response?.data?.message ?? 'Erreur lors de la mise à jour.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (category) => {
        if (!window.confirm(`Supprimer la catégorie "${category.name}" ? Les candidats assignés seront désassignés.`)) return;
        try {
            await electionsApi.deleteCategory(electionUuid, category.uuid);
            toast.success('Catégorie supprimée.');
            loadCategories();
        } catch (error) {
            toast.error(error.response?.data?.message ?? 'Erreur lors de la suppression.');
        }
    };

    if (!electionUuid) return null;

    return (
        <div className="bg-white rounded-[var(--radius-md)] border border-[var(--color-gray-light)] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-[var(--color-gray-light)]">
                <div>
                    <h3 className="font-semibold text-[var(--color-dark)]">Catégories du scrutin</h3>
                    <p className="text-xs text-[var(--color-gray)] mt-0.5">
                        Regroupez les candidats par catégorie (ex : régions, postes...).
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => setAdding((v) => !v)}
                    className="btn-primary flex items-center gap-2 px-4 py-2 text-sm font-medium whitespace-nowrap"
                >
                    <Plus size={16} /> Ajouter une catégorie
                </button>
            </div>

            {adding && (
                <form onSubmit={handleAdd} className="p-4 border-b border-[var(--color-gray-light)] bg-[var(--color-background-white)] flex flex-col sm:flex-row gap-3 items-start sm:items-end">
                    <div className="flex-1 w-full">
                        <label className="block text-xs text-[var(--color-gray)] mb-1">Nom</label>
                        <input
                            type="text"
                            value={newCategory.name}
                            onChange={(e) => setNewCategory((f) => ({ ...f, name: e.target.value }))}
                            className="w-full px-3 py-2 border border-[var(--color-gray-light)] rounded-[var(--radius-md)] text-sm focus:outline-none focus:border-[var(--color-primary)]"
                            placeholder="Ex : Région Centre"
                            autoFocus
                        />
                    </div>
                    <div className="flex-1 w-full">
                        <label className="block text-xs text-[var(--color-gray)] mb-1">Description (optionnel)</label>
                        <input
                            type="text"
                            value={newCategory.description}
                            onChange={(e) => setNewCategory((f) => ({ ...f, description: e.target.value }))}
                            className="w-full px-3 py-2 border border-[var(--color-gray-light)] rounded-[var(--radius-md)] text-sm focus:outline-none focus:border-[var(--color-primary)]"
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-[var(--color-gray)] mb-1">Couleur</label>
                        <input
                            type="color"
                            value={newCategory.color}
                            onChange={(e) => setNewCategory((f) => ({ ...f, color: e.target.value }))}
                            className="w-12 h-9 border border-[var(--color-gray-light)] rounded-[var(--radius-md)]"
                        />
                    </div>
                    <div className="flex gap-2">
                        <button type="submit" disabled={submitting} className="btn-primary px-4 py-2 text-sm disabled:opacity-60">
                            {submitting ? 'Ajout...' : 'Créer'}
                        </button>
                        <button type="button" onClick={() => { setAdding(false); setNewCategory(EMPTY_FORM); }} className="btn-secondary px-3 py-2">
                            <X size={16} />
                        </button>
                    </div>
                </form>
            )}

            {loading ? (
                <div className="py-10 flex items-center justify-center">
                    <FadeLoader color="#1e40af" cssOverride={{ display: 'block', margin: '0 auto' }} />
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[500px] text-sm">
                        <thead>
                            <tr className="bg-[var(--color-gray-light)] text-left text-xs uppercase text-[var(--color-dark)]">
                                <th className="px-4 py-2 font-medium">Catégorie</th>
                                <th className="px-4 py-2 font-medium">Candidats</th>
                                <th className="px-4 py-2 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--color-gray-light)]">
                            {categories.map((c) => (
                                <tr key={c.uuid} className="hover:bg-[var(--color-background-white)]">
                                    {editingUuid === c.uuid ? (
                                        <>
                                            <td className="px-4 py-2" colSpan={2}>
                                                <div className="flex flex-col sm:flex-row gap-2">
                                                    <input
                                                        type="text"
                                                        value={editForm.name}
                                                        onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                                                        className="flex-1 px-3 py-1.5 border border-[var(--color-gray-light)] rounded-[var(--radius-md)] text-sm focus:outline-none focus:border-[var(--color-primary)]"
                                                        autoFocus
                                                    />
                                                    <input
                                                        type="text"
                                                        value={editForm.description}
                                                        onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                                                        placeholder="Description"
                                                        className="flex-1 px-3 py-1.5 border border-[var(--color-gray-light)] rounded-[var(--radius-md)] text-sm focus:outline-none focus:border-[var(--color-primary)]"
                                                    />
                                                    <input
                                                        type="color"
                                                        value={editForm.color}
                                                        onChange={(e) => setEditForm((f) => ({ ...f, color: e.target.value }))}
                                                        className="w-9 h-9 border border-[var(--color-gray-light)] rounded-[var(--radius-md)]"
                                                    />
                                                </div>
                                            </td>
                                            <td className="px-4 py-2 text-right">
                                                <div className="flex justify-end gap-3">
                                                    <button type="button" disabled={submitting} onClick={() => handleUpdate(c.uuid)} className="text-gray-600 hover:text-green-600" title="Enregistrer">
                                                        <Check size={16} />
                                                    </button>
                                                    <button type="button" onClick={cancelEdit} className="text-gray-600 hover:text-red-600" title="Annuler">
                                                        <X size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </>
                                    ) : (
                                        <>
                                            <td className="px-4 py-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="w-3 h-3 rounded-full inline-block shrink-0" style={{ backgroundColor: c.color || '#3B82F6' }} />
                                                    <div>
                                                        <p className="font-medium text-[var(--color-dark)]">{c.name}</p>
                                                        {c.description && <p className="text-xs text-[var(--color-gray)]">{c.description}</p>}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-2">{c.candidates_count ?? 0}</td>
                                            <td className="px-4 py-2 text-right">
                                                <div className="flex justify-end gap-3">
                                                    <button type="button" onClick={() => openEdit(c)} className="text-gray-600 hover:text-blue-600" title="Renommer">
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button type="button" onClick={() => handleDelete(c)} className="text-gray-600 hover:text-red-600" title="Supprimer">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </>
                                    )}
                                </tr>
                            ))}
                            {categories.length === 0 && (
                                <tr>
                                    <td colSpan={3} className="px-4 py-8 text-center text-[var(--color-gray)]">
                                        Aucune catégorie définie pour le moment.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

CategoryManager.propTypes = {
    electionUuid: PropTypes.string,
    onChange: PropTypes.func,
};

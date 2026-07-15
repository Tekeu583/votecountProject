import { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { juryApi } from '@services/api';
import { FadeLoader } from 'react-spinners';
import CriteriaModal from './CriteriaModal';
export default function JuryCriteriaManager({ electionUuid, onChange }) {
    const [criteria, setCriteria] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editing, setEditing] = useState(null);

    const loadCriteria = useCallback(async () => {
        if (!electionUuid) return;
        setLoading(true);
        try {
            const res = await juryApi.getCriteria(electionUuid);
            const list = res.data?.data ?? [];
            setCriteria(list);
            onChange?.(list);
        } catch {
            toast.error('Impossible de charger les critères de notation.');
        } finally {
            setLoading(false);
        }
    }, [electionUuid, onChange]);

    useEffect(() => {
        loadCriteria();
    }, [loadCriteria]);

    const openAdd = () => {
        setEditing(null);
        setIsModalOpen(true);
    };

    const openEdit = (criterion) => {
        setEditing(criterion);
        setIsModalOpen(true);
    };

    const handleDelete = async (criterion) => {
        if (!window.confirm(`Supprimer le critère "${criterion.name}" ?`)) return;
        try {
            await juryApi.deleteCriteria(electionUuid, criterion.uuid);
            toast.success('Critère supprimé.');
            loadCriteria();
        } catch (error) {
            toast.error(error.response?.data?.message ?? 'Erreur lors de la suppression.');
        }
    };

    if (!electionUuid) return null;

    return (
        <div className="bg-white rounded-[var(--radius-md)] border border-[var(--color-gray-light)] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-[var(--color-gray-light)]">
                <div>
                    <h3 className="font-semibold text-[var(--color-dark)]">Critères de notation du jury</h3>
                    <p className="text-xs text-[var(--color-gray)] mt-0.5">
                        Chaque juré notera les candidats sur ces critères, pondérés dans le score final.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={openAdd}
                    className="btn-primary flex items-center gap-2 px-4 py-2 text-sm font-medium whitespace-nowrap"
                >
                    <Plus size={16} /> Ajouter un critère
                </button>
            </div>

            {loading ? (
                <div className="py-10 flex items-center justify-center">
                    <FadeLoader color="#1e40af" cssOverride={{ display: 'block', margin: '0 auto' }} />
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[500px] text-sm">
                        <thead>
                            <tr className="bg-[var(--color-gray-light)] text-left text-xs uppercase text-[var(--color-dark)]">
                                <th className="px-4 py-2 font-medium">Critère</th>
                                <th className="px-4 py-2 font-medium">Poids relatif</th>
                                <th className="px-4 py-2 font-medium">Note max</th>
                                <th className="px-4 py-2 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--color-gray-light)]">
                            {criteria.map((c) => (
                                <tr key={c.uuid} className="hover:bg-[var(--color-background-white)]">
                                    <td className="px-4 py-2">
                                        <p className="font-medium text-[var(--color-dark)]">{c.name}</p>
                                        {c.description && <p className="text-xs text-[var(--color-gray)]">{c.description}</p>}
                                    </td>
                                    <td className="px-4 py-2">{c.weight}</td>
                                    <td className="px-4 py-2">{c.max_score}</td>
                                    <td className="px-4 py-2 text-right">
                                        <div className="flex justify-end gap-3">
                                            <button type="button" onClick={() => openEdit(c)} className="text-gray-600 hover:text-blue-600" title="Modifier">
                                                <Edit2 size={16} />
                                            </button>
                                            <button type="button" onClick={() => handleDelete(c)} className="text-gray-600 hover:text-red-600" title="Supprimer">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {criteria.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-4 py-8 text-center text-[var(--color-gray)]">
                                        Aucun critère défini pour le moment.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            <CriteriaModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                electionUuid={electionUuid}
                criterion={editing}
                onSuccess={() => {
                    setIsModalOpen(false);
                    loadCriteria();
                }}
            />
        </div>
    );
}

JuryCriteriaManager.propTypes = {
    electionUuid: PropTypes.string,
    onChange: PropTypes.func,
};

import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';
import TextInput from '@components/ui/TextInput';
import { juryApi } from '@services/api';

const DEFAULT_FORM = { name: '', description: '', weight: 1, max_score: 10 };

export default function CriteriaModal({ isOpen = false, onClose, electionUuid, criterion = null, onSuccess }) {
    const [form, setForm] = useState(DEFAULT_FORM);
    const [loading, setLoading] = useState(false);
    const mode = criterion ? 'edit' : 'add';

    useEffect(() => {
        if (!isOpen) return;
        setForm(criterion
            ? { name: criterion.name, description: criterion.description ?? '', weight: criterion.weight, max_score: criterion.max_score }
            : DEFAULT_FORM);
    }, [isOpen, criterion]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.name.trim()) {
            toast.error('Le nom du critère est obligatoire');
            return;
        }

        setLoading(true);
        try {
            const payload = {
                name: form.name.trim(),
                description: form.description?.trim() || null,
                weight: Number(form.weight) || 1,
                max_score: Number(form.max_score) || 10,
            };

            if (mode === 'edit') {
                await juryApi.updateCriteria(electionUuid, criterion.uuid, payload);
            } else {
                await juryApi.createCriteria(electionUuid, payload);
            }

            toast.success(mode === 'add' ? 'Critère ajouté' : 'Critère mis à jour');
            onSuccess();
        } catch (error) {
            const message = error.response?.data?.errors
                ? Object.values(error.response.data.errors).flat().join(' ')
                : error.response?.data?.message ?? 'Une erreur est survenue';
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-[var(--color-dark)]/60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden flex flex-col shadow-xl">
                <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--color-gray-light)]">
                    <h2 className="text-xl font-semibold text-[var(--color-dark)]">
                        {mode === 'add' ? 'Ajouter un critère' : 'Modifier le critère'}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-[var(--color-dark)] transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <TextInput
                        label="Nom du critère"
                        value={form.name}
                        onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                        placeholder="Ex : Qualité du projet"
                        required
                    />

                    <div>
                        <label htmlFor="criteria-description" className="block text-sm font-medium text-[var(--color-dark)] mb-1">
                            Description (optionnel)
                        </label>
                        <textarea
                            id="criteria-description"
                            value={form.description}
                            onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                            rows={2}
                            className="w-full px-4 py-3 border border-[var(--color-gray-light)] rounded-[var(--radius-md)] focus:outline-none focus:border-[var(--color-primary)] resize-y"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <TextInput
                            label="Poids relatif"
                            type="number"
                            min="0.01"
                            step="0.1"
                            value={form.weight}
                            onChange={(e) => setForm((prev) => ({ ...prev, weight: e.target.value }))}
                        />
                        <TextInput
                            label="Note maximale"
                            type="number"
                            min="1"
                            step="1"
                            value={form.max_score}
                            onChange={(e) => setForm((prev) => ({ ...prev, max_score: e.target.value }))}
                        />
                    </div>
                    <p className="text-xs text-[var(--color-gray)] -mt-2">
                        Le poids est relatif entre critères (pas besoin qu'ils totalisent 100) — chaque critère est d'abord ramené sur 10 selon sa note max, puis pondéré.
                    </p>
                </form>

                <div className="border-t border-[var(--color-gray-light)] p-6 flex gap-3">
                    <button type="button" onClick={onClose} className="flex-1 py-3 btn-secondary transition-colors">
                        Annuler
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={loading}
                        className="flex-1 py-3 btn-primary disabled:opacity-70 whitespace-nowrap disabled:cursor-not-allowed transition-colors"
                    >
                        {loading ? 'Enregistrement...' : mode === 'add' ? 'Ajouter' : 'Enregistrer'}
                    </button>
                </div>
            </div>
        </div>
    );
}

CriteriaModal.propTypes = {
    isOpen: PropTypes.bool,
    onClose: PropTypes.func.isRequired,
    electionUuid: PropTypes.string.isRequired,
    criterion: PropTypes.shape({
        uuid: PropTypes.string,
        name: PropTypes.string,
        description: PropTypes.string,
        weight: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        max_score: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    }),
    onSuccess: PropTypes.func.isRequired,
};

import { useState, useRef } from 'react';
import { CreditCard, ListOrdered, CalendarDays, X, Plus, Trash } from 'lucide-react';
import TextInput from '@components/ui/TextInput';
import {plansApi} from '@services/api';

export default function PlanModal({ data, onClose, onSuccess, onError }) {

    const [form, setForm] = useState({
        name: data?.name || '',
        description: data?.description || '',
        price: data?.price ?? '',
        currency: data?.currency || 'XAF',
        duration_days: data?.duration_days ?? '',
        max_elections: data?.max_elections ?? '',
        max_votes: data?.max_votes ?? '',
        max_candidates: data?.max_candidates ?? '',
        max_storage_gb: data?.max_storage_gb ?? '',
        status: data?.status || 'active',
        features: data?.features?.length ? data.features : [''],
    });

    const [loading, setLoading] = useState(false);

    // 🔥 anti double submit (ULTRA IMPORTANT)
    const isSubmitting = useRef(false);

    // 🔹 handle change (safe)
    const handleChange = (field, value) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    // 🔹 features
    const addFeature = () => {
        setForm((prev) => ({
            ...prev,
            features: [...prev.features, ''],
        }));
    };

    const updateFeature = (index, value) => {
        setForm((prev) => {
            const updated = [...prev.features];
            updated[index] = value;
            return { ...prev, features: updated };
        });
    };

    const removeFeature = (index) => {
        setForm((prev) => ({
            ...prev,
            features: prev.features.filter((_, i) => i !== index),
        }));
    };

    // 🔹 validation centralisée
    const validate = () => {
        if (!form.name.trim()) {
            return 'Le nom du plan est requis';
        }
        if (form.price === '' || !form.duration_days || !form.currency) {
            return 'Champs obligatoires manquants';
        }
        if (Number(form.price) < 0) {
            return 'Le prix ne peut pas être négatif';
        }
        if (form.max_elections === '' || form.max_votes === '' || form.max_candidates === '' || form.max_storage_gb === '') {
            return 'Les limites (élections, votes, candidats, stockage) sont obligatoires — utilisez -1 pour illimité';
        }

        return null;
    };

    // 🔹 submit sécurisé
    const handleSubmit = async (e) => {
        e.preventDefault();

        //bloque double exécution
        if (isSubmitting.current) return;

        const error = validate();
        if (error) {
            return onError(error);
        }

        isSubmitting.current = true;
        setLoading(true);

        try {
            const payload = {
                name: form.name,
                description: form.description || null,
                price: Number(form.price),
                currency: form.currency.toUpperCase(),
                duration_days: Number(form.duration_days),
                max_elections: Number(form.max_elections),
                max_votes: Number(form.max_votes),
                max_candidates: Number(form.max_candidates),
                max_storage_gb: Number(form.max_storage_gb),
                status: form.status,
                features: form.features.filter((f) => f.trim() !== ''),
            };

            if (data) {
                await plansApi.update(data.uuid, payload);
                onSuccess('Plan mis à jour avec succès');
            } else {
                await plansApi.create(payload);
                onSuccess('Plan créé avec succès');
            }

            onClose();

        } catch (err) {
            const errors = err.response?.data?.errors;
            const firstError = errors ? Object.values(errors)[0]?.[0] : null;
            onError(firstError ?? err.response?.data?.message ?? 'Erreur lors de l’opération');
        } finally {
            isSubmitting.current = false;
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-[var(--color-dark)]/40 flex items-center justify-center p-2">

            <div className="bg-[var(--color-white)] w-full max-w-lg rounded-[var(--radius-md)] shadow-[var(--shadow-md)] relative max-h-[90vh] overflow-y-auto">

                {/* HEADER */}
                <div className="flex justify-between items-center p-4">
                    <h2 className="font-semibold text-lg">
                        {data ? 'Modifier le plan' : 'Créer un plan'}
                    </h2>

                    <button onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                {/* FORM */}
                <form onSubmit={handleSubmit} className="p-4 space-y-4">

                    <TextInput
                        placeholder="Nom du plan (ex: Starter, Business...)"
                        value={form.name}
                        onChange={(e) => handleChange('name', e.target.value)}
                    />

                    <TextInput
                        placeholder="Description (optionnel)"
                        value={form.description}
                        onChange={(e) => handleChange('description', e.target.value)}
                    />

                    <div className="grid grid-cols-2 gap-3">
                        <TextInput
                            type="number"
                            value={form.price}
                            placeholder="Prix"
                            onChange={(e) => handleChange('price', e.target.value)}
                            iconLeft={CreditCard}
                        />
                        <TextInput
                            placeholder="Devise (ex: XAF)"
                            value={form.currency}
                            onChange={(e) => handleChange('currency', e.target.value)}
                            maxLength={3}
                        />
                    </div>

                    <TextInput
                        type="number"
                        value={form.duration_days}
                        placeholder="Durée en jours"
                        onChange={(e) => handleChange('duration_days', e.target.value)}
                        iconLeft={CalendarDays}
                    />

                    <p className="text-xs text-[var(--color-gray)]">Limites du plan — utilisez -1 pour illimité</p>
                    <div className="grid grid-cols-2 gap-3">
                        <TextInput
                            type="number"
                            placeholder="Max élections"
                            value={form.max_elections}
                            onChange={(e) => handleChange('max_elections', e.target.value)}
                            iconLeft={ListOrdered}
                        />

                        <TextInput
                            type="number"
                            placeholder="Max votes"
                            value={form.max_votes}
                            onChange={(e) => handleChange('max_votes', e.target.value)}
                            iconLeft={ListOrdered}
                        />
                        <TextInput
                            type="number"
                            placeholder="Max candidats"
                            value={form.max_candidates}
                            onChange={(e) => handleChange('max_candidates', e.target.value)}
                            iconLeft={ListOrdered}
                        />
                        <TextInput
                            type="number"
                            placeholder="Stockage max (Go)"
                            value={form.max_storage_gb}
                            onChange={(e) => handleChange('max_storage_gb', e.target.value)}
                            iconLeft={ListOrdered}
                        />
                    </div>

                    <div>
                        <label htmlFor="plan-status" className="block text-sm mb-1">Statut</label>
                        <select
                            id="plan-status"
                            value={form.status}
                            onChange={(e) => handleChange('status', e.target.value)}
                            className="input w-full"
                        >
                            <option value="active">Actif</option>
                            <option value="inactive">Inactif</option>
                        </select>
                    </div>

                    {/* FEATURES */}
                    <div>
                        <div className="flex justify-between mb-2">
                            <span className="text-sm">Fonctionnalités</span>
                            <button type="button" onClick={addFeature}>
                                <Plus size={14} />
                            </button>
                        </div>

                        {form.features.map((f, i) => (
                            <div key={i} className="flex gap-2 mb-2">
                                <TextInput
                                    value={f}
                                    onChange={(e) => updateFeature(i, e.target.value)}
                                />
                                <button type="button" onClick={() => removeFeature(i)}>
                                    <Trash size={16} />
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* FOOTER */}
                    <div className="flex justify-end gap-2 pt-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 transition-all duration-200 rounded-[--radius-md]">
                            Annuler
                        </button>

                        <button type="submit" disabled={loading} className='btn-primary'>
                            {loading ? 'En cours...' : 'Enregistrer'}
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
}

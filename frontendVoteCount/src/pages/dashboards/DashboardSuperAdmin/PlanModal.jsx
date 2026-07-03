import { useState, useRef } from 'react';
import { CreditCard, ListOrdered, CalendarDays, X, Plus, Trash } from 'lucide-react';
import TextInput from '@components/ui/TextInput';
import {plansApi} from '@services/api';

export default function PlanModal({ data, onClose, onSuccess, onError }) {

    const [form, setForm] = useState({
        name: data?.name || 'basic',
        price: data?.price || '',
        elections_limit: data?.elections_limit || '',
        voters_limit: data?.voters_limit || '',
        duration_days: data?.duration_days || '',
        features: data?.features || [''],
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
        if (!form.price || !form.duration_days) {
            return 'Champs obligatoires manquants';
        }

        if (Number(form.price) <= 0) {
            return 'Le prix doit être supérieur à 0';
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
                ...form,
                price: Number(form.price),
                elections_limit: form.elections_limit ? Number(form.elections_limit) : null,
                voters_limit: form.voters_limit ? Number(form.voters_limit) : null,
                duration_days: Number(form.duration_days),
                features: form.features.filter((f) => f.trim() !== ''),
            };

            if (data) {
                await plansApi.update(data.id, payload);
                onSuccess('Plan mis à jour avec succès');
            } else {
                await plansApi.create(payload);
                onSuccess('Plan créé avec succès');
            }

            onClose();

        } catch (err) {
            console.error(err);
            onError('Erreur lors de l’opération');
        } finally {
            isSubmitting.current = false;
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-[var(--color-dark)]/40 flex items-center justify-center p-2">

            <div className="bg-[var(--color-white)] w-full max-w-lg rounded-[var(--radius-md)] shadow-[var(--shadow-md)] relative">

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

                    <select
                        value={form.name}
                        onChange={(e) => handleChange('name', e.target.value)}
                        className="input"
                    >
                        <option value="basic">Basic</option>
                        <option value="pro">Pro</option>
                        <option value="enterprise">Enterprise</option>
                    </select>

                    <TextInput
                        type="number"
                        value={form.price}
                        placeholder="Prix en FCFA"
                        onChange={(e) => handleChange('price', e.target.value)}
                        iconLeft={CreditCard}
                    />

                    <div className="grid grid-cols-2 gap-3">
                        <TextInput
                            type="number"
                            placeholder="Limite élections"
                            value={form.elections_limit}
                            onChange={(e) => handleChange('elections_limit', e.target.value)}
                            iconLeft={ListOrdered}
                        />

                        <TextInput
                            type="number"
                            placeholder="Limite votants"
                            value={form.voters_limit}
                            onChange={(e) => handleChange('voters_limit', e.target.value)}
                            iconLeft={ListOrdered}
                        />
                    </div>

                    <TextInput
                        type="number"
                        value={form.duration_days}
                        placeholder="Durée en jours"
                        onChange={(e) => handleChange('duration_days', e.target.value)}
                        iconLeft={CalendarDays}
                    />

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

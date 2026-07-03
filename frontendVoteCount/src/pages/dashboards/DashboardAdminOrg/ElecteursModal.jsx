import { useState } from 'react';
import PropTypes from 'prop-types';
import { User, Mail, Phone, X, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import TextInput from '@components/ui/TextInput';
import { electorsApi } from '@services/api';

export default function ElecteursModal({ data, elections, onSuccess, onError, onClose }) {
    const isEdit = Boolean(data);

    const [form, setForm] = useState({
        full_name: data?.full_name || '',
        email: data?.email || '',
        phone: data?.phone || '',
        // En édition, l'élection est déjà fixée (l'API ne permet pas de la
        // changer) ; en création, l'admin doit en choisir une.
        election_uuid: data?.electionUuid || '',
    });
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState({});

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrors({});

        if (!form.full_name.trim()) {
            setErrors({ full_name: 'Le nom est requis.' });
            return;
        }
        if (!form.email.trim()) {
            setErrors({ email: "L'email est requis." });
            return;
        }
        if (!isEdit && !form.election_uuid) {
            setErrors({ election_uuid: 'Sélectionnez une élection.' });
            return;
        }

        const payload = {
            full_name: form.full_name.trim(),
            email: form.email.trim(),
            phone: form.phone.trim() || null,
        };

        setSubmitting(true);
        try {
            if (isEdit) {
                await electorsApi.update(data.electionUuid, data.uuid, payload);
                onSuccess('Électeur mis à jour avec succès.');
            } else {
                await electorsApi.create(form.election_uuid, payload);
                onSuccess('Électeur créé avec succès.');
            }
            onClose();
        } catch (error) {
            const validationErrors = error.response?.data?.errors;
            if (validationErrors) {
                setErrors(
                    Object.fromEntries(
                        Object.entries(validationErrors).map(([key, msgs]) => [key, msgs[0]])
                    )
                );
            }
            const message = error.response?.data?.message ?? "Une erreur est survenue lors de l'enregistrement.";
            onError(message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
            <div className="bg-white w-full max-w-md rounded shadow">

                {/* HEADER */}
                <div className="flex justify-between p-4 border-b border-gray-100">
                    <h2 className="font-semibold">
                        {isEdit ? 'Modifier' : 'Créer'} un électeur
                    </h2>
                    <button onClick={onClose} type="button">
                        <X size={18} />
                    </button>
                </div>

                {/* FORM */}
                <form onSubmit={handleSubmit} className="p-4 space-y-3">

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Élection
                        </label>
                        <select
                            className="input w-full disabled:opacity-60 disabled:cursor-not-allowed"
                            value={form.election_uuid}
                            disabled={isEdit}
                            onChange={(e) => setForm({ ...form, election_uuid: e.target.value })}
                        >
                            <option value="">— Sélectionner une élection —</option>
                            {elections.map((election) => (
                                <option key={election.uuid} value={election.uuid}>
                                    {election.title}
                                </option>
                            ))}
                        </select>
                        {isEdit && (
                            <p className="text-xs text-gray-400 mt-1">
                                L'élection d'un électeur ne peut pas être modifiée après création.
                            </p>
                        )}
                        {errors.election_uuid && (
                            <p className="text-xs text-red-500 mt-1">{errors.election_uuid}</p>
                        )}
                    </div>

                    <TextInput
                        label="Nom complet"
                        placeholder="Nom complet"
                        className="w-full"
                        value={form.full_name}
                        iconLeft={User}
                        onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                        error={errors.full_name}
                    />

                    <TextInput
                        label="Email"
                        placeholder="email@exemple.com"
                        type="email"
                        className="w-full"
                        value={form.email}
                        iconLeft={Mail}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        error={errors.email}
                    />

                    <TextInput
                        label="Téléphone (optionnel)"
                        placeholder="+237 6XX XXX XXX"
                        className="w-full"
                        value={form.phone}
                        iconLeft={Phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        error={errors.phone}
                    />

                    <button className="btn-primary w-full flex items-center justify-center gap-2" disabled={submitting}>
                        {submitting ? (
                            <><Loader2 size={16} className="animate-spin" /> Enregistrement...</>
                        ) : (
                            'Enregistrer'
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}

ElecteursModal.propTypes = {
    data: PropTypes.shape({
        uuid: PropTypes.string,
        full_name: PropTypes.string,
        email: PropTypes.string,
        phone: PropTypes.string,
        electionUuid: PropTypes.string,
    }),
    elections: PropTypes.arrayOf(PropTypes.shape({
        uuid: PropTypes.string.isRequired,
        title: PropTypes.string.isRequired,
    })),
    onClose: PropTypes.func.isRequired,
    onSuccess: PropTypes.func.isRequired,
    onError: PropTypes.func.isRequired,
};

ElecteursModal.defaultProps = {
    data: null,
    elections: [],
};
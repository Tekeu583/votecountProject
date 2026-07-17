import { CreditCard, Users, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import TextInput from '@components/ui/TextInput';
import { electionsApi, organizationsApi } from '@services/api';

// Convertit un ISO 8601 en valeur affichable par <input type="datetime-local">
const toLocalInput = (iso) => {
    if (!iso) return '';
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return '';
    const pad = (n) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

export default function ElectionModal({ data, onClose, onSuccess, onError }) {
    const isEdit = Boolean(data);

    const [loading, setLoading] = useState(false);
    const [organizations, setOrganizations] = useState([]);

    // Champs éditables uniquement à la création — le backend
    // (UpdateElectionRequest) ne permet plus de les changer ensuite.
    const [form, setForm] = useState({
        organization_id: data?.organization?.uuid || '',
        title: data?.title || '',
        short_description: data?.short_description || '',
        description: data?.description || '',
        election_mode: data?.election_mode || 'public',
        vote_type: data?.vote_type || 'single',
        visibility_type: data?.visibility_type || 'public',
        payment_type: data?.payment_type || 'free',
        vote_price: data?.vote_price || 0,
        currency: data?.currency || 'XAF',
        start_at: toLocalInput(data?.start_at),
        end_at: toLocalInput(data?.end_at),
    });

    useEffect(() => {
        if (isEdit) return; // organisation non modifiable en édition
        organizationsApi.getAll({ per_page: 100 })
            .then(res => setOrganizations(res.data?.data ?? []))
            .catch(() => setOrganizations([]));
    }, [isEdit]);

    const handleChange = (field, value) => {
        setForm({ ...form, [field]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!form.title) {
            return onError('Le titre est obligatoire');
        }
        if (!isEdit && !form.organization_id) {
            return onError("L'organisation est obligatoire");
        }
        if (!isEdit && (!form.start_at || !form.end_at)) {
            return onError('Les dates de début et de fin sont obligatoires');
        }

        try {
            setLoading(true);

            if (isEdit) {
                // UpdateElectionRequest n'accepte que ce sous-ensemble — le
                // mode, le type de vote, la visibilité et le paiement sont
                // fixés à la création côté backend.
                const payload = {
                    title: form.title,
                    short_description: form.short_description,
                    description: form.description,
                    start_at: form.start_at ? new Date(form.start_at).toISOString() : undefined,
                    end_at: form.end_at ? new Date(form.end_at).toISOString() : undefined,
                };
                if (form.payment_type === 'paid') {
                    payload.vote_price = form.vote_price;
                }
                await electionsApi.update(data.uuid, payload);
                onSuccess('Élection mise à jour avec succès');
            } else {
                const payload = {
                    organization_id: form.organization_id,
                    title: form.title,
                    short_description: form.short_description,
                    description: form.description,
                    election_mode: form.election_mode,
                    vote_type: form.vote_type,
                    visibility_type: form.visibility_type,
                    payment_type: form.payment_type,
                    start_at: new Date(form.start_at).toISOString(),
                    end_at: new Date(form.end_at).toISOString(),
                };
                if (form.payment_type === 'paid') {
                    payload.vote_price = form.vote_price;
                    payload.currency = form.currency;
                }
                await electionsApi.create(payload);
                onSuccess('Élection créée avec succès');
            }

            onClose();
        } catch (error) {
            console.error(error);
            const errors = error.response?.data?.errors;
            const firstError = errors ? Object.values(errors)[0]?.[0] : null;
            onError(firstError ?? error.response?.data?.message ?? 'Une erreur est survenue');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-[var(--color-dark)]/40 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-lg rounded-[var(--radius-md)] shadow max-h-[90vh] overflow-y-auto">

                {/* HEADER */}
                <div className="flex justify-between p-4">
                    <h2 className="font-semibold">
                        {isEdit ? 'Modifier' : 'Créer'} Élection
                    </h2>

                    <button onClick={onClose}>
                        <X />
                    </button>
                </div>

                {/* form */}
                <form onSubmit={handleSubmit} className='p-4 space-y-4'>

                    {!isEdit && (
                        <div className="flex-1">
                            <label htmlFor="organization_id" className="block text-sm font-medium mb-1">Organisation</label>
                            <select
                                id="organization_id"
                                value={form.organization_id}
                                onChange={(e) => handleChange('organization_id', e.target.value)}
                                className="input"
                            >
                                <option value="">Sélectionner une organisation</option>
                                {organizations.map(org => (
                                    <option key={org.uuid} value={org.uuid}>{org.name}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <TextInput
                        label="Titre"
                        placeholder="Titre de l'élection"
                        value={form.title}
                        onChange={(e) => handleChange('title', e.target.value)}
                    />

                    <TextInput
                        label="Description courte"
                        placeholder="Résumé affiché dans les listes"
                        value={form.short_description}
                        onChange={(e) => handleChange('short_description', e.target.value)}
                        iconLeft={Users}
                    />

                    <TextInput
                        label="Description"
                        placeholder="Description détaillée"
                        value={form.description}
                        onChange={(e) => handleChange('description', e.target.value)}
                    />

                    {!isEdit && (
                        <>
                            <div className="flex-1">
                                <label htmlFor="election_mode" className="block text-sm font-medium mb-1">Mode d'élection</label>
                                <select
                                    id="election_mode"
                                    value={form.election_mode}
                                    onChange={(e) => handleChange('election_mode', e.target.value)}
                                    className="input"
                                >
                                    <option value="public">Publique</option>
                                    <option value="private">Privée</option>
                                    <option value="restricted">Restreinte</option>
                                </select>
                            </div>

                            <div className="flex-1">
                                <label htmlFor="vote_type" className="block text-sm font-medium mb-1">Type de vote</label>
                                <select
                                    id="vote_type"
                                    value={form.vote_type}
                                    onChange={(e) => handleChange('vote_type', e.target.value)}
                                    className="input"
                                >
                                    <option value="single">Vote unique</option>
                                    <option value="multiple">Vote multiple</option>
                                    <option value="ranked">Vote classé</option>
                                    <option value="weighted">Vote pondéré (public + jury)</option>
                                </select>
                            </div>

                            <div className="flex-1">
                                <label htmlFor="visibility_type" className="block text-sm font-medium mb-1">Visibilité</label>
                                <select
                                    id="visibility_type"
                                    value={form.visibility_type}
                                    onChange={(e) => handleChange('visibility_type', e.target.value)}
                                    className="input"
                                >
                                    <option value="public">Publique</option>
                                    <option value="private">Privée</option>
                                    <option value="unlisted">Non répertoriée</option>
                                </select>
                            </div>

                            <div className="flex-1">
                                <label htmlFor="payment_type" className="block text-sm font-medium mb-1">Type de paiement</label>
                                <select
                                    id="payment_type"
                                    value={form.payment_type}
                                    onChange={(e) => handleChange('payment_type', e.target.value)}
                                    className="input"
                                >
                                    <option value="free">Gratuit</option>
                                    <option value="paid">Payant</option>
                                    <option value="subscription">Abonnement</option>
                                </select>
                            </div>
                        </>
                    )}

                    {form.payment_type === 'paid' && (
                        <div className="flex-1">
                            <label htmlFor="vote_price" className="block text-sm font-medium mb-1">Prix par vote</label>
                            <TextInput
                                id="vote_price"
                                type="number"
                                value={form.vote_price}
                                onChange={(e) => handleChange('vote_price', Number(e.target.value))}
                                iconLeft={CreditCard}
                            />
                        </div>
                    )}

                    <div className="flex-1">
                        <label htmlFor="start_date" className="block text-sm font-medium mb-1">Date de début</label>
                        <TextInput
                            id="start_date"
                            type="datetime-local"
                            value={form.start_at}
                            onChange={(e) => handleChange('start_at', e.target.value)}
                            disabled={isEdit && data?.status === 'ongoing'}
                        />
                    </div>
                    <div className="flex-1">
                        <label htmlFor="end_date" className="block text-sm font-medium mb-1">Date de fin</label>
                        <TextInput
                            id="end_date"
                            type="datetime-local"
                            value={form.end_at}
                            onChange={(e) => handleChange('end_at', e.target.value)}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-primary w-full disabled:opacity-50"
                    >
                        {loading ? 'Chargement...' : 'Enregistrer'}
                    </button>
                </form>

            </div>
        </div>
    );
}

ElectionModal.propTypes = {
    data: PropTypes.shape({
        uuid: PropTypes.string,
        title: PropTypes.string,
        short_description: PropTypes.string,
        description: PropTypes.string,
        election_mode: PropTypes.string,
        vote_type: PropTypes.string,
        visibility_type: PropTypes.string,
        payment_type: PropTypes.string,
        vote_price: PropTypes.number,
        currency: PropTypes.string,
        status: PropTypes.string,
        start_at: PropTypes.string,
        end_at: PropTypes.string,
        organization: PropTypes.shape({ uuid: PropTypes.string, name: PropTypes.string }),
    }),
    onClose: PropTypes.func.isRequired,
    onSuccess: PropTypes.func.isRequired,
    onError: PropTypes.func.isRequired,
};

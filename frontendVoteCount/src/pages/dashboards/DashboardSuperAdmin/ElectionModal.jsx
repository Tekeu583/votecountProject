import { CreditCard, Users, X } from 'lucide-react';
import { useState } from 'react';
import PropTypes from 'prop-types';
import TextInput from '@components/ui/TextInput';
import {electionsApi} from '@services/api';

export default function ElectionModal({ data, onClose, onSuccess, onError }) {

    const [loading, setLoading] = useState(false);

    const [form, setForm] = useState({
        id: data?.id || null,
        title: data?.title || '',
        description: data?.description || '',
        type_election: data?.type_election || 'concours',
        type_access: data?.type_access || 'PUBLIC',
        type_scrutin: data?.type_scrutin || 'majoritaire',
        categorie: data?.categorie || 'Miss/Master',
        is_paid: data?.is_paid || false,
        vote_price: data?.vote_price || 0,
        status: data?.status || 'en attente',
        start_date: data?.start_date || '',
        end_date: data?.end_date || '',
    });

    const handleChange = (field, value) => {
        setForm({ ...form, [field]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!form.title || !form.description) {
            return onError('title et description sont obligatoires');
        }

        try {
            setLoading(true);

            if (data?.id) {
                await electionsApi.update(data.id, form);
                onSuccess('Élection mise à jour avec succès');
            } else {
                await electionsApi.create(form);
                onSuccess('Élection créée avec succès');
            }

            onClose();
        } catch (error) {
            console.error(error);
            onError('Une erreur est survenue');
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
                            {data? 'Modifier' : 'Créer'} Élection
                        </h2>

                        <button onClick={onClose}>
                            <X />
                        </button>
                    </div>

                    {/* form */}
                    <form onSubmit={handleSubmit} className='p-4 space-y-4'>
                        <TextInput
                            label="title"
                            placeholder="title"
                            value={form.title}
                            onChange={(e) => handleChange('title', e.target.value)}
                        />

                        <TextInput
                            label="Description"
                            placeholder="description de l'élection"
                            value={form.description}
                            onChange={(e) => handleChange('description', e.target.value)}
                            iconLeft={Users}
                        />

                        <div className="flex-1">
                            <label htmlFor="type" className="block text-sm font-medium mb-1">Type d'election</label>
                            <select
                                id="type"
                                value={form.type_election}
                                onChange={(e) => handleChange('type_election', e.target.value)}
                                className="input"
                            >
                                <option value="concours">concours</option>
                                <option value="election">election</option>
                                <option value="referendum">referendum</option>
                                <option value="sondage">sondage</option>
                            </select>
                        </div>

                        <div className="flex-1">
                            <label htmlFor="type" className="block text-sm font-medium mb-1">Type d'acces</label>
                            <select
                                id="type"
                                value={form.type_access}
                                onChange={(e) => handleChange('type_access', e.target.value)}
                                className="input"
                            >
                                <option value="PUBLIC">Public</option>
                                <option value="PRIVATE">Privé</option>
                            </select>
                        </div>
                        <div className="flex-1">
                            <label htmlFor="status" className="block text-sm font-medium mb-1">Status</label>
                            <select
                                id="status"
                                value={form.status}
                                onChange={(e) => handleChange('status', e.target.value)}
                                className="input"
                            >
                                <option value="Actif">Actif</option>
                                <option value="Inactif">Inactif</option>
                            </select>
                        </div>

                        <div className="flex-1">
                            <label htmlFor="type" className="block text-sm font-medium mb-1">Type de scrutin</label>
                            <select
                                id="type"
                                value={form.type_scrutin}
                                onChange={(e) => handleChange('type_scrutin', e.target.value)}
                                className="input capitalize"
                            >
                                <option value="majoritaire">majoritaire</option>
                                <option value="proportionnel">proportionnel</option>
                                <option value="mixte">mixte</option>
                                <option value="classement">classement</option>
                            </select>
                        </div>

                        <div className="flex-1">
                            <label htmlFor="type" className="block text-sm font-medium mb-1">Categorie</label>
                            <select
                                id="type"
                                value={form.categorie}
                                onChange={(e) => handleChange('categorie', e.target.value)}
                                className="input capitalize"
                            >
                                <option value="miss_master">Miss/Master</option>
                                <option value="talent">talent</option>
                                <option value="academique">academique</option>
                                <option value="business">business</option>
                                <option value="artistique">artistique</option>
                                <option value="autre">autre</option>
                            </select>
                        </div>

                        <div className="flex-1">
                            <label htmlFor="is_paid" className="block text-sm font-medium mb-1">Payant ?</label>
                            <select
                                id="is_paid"
                                value={form.is_paid}
                                onChange={(e) => handleChange('is_paid', e.target.value === 'true')}
                                className="input capitalize"
                            >
                                <option value="false">non</option>
                                <option value="true">oui</option>
                            </select>
                        </div>

                        <div className="flex-1">
                            <label htmlFor="type" className="block text-sm font-medium mb-1">Prix par vote</label>
                            <TextInput
                                id="type"
                                type="number"
                                value={form.vote_price}
                                onChange={(e) => handleChange('vote_price', Number(e.target.value))}
                                className="input"
                                iconLeft={CreditCard}
                            />
                        </div>

                        <div className="flex-1">
                            <label htmlFor="start_date" className="block text-sm font-medium mb-1">Date de début</label>
                            <TextInput
                                id="start_date"
                                type="datetime-local"
                                value={form.start_date}
                                onChange={(e) => handleChange('start_date', e.target.value)}
                                className="input"
                            />
                        </div>
                        <div className="flex-1">
                            <label htmlFor="end_date" className="block text-sm font-medium mb-1">Date de fin</label>
                            <TextInput
                                id="end_date"
                                type="datetime-local"
                                value={form.end_date}
                                onChange={(e) => handleChange('end_date', e.target.value)}
                                className="input"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary w-full"
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
            id: PropTypes.number,
            title: PropTypes.string,
            description: PropTypes.string,
            type_election: PropTypes.string,
            type_access: PropTypes.string,
            type_scrutin: PropTypes.string,
            categorie: PropTypes.string,
            is_paid: PropTypes.bool,
            vote_price: PropTypes.number,
            status: PropTypes.string,
            start_date: PropTypes.string,
            end_date: PropTypes.string,
        }),
        onClose: PropTypes.func.isRequired,
        onSuccess: PropTypes.func.isRequired,
        onError: PropTypes.func.isRequired,
    };

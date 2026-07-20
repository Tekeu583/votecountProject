// pages/dashboards/DashboardAdminOrg/CandidatModal.jsx
import { useState } from 'react';
import PropTypes from 'prop-types';
import TextInput from '@components/ui/TextInput';
import { User, Mail, Phone, X, Camera, Loader2 } from 'lucide-react';
import { candidatesApi } from '@services/api';
import toast from 'react-hot-toast';

export default function CandidatModal({ data, elections, onClose, onSuccess }) {

    const [electionUuid, setElectionUuid] = useState(data?.election?.uuid ?? '');

    const [form, setForm] = useState({
        full_name: data?.full_name ?? '',
        email: data?.email ?? '',
        phone: data?.phone ?? '',
        bio: data?.bio ?? '',
        slogan: data?.slogan ?? '',
        status: data?.status ?? 'pending',
    });
    const [photo, setPhoto] = useState(null);
    const [photoPreview, setPhotoPreview] = useState(data?.photo ?? null);
    const [submitting, setSubmitting] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handlePhotoChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) { toast.error('Photo max 5 Mo'); return; }
        setPhoto(file);
        const reader = new FileReader();
        reader.onload = (ev) => setPhotoPreview(ev.target.result);
        reader.readAsDataURL(file);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!electionUuid) {
            toast.error('Veuillez sélectionner une élection.');
            return;
        }
        if (!form.full_name.trim()) {
            toast.error('Le nom complet est requis.');
            return;
        }

        setSubmitting(true);
        try {
            const fd = new FormData();
            fd.append('full_name', form.full_name.trim());
            if (form.email) fd.append('email', form.email.trim());
            if (form.phone) fd.append('phone', form.phone.trim());
            if (form.bio) fd.append('bio', form.bio.trim());
            if (form.slogan) fd.append('slogan', form.slogan.trim());
            if (photo) fd.append('photo', photo);

            if (data?.uuid) {
                fd.append('_method', 'PUT');
                await candidatesApi.update(electionUuid, data.uuid, fd);
                toast.success('Candidat mis à jour.');
            } else {
                await candidatesApi.create(electionUuid, fd);
                toast.success('Candidat créé avec succès.');
            }
            onSuccess();
        } catch (err) {
            const msg = err.response?.data?.message ?? 'Une erreur est survenue.';
            toast.error(msg);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
            <div className="bg-white w-full max-w-md rounded-[var(--radius-md)] shadow-lg overflow-y-auto max-h-[90vh]">

                {/* HEADER */}
                <div className="flex justify-between items-center px-5 py-4 border-b border-[var(--color-gray-light)]">
                    <h2 className="font-semibold text-[var(--color-dark)]">
                        {data ? 'Modifier le candidat' : 'Ajouter un candidat'}
                    </h2>
                    <button onClick={onClose} className="text-[var(--color-gray)] hover:text-[var(--color-dark)]">
                        <X size={18} />
                    </button>
                </div>

                {/* FORM */}
                <form onSubmit={handleSubmit} className="p-5 space-y-4">

                    {/* Photo */}
                    <div className="flex items-center gap-4 mb-2">
                        <div className="w-16 h-16 rounded-full border-2 border-dashed border-[var(--color-gray-light)] flex items-center justify-center overflow-hidden bg-gray-50">
                            {photoPreview
                                ? <img src={photoPreview} alt="preview" className="w-full h-full object-cover" />
                                : <Camera size={22} className="text-[var(--color-gray)]" />}
                        </div>
                        <label className="cursor-pointer text-sm text-[var(--color-primary)] hover:underline font-medium">
                            {photoPreview ? 'Changer la photo' : 'Ajouter une photo'}
                            <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                        </label>
                    </div>

                    {/* Élection — désactivé en mode édition (on ne change pas l'élection d'un candidat existant) */}
                    <div>
                        <label className="block text-sm font-medium text-[var(--color-dark)] mb-1">
                            Élection <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={electionUuid}
                            onChange={(e) => setElectionUuid(e.target.value)}
                            disabled={!!data?.uuid}
                            required
                            className="w-full px-4 py-3 border border-[var(--color-gray-light)] rounded-[var(--radius-md)] focus:outline-none focus:border-[var(--color-primary)] bg-white text-sm disabled:bg-gray-50 disabled:text-[var(--color-gray)]"
                        >
                            <option value="">— Sélectionnez une élection —</option>
                            {elections.map(el => (
                                <option key={el.uuid} value={el.uuid}>{el.title}</option>
                            ))}
                        </select>
                    </div>

                    {/* Nom complet */}
                    <TextInput
                        label="Nom complet *"
                        name="full_name"
                        placeholder="Prénom Nom"
                        value={form.full_name}
                        iconLeft={User}
                        onChange={handleChange}
                        required
                    />

                    {/* Email */}
                    <TextInput
                        label="Email"
                        name="email"
                        type="email"
                        placeholder="candidat@email.com"
                        value={form.email}
                        iconLeft={Mail}
                        onChange={handleChange}
                    />

                    {/* Téléphone */}
                    <TextInput
                        label="Téléphone"
                        name="phone"
                        type="tel"
                        placeholder="+237 6 xx xx xx xx"
                        value={form.phone}
                        iconLeft={Phone}
                        onChange={handleChange}
                    />

                    {/* Slogan */}
                    <div>
                        <label className="block text-sm font-medium text-[var(--color-dark)] mb-1">Slogan</label>
                        <input
                            name="slogan"
                            value={form.slogan}
                            onChange={handleChange}
                            placeholder="Ex: Pour un avenir meilleur"
                            maxLength={200}
                            className="w-full px-4 py-2.5 border border-[var(--color-gray-light)] rounded-[var(--radius-md)] focus:outline-none focus:border-[var(--color-primary)] text-sm"
                        />
                    </div>

                    {/* Bio */}
                    <div>
                        <label className="block text-sm font-medium text-[var(--color-dark)] mb-1">Biographie</label>
                        <textarea
                            name="bio"
                            value={form.bio}
                            onChange={handleChange}
                            rows={3}
                            placeholder="Présentation courte..."
                            className="w-full px-4 py-2.5 border border-[var(--color-gray-light)] rounded-[var(--radius-md)] focus:outline-none focus:border-[var(--color-primary)] resize-y text-sm"
                        />
                    </div>

                    {/* Bouton submit */}
                    <button
                        type="submit"
                        disabled={submitting}
                        className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {submitting
                            ? <><Loader2 size={16} className="animate-spin" /> Enregistrement...</>
                            : data ? 'Mettre à jour' : 'Ajouter le candidat'
                        }
                    </button>
                </form>
            </div>
        </div>
    );
}

CandidatModal.propTypes = {
    data: PropTypes.object,
    elections: PropTypes.array.isRequired,
    onClose: PropTypes.func.isRequired,
    onSuccess: PropTypes.func.isRequired,
};

CandidatModal.defaultProps = {
    data: null,
};
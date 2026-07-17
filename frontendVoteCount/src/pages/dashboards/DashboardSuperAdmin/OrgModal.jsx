import { useState } from 'react';
import { User, Mail, Phone, Image, UserPlus, X } from 'lucide-react';
import TextInput from '@components/ui/TextInput';
import { organizationsApi } from '@services/api';

export default function OrgModal({ data, onClose, onSuccess, onError }) {
    const [form, setForm] = useState({
        name: data?.name ?? '',
        email: data?.email ?? '',
        phone: data?.phone ?? '',
        address: data?.address ?? '',
        logo: null,
    });
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        const fd = new FormData();
        fd.append('name', form.name);
        fd.append('email', form.email);
        fd.append('phone', form.phone);
        if (form.address) fd.append('address', form.address);
        if (form.logo) fd.append('logo', form.logo);

        setSubmitting(true);
        try {
            if (data) {
                await organizationsApi.update(data.uuid, fd);
                onSuccess('Organisation mise à jour avec succès');
            } else {
                await organizationsApi.create(fd);
                onSuccess('Organisation créée avec succès');
            }
            onClose();
        } catch (err) {
            onError(err.response?.data?.message ?? "Impossible d'enregistrer l'organisation");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-[var(--color-dark)]/40 opacity-80  flex items-center justify-center text-[var(--text-primary)]">

            <div className="bg-[var(--color-white)] w-full max-w-md rounded-[var(--radius-md)] p-6 relative scroll-auto">

                {/* CLOSE */}
                <button onClick={onClose} className="absolute top-4 right-4">
                    <X />
                </button>

                <h2 className="text-lg font-bold mb-4">
                    {data ? 'Modifier' : 'Créer'} organisation
                </h2>

                <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto">

                    <TextInput
                        label="Nom de l'organisation"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        iconLeft={UserPlus}
                    />

                    <TextInput
                        label="Email"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        iconLeft={Mail}
                    />
                    <TextInput
                        label="Téléphone"
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        iconLeft={Phone}
                    />
                    <TextInput
                        label="Adresse"
                        value={form.address}
                        onChange={(e) => setForm({ ...form, address: e.target.value })}
                        iconLeft={User}
                    />

                    {/* LOGO */}
                    <div>
                        <label htmlFor="org-logo" className="block text-sm mb-1">Logo</label>
                        {data?.logo && !form.logo && (
                            <img src={data.logo} alt="Logo actuel" className="w-12 h-12 rounded object-cover mb-2" />
                        )}
                        <TextInput
                            id="org-logo"
                            type="file"
                            accept="image/*"
                            onChange={(e) => setForm({ ...form, logo: e.target.files[0] })}
                            iconLeft={Image}
                            className="w-full text-sm text-[var(--color-gray)] file:mr-4 file:py-2 file:px-4 file:rounded-[var(--radius-md)] file:border-0 file:text-sm file:font-semibold file:bg-[var(--color-primary)] file:text-white hover:file:bg-[var(--color-primary-hover)] transition cursor-pointer"
                        />
                    </div>

                    <button type='submit' disabled={submitting} className="btn-primary w-full disabled:opacity-50">
                        {(() => {
                            if (submitting) return 'Enregistrement...';
                            return data ? "modifier l'organisation" : "créer l'organisation";
                        })()}
                    </button>

                </form>

            </div>
        </div>
    );
}

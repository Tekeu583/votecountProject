import { useState } from 'react';
import { User, Mail, Phone, Image, UserPlus, X } from 'lucide-react';
import TextInput from '@components/ui/TextInput';
import { organizationsApi } from '@services/api';

export default function OrgModal({ data, onClose, onSuccess, onError }) {
    const [form, setForm] = useState({
        name:'',
        email:'',
        phone:'',
        address:'',
        type:'',
        status:'en attente',
        logo: null,
    });

    const handleSubmit = async (e) => {
        e.preventDefault();

        const fd = new FormData();
        fd.append('name', form.name);
        fd.append('email', form.email);
        fd.append('phone', form.phone);
        fd.append('type', form.type);
        fd.append('status', form.status);
        if (form.address) fd.append('address', form.address);
        if (form.logo) fd.append('logo', form.logo);


        try {
            await organizationsApi.create(fd);
            onSuccess('organisation créer avec succès');
            onClose();
        } catch {
            onError("Impossible de créer l'organisation");
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

                    {/* type ['ONG','association','entreprise','ecole','autre'] */}
                    <div>
                        <label htmlFor="org-type" className="block text-sm mb-1">Type</label>
                        <select
                            id="org-type"
                            value={form.type}
                            onChange={(e) => setForm({ ...form, type: e.target.value })}
                            className="input w-full"
                        >
                            <option value="">type d'organisation</option>
                            <option value="ONG">ONG</option>
                            <option value="association">Association</option>
                            <option value="entreprise">Entreprise</option>
                            <option value="ecole">Ecole</option>
                            <option value="autre">Autre</option>
                        </select>
                    </div>

                    {/* LOGO */}
                    <div>
                        <label htmlFor="org-logo" className="block text-sm mb-1">Logo</label>
                        <TextInput
                            id="org-logo"
                            type="file"
                            accept="image/*"
                            onChange={(e) => setForm({ ...form, logo: e.target.files[0] })}
                            iconLeft={Image}
                            className="w-full text-sm text-[var(--color-gray)] file:mr-4 file:py-2 file:px-4 file:rounded-[var(--radius-md)] file:border-0 file:text-sm file:font-semibold file:bg-[var(--color-primary)] file:text-white hover:file:bg-[var(--color-primary-hover)] transition cursor-pointer"
                        />
                    </div>

                    <button type='submit' className="btn-primary w-full">
                        créer l'organisation
                    </button>

                </form>

            </div>
        </div>
    );
}

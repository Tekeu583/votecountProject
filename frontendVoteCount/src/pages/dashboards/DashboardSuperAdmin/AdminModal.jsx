import { useState } from 'react';
import { Mail, X } from 'lucide-react';
import TextInput from '@components/ui/TextInput';
import { usersApi } from '@services/api';

export default function AdminModal({ data, onClose, onSuccess, onError }) {
    const [form, setForm] = useState({
        email: data?.email || '',
        role: data?.roles?.[0] || 'admin',
        status: data?.status || 'active',
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!form.email.trim()) {
            return onError("L'email est requis");
        }

        setLoading(true);
        try {
            if (data) {
                // Utilisateur existant sélectionné dans la liste : on change son rôle/statut.
                await usersApi.update(data.uuid, { role: form.role, status: form.status });
                onSuccess('Administrateur mis à jour avec succès');
            } else {
                // Promouvoir un compte existant : on le retrouve par email,
                // on ne crée jamais de nouveau compte depuis cet écran.
                const res = await usersApi.getAll(1, 5, { search: form.email.trim() });
                const list = res.data?.data?.data ?? res.data?.data ?? [];
                const match = list.find(u => u.email?.toLowerCase() === form.email.trim().toLowerCase());

                if (!match) {
                    setLoading(false);
                    return onError("Aucun compte existant avec cet email. L'utilisateur doit d'abord s'inscrire sur la plateforme.");
                }

                await usersApi.update(match.uuid, { role: form.role, status: form.status });
                onSuccess('Administrateur ajouté avec succès');
            }
            onClose();
        } catch (err) {
            onError(err.response?.data?.message ?? "Une erreur est survenue");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
            <div className="bg-white w-full max-w-md rounded shadow">
                {/* HEADER */}
                <div className="flex justify-between p-4">
                    <h2 className="font-semibold">
                        {data ? 'Modifier admin' : 'Ajouter un administrateur'}
                    </h2>
                    <button onClick={onClose}>
                        <X />
                    </button>
                </div>
                {!data && (
                    <small className='px-4 flex text-[var(--color-warning)]'>
                        L'administrateur doit avoir un compte existant sur la plateforme avec cette adresse email.
                    </small>
                )}

                {/* FORM */}
                <form onSubmit={handleSubmit} className="p-4 space-y-3">
                    <TextInput
                        className="w-full"
                        placeholder="Email"
                        label="Email"
                        name="email"
                        value={form.email}
                        iconLeft={Mail}
                        required
                        disabled={Boolean(data)}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                    />
                    <select
                        className="input w-full"
                        value={form.role}
                        name='role'
                        onChange={(e) => setForm({ ...form, role: e.target.value })}
                    >
                        <option value="super_admin">Super Admin</option>
                        <option value="admin">Admin</option>
                    </select>
                    <select
                        className="input w-full"
                        value={form.status}
                        name='status'
                        onChange={(e) => setForm({ ...form, status: e.target.value })}
                    >
                        <option value="active">Actif</option>
                        <option value="inactive">Inactif</option>
                        <option value="suspended">Suspendu</option>
                    </select>
                    <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50">
                        {loading ? 'Enregistrement...' : 'Enregistrer'}
                    </button>

                </form>
            </div>
        </div>
    );
}

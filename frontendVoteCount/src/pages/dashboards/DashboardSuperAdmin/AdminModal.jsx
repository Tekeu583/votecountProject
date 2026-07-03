import { useState } from 'react';
import { Mail, User, X } from 'lucide-react';
import TextInput from '@components/ui/TextInput';
export default function AdminModal({ data, onClose, onSave }) {
    const [form, setForm] = useState({
        name: data?.name || '',
        email: data?.email || '',
        role: data?.role || '',
        status: data?.status || 'Actif',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(form);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
            <div className="bg-white w-full max-w-md rounded shadow">
                {/* HEADER */}
                <div className="flex justify-between p-4">
                    <h2 className="font-semibold">
                        {data ? 'Modifier admin' : 'Créer admin'}
                    </h2>
                    <button onClick={onClose}>
                        <X />
                    </button>
                </div>
                <small className='px-4 flex text-[var(--color-warning)]'>{data ? '' : "L'administrateur doit avoir un compte sur la plateforme avec son adresse email"}</small>

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
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                    />
                    <select
                        className="input w-full"
                        value={form.role}
                        name='role'
                        onChange={(e) => setForm({ ...form, role: e.target.value })}
                    >
                        <option disabled value=''>---Choisir le role</option>
                        <option value="SUPER_ADMIN">Super Admin</option>
                        <option value="EDITEUR">Editeur</option>
                        <option value="AUDITEUR">Auditeur</option>
                    </select>
                    <select
                        className="input w-full"
                        value={form.status}
                        name='status'
                        onChange={(e) => setForm({ ...form, status: e.target.value })}
                    >
                        <option>Actif</option>
                        <option>Inactif</option>
                    </select>
                    <button className="btn-primary w-full">
                        Enregistrer
                    </button>

                </form>
            </div>
        </div>
    );
}

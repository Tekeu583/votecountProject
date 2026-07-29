import { useState } from 'react';
import PropTypes from 'prop-types';
import TextInput from '@components/ui/TextInput';
import { User, Mail,LockKeyhole, X } from 'lucide-react';

export default function UserModal({ data, onClose, onSave }) {
    const [form, setForm] = useState({
        first_name: data?.first_name || '',
        last_name: data?.last_name || '',
        email: data?.email || '',
        password: '',
        password_confirmation: '',
        // data.roles vient de GET /users : objets Spatie complets
        // ({id, name, ...}), pas de simples chaînes.
        role: (typeof data?.roles?.[0] === 'string' ? data.roles[0] : data?.roles?.[0]?.name) || 'user',
        status: data?.status || 'active',
    });

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!form.first_name.trim() || !form.last_name.trim() || !form.email.trim()) {
            return;
        }
        if (!data && !form.password) {
            return; // mot de passe obligatoire à la création
        }
        if (form.password && form.password !== form.password_confirmation) {
            return;
        }

        // En édition, un mot de passe vide doit être omis (sinon 422 :
        // min:8 sur une chaîne vide n'est pas exempté par "nullable").
        const payload = { ...form };
        if (!payload.password) {
            delete payload.password;
            delete payload.password_confirmation;
        }

        onSave(payload);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
            <div className="bg-white w-full max-w-md rounded shadow">

                {/* HEADER */}
                <div className="flex justify-between p-4">
                    <h2 className="font-semibold">
                        {data ? 'Modifier' : 'Créer'} utilisateur
                    </h2>
                    <button onClick={onClose}>
                        <X />
                    </button>
                </div>

                {/* FORM */}
                <form onSubmit={handleSubmit} className="p-4 space-y-3">

                    <TextInput
                        placeholder="Prénom"
                        className="w-full"
                        value={form.first_name}
                        iconLeft={User}
                        onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                    />

                    <TextInput
                        placeholder="Nom"
                        className="w-full"
                        value={form.last_name}
                        iconLeft={User}
                        onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                    />

                    <TextInput
                        placeholder="Email"
                        className="w-full"
                        value={form.email}
                        iconLeft={Mail}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                    />
                    <TextInput
                        placeholder="Mot de passe"
                        className="w-full"
                        value={form.password}
                        iconLeft={LockKeyhole}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                    />
                    <TextInput
                        placeholder="Confirmer mot de passe"
                        className="w-full"
                        value={form.password_confirmation}
                        iconLeft={LockKeyhole}
                        onChange={(e) => setForm({ ...form, password_confirmation: e.target.value })}
                    />
                    <select
                        className="input w-full capitalize"
                        value={form.role}
                        onChange={(e) => setForm({ ...form, role: e.target.value })}
                    >
                        <option value="super_admin">Super Admin</option>
                        <option value="admin">Admin</option>
                        <option value="organization_owner">Propriétaire d'organisation</option>
                        <option value="election_manager">Gestionnaire d'élection</option>
                        <option value="jury">Jury</option>
                        <option value="observer">Observateur</option>
                        <option value="candidat">Candidat</option>
                        <option value="user">User</option>
                    </select>

                    <select
                        className="input w-full"
                        value={form.status}
                        onChange={(e) => setForm({ ...form, status: e.target.value })}
                    >
                        <option value="active">Actif</option>
                        <option value="inactive">Inactif</option>
                        <option value="suspended">Suspendu</option>
                    </select>
                    <button className="btn-primary w-full">
                        Enregistrer
                    </button>
                </form>
            </div>
        </div>
    );
}

UserModal.propTypes = {
    data: PropTypes.shape({
        first_name: PropTypes.string,
        last_name: PropTypes.string,
        email: PropTypes.string,
        role: PropTypes.string,
        status: PropTypes.string,
    }),
    onClose: PropTypes.func.isRequired,
    onSave: PropTypes.func.isRequired,
};

UserModal.defaultProps = {
    data: null,
};


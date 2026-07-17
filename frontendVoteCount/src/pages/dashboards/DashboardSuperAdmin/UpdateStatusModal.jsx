import { useState } from 'react';
import { organizationsApi } from '@services/api';
import { X } from 'lucide-react';

export default function UpdateStatusModal({ org, onClose, onSuccess, onError }) {
    const [status, setStatus] = useState(org.status ?? '');

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // FIX : org.uuid au lieu de org.id (id interne non exposé par l'API)
            await organizationsApi.update(org.uuid, { status });
            onSuccess('Statut mis à jour avec succès');
            onClose();
        } catch {
            onError("Impossible de mettre à jour le statut");
        }
    };

    return (
        <div className="fixed inset-0 bg-[var(--color-dark)]/40 opacity-90 flex items-center justify-center text-[var(--text-primary)]">
            <div className="bg-[var(--color-white)] p-6 rounded-[var(--radius-md)] w-full max-w-sm relative">
                <button onClick={onClose} className="absolute top-4 right-4">
                    <X />
                </button>

                <h2 className="font-bold mb-4">Modifier le statut de {org.name}</h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        className="input w-full"
                    >
                        <option value="">-- Choisir un statut</option>
                        {/* Enum réel côté backend (organizations.status) :
                            active, inactive, suspended — "pending"/"expired"
                            n'existent pas et feraient échouer la requête (422). */}
                        <option value="active">Actif</option>
                        <option value="inactive">Inactif</option>
                        <option value="suspended">Suspendu</option>
                    </select>

                    <button type="submit" className="btn-primary w-full">
                        Enregistrer
                    </button>
                </form>
            </div>
        </div>
    );
}

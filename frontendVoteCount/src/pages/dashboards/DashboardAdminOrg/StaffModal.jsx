'use client';

import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { X, Mail } from 'lucide-react';
import TextInput from '@components/ui/TextInput';
import { staffApi } from '@services/api';

// Même principe que JuryModal : l'API ne connaît qu'un état binaire par
// (personne, élection) — "Modifier" revient à cocher/décocher des élections,
// avec un seul rôle appliqué aux nouvelles affectations de cette soumission
// (le rôle des affectations déjà existantes n'est pas modifié ici).
const StaffModal = ({
    isOpen = false,
    onClose,
    mode = 'add',
    staffToEdit = null,
    elections = [],
    onSuccess,
    onError,
}) => {
    const [formData, setFormData] = useState({ email: '', role: 'manager', selectedElectionUuids: [] });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!isOpen) return;

        if (mode === 'edit' && staffToEdit) {
            setFormData({
                email: staffToEdit.email || '',
                role: staffToEdit.assignments?.[0]?.role_slug || 'manager',
                selectedElectionUuids: (staffToEdit.assignments ?? []).map((a) => a.electionUuid),
            });
        } else {
            setFormData({ email: '', role: 'manager', selectedElectionUuids: [] });
        }
    }, [isOpen, mode, staffToEdit]);

    const toggleElection = (electionUuid) => {
        setFormData((prev) => ({
            ...prev,
            selectedElectionUuids: prev.selectedElectionUuids.includes(electionUuid)
                ? prev.selectedElectionUuids.filter((uuid) => uuid !== electionUuid)
                : [...prev.selectedElectionUuids, electionUuid],
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.email.trim()) {
            onError("L'adresse email est obligatoire");
            return;
        }
        if (formData.selectedElectionUuids.length === 0) {
            onError('Veuillez assigner au moins une élection');
            return;
        }

        setLoading(true);
        try {
            const originalUuids = mode === 'edit' ? (staffToEdit?.assignments ?? []).map((a) => a.electionUuid) : [];
            const toAdd = formData.selectedElectionUuids.filter((uuid) => !originalUuids.includes(uuid));
            const toRemove = originalUuids.filter((uuid) => !formData.selectedElectionUuids.includes(uuid));

            await Promise.all(toAdd.map((uuid) => staffApi.create(uuid, { email: formData.email.trim(), role: formData.role })));
            if (mode === 'edit' && staffToEdit?.userUuid) {
                await Promise.all(toRemove.map((uuid) => staffApi.delete(uuid, staffToEdit.userUuid)));
            }

            onSuccess(mode === 'add' ? 'Membre affecté avec succès' : 'Affectations mises à jour');
            onClose();
        } catch (error) {
            onError(error.response?.data?.message ?? 'Une erreur est survenue');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-[var(--color-dark)]/60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-lg max-h-[92vh] overflow-hidden flex flex-col shadow-xl">
                <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--color-gray-light)]">
                    <h2 className="text-xl font-semibold text-[var(--color-dark)]">
                        {mode === 'add' ? 'Affecter un membre du staff' : 'Modifier les affectations'}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-[var(--color-dark)] transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-auto p-6 space-y-6">
                    <TextInput
                        label="Adresse email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                        placeholder="exemple@entreprise.com"
                        required
                        iconLeft={Mail}
                        disabled={mode === 'edit'}
                    />
                    <p className="text-xs text-[var(--color-gray)] -mt-4">
                        La personne doit déjà posséder un compte VoteCount avec cet email.
                    </p>

                    <div>
                        <label htmlFor="staff-role" className="block text-sm font-medium text-[var(--color-dark)] mb-2">
                            Rôle
                        </label>
                        <select
                            id="staff-role"
                            value={formData.role}
                            onChange={(e) => setFormData((prev) => ({ ...prev, role: e.target.value }))}
                            className="w-full border border-[var(--color-gray-light)] rounded-[var(--radius-md)] px-4 py-3 focus:outline-none focus:border-[var(--color-primary)]"
                        >
                            <option value="manager">Gestionnaire d'élection</option>
                            <option value="observer">Observateur</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-[var(--color-dark)] mb-3">
                            Élections assignées
                        </label>
                        <div className="space-y-2 max-h-72 overflow-auto pr-2">
                            {elections.length === 0 ? (
                                <p className="text-[var(--color-gray)] text-sm py-8 text-center border border-dashed border-[var(--color-gray-light)] rounded-xl">
                                    Aucune élection disponible.
                                </p>
                            ) : (
                                elections.map((election) => (
                                    <label
                                        key={election.uuid}
                                        className="flex items-center gap-3 p-3 border border-[var(--color-gray-light)] rounded-[var(--radius-md)] cursor-pointer hover:border-[var(--color-primary)]/50"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={formData.selectedElectionUuids.includes(election.uuid)}
                                            onChange={() => toggleElection(election.uuid)}
                                        />
                                        <span className="flex-1 min-w-0 text-sm font-medium truncate">{election.title}</span>
                                    </label>
                                ))
                            )}
                        </div>
                    </div>
                </form>

                <div className="border-t border-[var(--color-gray-light)] p-6 flex gap-3">
                    <button type="button" onClick={onClose} className="flex-1 py-3 btn-secondary transition-colors">
                        Annuler
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={loading}
                        className="flex-1 py-3 btn-primary disabled:opacity-70 whitespace-nowrap disabled:cursor-not-allowed transition-colors"
                    >
                        {loading ? 'Enregistrement...' : mode === 'add' ? 'Affecter' : 'Enregistrer les modifications'}
                    </button>
                </div>
            </div>
        </div>
    );
};

StaffModal.propTypes = {
    isOpen: PropTypes.bool,
    onClose: PropTypes.func.isRequired,
    mode: PropTypes.oneOf(['add', 'edit']),
    staffToEdit: PropTypes.shape({
        userUuid: PropTypes.string,
        email: PropTypes.string,
        assignments: PropTypes.arrayOf(PropTypes.object),
    }),
    elections: PropTypes.arrayOf(PropTypes.object),
    onSuccess: PropTypes.func.isRequired,
    onError: PropTypes.func.isRequired,
};

export default StaffModal;

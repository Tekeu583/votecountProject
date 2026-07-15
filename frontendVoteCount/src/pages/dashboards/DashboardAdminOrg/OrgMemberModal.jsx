'use client';

import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { X, Mail } from 'lucide-react';
import TextInput from '@components/ui/TextInput';
import { organizationsApi } from '@services/api';
import { useOrg } from '@hooks/useOrg';

const OrgMemberModal = ({
    isOpen = false,
    onClose,
    mode = 'add',
    memberToEdit = null,
    onSuccess,
    onError,
}) => {
    const { org } = useOrg();
    const [formData, setFormData] = useState({ email: '', role: 'member' });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!isOpen) return;

        if (mode === 'edit' && memberToEdit) {
            setFormData({ email: memberToEdit.email || '', role: memberToEdit.role_slug || 'member' });
        } else {
            setFormData({ email: '', role: 'member' });
        }
    }, [isOpen, mode, memberToEdit]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.email.trim()) {
            onError("L'adresse email est obligatoire");
            return;
        }

        setLoading(true);
        try {
            if (mode === 'edit' && memberToEdit?.uuid) {
                await organizationsApi.updateUserRole(org.uuid, memberToEdit.uuid, formData.role);
            } else {
                await organizationsApi.addUser(org.uuid, formData.email.trim(), formData.role);
            }

            onSuccess(mode === 'add' ? 'Membre ajouté avec succès' : 'Rôle mis à jour');
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
            <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden flex flex-col shadow-xl">
                <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--color-gray-light)]">
                    <h2 className="text-xl font-semibold text-[var(--color-dark)]">
                        {mode === 'add' ? "Ajouter un membre de l'organisation" : 'Modifier le rôle'}
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
                    {mode === 'add' && (
                        <p className="text-xs text-[var(--color-gray)] -mt-4">
                            Le membre doit déjà posséder un compte VoteCount avec cet email.
                        </p>
                    )}

                    <div>
                        <label htmlFor="member-role" className="block text-sm font-medium text-[var(--color-dark)] mb-2">
                            Rôle dans l'organisation
                        </label>
                        <select
                            id="member-role"
                            value={formData.role}
                            onChange={(e) => setFormData((prev) => ({ ...prev, role: e.target.value }))}
                            className="w-full border border-[var(--color-gray-light)] rounded-[var(--radius-md)] px-4 py-3 focus:outline-none focus:border-[var(--color-primary)]"
                        >
                            <option value="admin">Administrateur</option>
                            <option value="member">Membre</option>
                            <option value="viewer">Observateur</option>
                        </select>
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
                        {loading ? 'Enregistrement...' : mode === 'add' ? 'Ajouter' : 'Enregistrer'}
                    </button>
                </div>
            </div>
        </div>
    );
};

OrgMemberModal.propTypes = {
    isOpen: PropTypes.bool,
    onClose: PropTypes.func.isRequired,
    mode: PropTypes.oneOf(['add', 'edit']),
    memberToEdit: PropTypes.shape({
        uuid: PropTypes.string,
        email: PropTypes.string,
        role_slug: PropTypes.string,
    }),
    onSuccess: PropTypes.func.isRequired,
    onError: PropTypes.func.isRequired,
};

export default OrgMemberModal;

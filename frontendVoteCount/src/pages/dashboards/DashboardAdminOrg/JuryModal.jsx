'use client';

import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { X, Mail } from 'lucide-react';
import TextInput from '@components/ui/TextInput';
import { juryApi } from '@services/api';
const STATUTS_POSSIBLES = [
    { value: 'Actif', label: 'Actif', color: 'bg-green-100 text-green-700' },
    { value: 'Invitation envoyée', label: 'Invitation envoyée', color: 'bg-orange-100 text-orange-700' },
    { value: 'Retiré', label: 'Retiré', color: 'bg-red-100 text-red-700' },
    { value: 'En attente', label: 'En attente', color: 'bg-[var(--color-gray-light)] text-gray-700' },
];

const JuryModal = ({
    isOpen = false,
    onClose,
    mode = 'add',
    juryToEdit = null,
    elections = [],
    onSuccess,
    onError,
}) => {
    const [formData, setFormData] = useState({
        email: '',
        selectedElections: [], // [{ electionId, statut }, ...]
    });

    const [loading, setLoading] = useState(false);

    // Initialisation du formulaire (ajout ou édition)
    useEffect(() => {
        if (!isOpen) return;

        if (mode === 'edit' && juryToEdit) {
            const assignments = juryToEdit.assignments?.length > 0
                ? juryToEdit.assignments.map((ass) => ({
                    electionId: ass.id,
                    statut: ass.status === 'Invitation'
                        ? 'Invitation envoyée'
                        : ass.status || 'Actif',
                }))
                : [];
            setFormData({
                email: juryToEdit.email || '',
                selectedElections: assignments,
            });
        } else {
            // Mode ajout
            setFormData({
                email: '',
                selectedElections: [],
            });
        }
    }, [isOpen, mode, juryToEdit]);

    const handleEmailChange = (e) => {
        setFormData(prev => ({ ...prev, email: e.target.value }));
    };

    const addElection = (electionId) => {
        if (!electionId) return;

        const id = Number(electionId);
        if (formData.selectedElections.some(item => item.electionId === id)) {
            onError("Cette élection est déjà assignée");
            return;
        }

        setFormData(prev => ({
            ...prev,
            selectedElections: [
                ...prev.selectedElections,
                { electionId: id, statut: 'Actif' }
            ]
        }));
    };

    const updateStatut = (electionId, newStatut) => {
        setFormData(prev => ({
            ...prev,
            selectedElections: prev.selectedElections.map(item =>
                item.electionId === electionId ? { ...item, statut: newStatut } : item
            )
        }));
    };

    const removeElection = (electionId) => {
        setFormData(prev => ({
            ...prev,
            selectedElections: prev.selectedElections.filter(item => item.electionId !== electionId)
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.email.trim()) {
            onError("L'adresse email est obligatoire");
            return;
        }

        if (formData.selectedElections.length === 0) {
            onError("Veuillez assigner au moins une élection");
            return;
        }
        setLoading(true);

        try {
            const dataToSave = {
                mode,
                email: formData.email.trim(),
                assignments: formData.selectedElections,
            };

            if (mode === 'add') {
                await juryApi.create(elections[0].uuid, dataToSave);
                onSuccess("Jury ajouté avec succès à l'élection !");
            } else {
                await juryApi.update(juryToEdit.id, dataToSave);
                onSuccess("Jury modifié avec succès !");
            }
            onSuccess(mode === 'add' ? "Jury invité avec succès" : "Jury modifié avec succès");
            onClose();
        } catch (error) {
            onError("Une erreur est survenue ", error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-[var(--color-dark)]/60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-lg max-h-[92vh] overflow-hidden flex flex-col shadow-xl">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--color-gray-light)]">
                    <h2 className="text-xl font-semibold text-[var(--color-dark)]">
                        {mode === 'add' ? "Inviter un nouveau jury" : "Modifier le jury"}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-[var(--color-dark)] transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-auto p-6 space-y-6">
                    {/* Email */}
                    <TextInput
                        label="Adresse email du jury"
                        type="email"
                        value={formData.email}
                        onChange={handleEmailChange}
                        placeholder="exemple@entreprise.com"
                        required
                        iconLeft={Mail}
                    />

                    {/* Assignation des élections */}
                    <div>
                        <label className="block text-sm font-medium text-[var(--color-dark)] mb-3">
                            Assigner à des élections
                        </label>

                        <div className="flex gap-3 mb-4">
                            <select
                                onChange={(e) => addElection(e.target.value)}
                                className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-[var(--color-primary)] bg-white"
                                defaultValue=""
                            >
                                <option value="">Sélectionner une élection à ajouter...</option>
                                {elections.map((election) => (
                                    <option key={election.id} value={election.id}>
                                        {election.title}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Liste des élections assignées */}
                        <div className="space-y-3 max-h-80 overflow-auto pr-2">
                            {formData.selectedElections.length === 0 ? (
                                <p className="text-[var(--color-gray)] text-sm py-8 text-center border border-dashed border-[var(--color-gray-light)] rounded-xl">
                                    Aucune élection assignée pour le moment
                                </p>
                            ) : (
                                formData.selectedElections.map((assignment) => {
                                    const election = elections.find(e => e.id === assignment.electionId);
                                    return (
                                        <div key={assignment.electionId} className="flex items-center gap-3  p-4 rounded-[var(--radius-md)] group">
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-sm truncate">{election?.title}</p>
                                            </div>

                                            <select
                                                value={assignment.statut}
                                                onChange={(e) => updateStatut(assignment.electionId, e.target.value)}
                                                className="px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                                            >
                                                {STATUTS_POSSIBLES.map((statut) => (
                                                    <option key={statut.value} value={statut.value}>
                                                        {statut.label}
                                                    </option>
                                                ))}
                                            </select>

                                            <button
                                                type="button"
                                                onClick={() => removeElection(assignment.electionId)}
                                                className="text-red-500 hover:text-red-700 opacity-70 hover:opacity-100 transition-all p-1"
                                            >
                                                <X size={18} />
                                            </button>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </form>

                {/* Footer */}
                <div className="border-t border-[var(--color-gray-light)] p-6 flex gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 py-3 btn-secondary transition-colors"
                    >
                        Annuler
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={loading}
                        className="flex-1 py-3 btn-primary disabled:opacity-70 whitespace-nowrap disabled:cursor-not-allowed transition-colors"
                    >
                        {loading
                            ? "Enregistrement..."
                            : mode === 'add'
                                ? "Inviter le jury"
                                : "Enregistrer les modifications"
                        }
                    </button>
                </div>
            </div>
        </div>
    );
};

JuryModal.propTypes = {
    isOpen: PropTypes.bool,
    onClose: PropTypes.func.isRequired,
    mode: PropTypes.oneOf(['add', 'edit']),
    juryToEdit: PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        email: PropTypes.string,
        assignments: PropTypes.arrayOf(PropTypes.object),
        polls: PropTypes.arrayOf(PropTypes.object),
    }),
    elections: PropTypes.arrayOf(PropTypes.object),
    onSuccess: PropTypes.func.isRequired,
    onError: PropTypes.func.isRequired,
};

export default JuryModal;
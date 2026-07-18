import { useState } from 'react';
import { X, Loader2, FileText } from 'lucide-react';
import TextInput from '@components/ui/TextInput';
import { kycApi } from '@services/api';

export default function KycReviewModal({ organization, onClose, onSuccess, onError }) {
    const [rejectionReason, setRejectionReason] = useState('');
    const [showRejectForm, setShowRejectForm] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const review = async (decision, reason) => {
        setSubmitting(true);
        try {
            await kycApi.review(organization.uuid, {
                decision,
                rejection_reason: reason,
            });
            onSuccess(decision === 'verified' ? 'Organisation vérifiée avec succès.' : 'Vérification KYC rejetée.');
            onClose();
        } catch (error) {
            onError(error.response?.data?.message ?? 'Une erreur est survenue.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleReject = (e) => {
        e.preventDefault();
        if (!rejectionReason.trim()) return;
        review('rejected', rejectionReason.trim());
    };

    return (
        <div className="fixed inset-0 bg-[var(--color-dark)]/40 opacity-90 flex items-center justify-center text-[var(--text-primary)] z-50">
            <div className="bg-[var(--color-white)] p-6 rounded-[var(--radius-md)] w-full max-w-md relative max-h-[90vh] overflow-y-auto">
                <button onClick={onClose} className="absolute top-4 right-4">
                    <X />
                </button>

                <h2 className="font-bold mb-1">Vérification KYC — {organization.name}</h2>
                <p className="text-sm text-[var(--color-gray)] mb-4">
                    Représentant légal : <span className="font-medium text-[var(--color-dark)]">{organization.kyc_legal_representative_name ?? '—'}</span>
                </p>

                <div className="space-y-3 mb-4">
                    <a
                        href={organization.kyc_identity_document_url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 border border-gray-200 rounded-[var(--radius-md)] px-4 py-3 hover:border-[var(--color-primary)] text-sm"
                    >
                        <FileText size={16} className="text-[var(--color-gray)]" />
                        Pièce d'identité ({organization.kyc_identity_document_type ?? 'document'})
                    </a>
                    <a
                        href={organization.kyc_business_document_url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 border border-gray-200 rounded-[var(--radius-md)] px-4 py-3 hover:border-[var(--color-primary)] text-sm"
                    >
                        <FileText size={16} className="text-[var(--color-gray)]" />
                        Justificatif d'entreprise
                    </a>
                </div>

                {!showRejectForm ? (
                    <div className="flex gap-3">
                        <button
                            onClick={() => review('verified')}
                            disabled={submitting}
                            className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {submitting ? <Loader2 size={16} className="animate-spin" /> : null}
                            Vérifier
                        </button>
                        <button
                            onClick={() => setShowRejectForm(true)}
                            disabled={submitting}
                            className="flex-1 border border-gray-300 rounded-[var(--radius-md)] px-4 py-3 hover:bg-gray-50 disabled:opacity-50"
                        >
                            Rejeter
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleReject} className="space-y-4">
                        <TextInput
                            label="Motif du rejet"
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            placeholder="Ex : document illisible"
                            required
                        />
                        <div className="flex gap-3">
                            <button type="submit" disabled={submitting} className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50">
                                {submitting ? <Loader2 size={16} className="animate-spin" /> : null}
                                Confirmer le rejet
                            </button>
                            <button type="button" onClick={() => setShowRejectForm(false)} className="flex-1 border border-gray-300 rounded-[var(--radius-md)] px-4 py-3 hover:bg-gray-50">
                                Annuler
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}

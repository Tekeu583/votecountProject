import { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import TextInput from '@components/ui/TextInput';
import { withdrawalsApi } from '@services/api';

export default function WithdrawalReviewModal({ withdrawal, onClose, onSuccess, onError }) {
    const [rejectionReason, setRejectionReason] = useState('');
    const [paymentReference, setPaymentReference] = useState('');
    const [adminNotes, setAdminNotes] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [showRejectForm, setShowRejectForm] = useState(false);

    const run = async (action) => {
        setSubmitting(true);
        try {
            await action();
        } catch (error) {
            onError(error.response?.data?.message ?? "Une erreur est survenue.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleApprove = () => run(async () => {
        await withdrawalsApi.approve(withdrawal.uuid);
        onSuccess('Demande de retrait approuvée.');
        onClose();
    });

    const handleReject = (e) => {
        e.preventDefault();
        if (!rejectionReason.trim()) return;
        run(async () => {
            await withdrawalsApi.reject(withdrawal.uuid, rejectionReason.trim());
            onSuccess('Demande de retrait rejetée.');
            onClose();
        });
    };

    const handleMarkPaid = (e) => {
        e.preventDefault();
        if (!paymentReference.trim()) return;
        run(async () => {
            await withdrawalsApi.markPaid(withdrawal.uuid, {
                payment_reference: paymentReference.trim(),
                admin_notes: adminNotes.trim() || undefined,
            });
            onSuccess('Retrait marqué comme payé.');
            onClose();
        });
    };

    return (
        <div className="fixed inset-0 bg-[var(--color-dark)]/40 opacity-90 flex items-center justify-center text-[var(--text-primary)] z-50">
            <div className="bg-[var(--color-white)] p-6 rounded-[var(--radius-md)] w-full max-w-md relative max-h-[90vh] overflow-y-auto">
                <button onClick={onClose} className="absolute top-4 right-4">
                    <X />
                </button>

                <h2 className="font-bold mb-1">Demande de retrait — {withdrawal.organization?.name}</h2>
                <div className="text-sm text-[var(--color-gray)] mb-4 space-y-1">
                    <p>Montant : <span className="font-semibold text-[var(--color-dark)]">{Number(withdrawal.amount).toLocaleString('fr-FR')} {withdrawal.currency}</span></p>
                    <p>Numéro : <span className="font-medium text-[var(--color-dark)]">{withdrawal.phone_number}</span> ({withdrawal.payout_provider ?? 'non précisé'})</p>
                    <p>Demandeur : {withdrawal.requester?.full_name ?? '—'}</p>
                    <p>Statut : <span className="font-medium text-[var(--color-dark)]">{withdrawal.status_label}</span></p>
                </div>

                {withdrawal.status === 'pending' && !showRejectForm && (
                    <div className="flex gap-3">
                        <button
                            onClick={handleApprove}
                            disabled={submitting}
                            className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {submitting ? <Loader2 size={16} className="animate-spin" /> : null}
                            Approuver
                        </button>
                        <button
                            onClick={() => setShowRejectForm(true)}
                            disabled={submitting}
                            className="flex-1 border border-gray-300 rounded-[var(--radius-md)] px-4 py-3 hover:bg-gray-50 disabled:opacity-50"
                        >
                            Rejeter
                        </button>
                    </div>
                )}

                {withdrawal.status === 'pending' && showRejectForm && (
                    <form onSubmit={handleReject} className="space-y-4">
                        <TextInput
                            label="Motif du rejet"
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            placeholder="Ex : documents KYC insuffisants"
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

                {withdrawal.status === 'approved' && (
                    <form onSubmit={handleMarkPaid} className="space-y-4">
                        <p className="text-sm text-[var(--color-gray)]">
                            Après avoir effectué le dépôt manuel sur le numéro fourni, saisissez la référence de la transaction pour clôturer la demande.
                        </p>
                        <TextInput
                            label="Référence de paiement"
                            value={paymentReference}
                            onChange={(e) => setPaymentReference(e.target.value)}
                            placeholder="Ex : réf. Orange Money"
                            required
                        />
                        <TextInput
                            label="Notes (optionnel)"
                            value={adminNotes}
                            onChange={(e) => setAdminNotes(e.target.value)}
                        />
                        <button type="submit" disabled={submitting} className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50">
                            {submitting ? <Loader2 size={16} className="animate-spin" /> : null}
                            Marquer comme payé
                        </button>
                    </form>
                )}

                {['rejected', 'paid', 'cancelled'].includes(withdrawal.status) && (
                    <p className="text-sm text-[var(--color-gray)]">
                        Cette demande est déjà clôturée{withdrawal.rejection_reason ? ` — motif : ${withdrawal.rejection_reason}` : ''}.
                    </p>
                )}
            </div>
        </div>
    );
}

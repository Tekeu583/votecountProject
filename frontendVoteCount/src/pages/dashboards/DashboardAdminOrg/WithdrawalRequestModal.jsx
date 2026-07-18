import { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import TextInput from '@components/ui/TextInput';
import { withdrawalsApi } from '@services/api';

export default function WithdrawalRequestModal({ organizationUuid, availableBalance, onClose, onSuccess }) {
    const [amount, setAmount] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [payoutProvider, setPayoutProvider] = useState('orange_money');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        const numericAmount = Number(amount);
        if (!numericAmount || numericAmount <= 0) {
            toast.error('Montant invalide.');
            return;
        }
        if (numericAmount > availableBalance) {
            toast.error('Le montant dépasse votre solde disponible.');
            return;
        }
        if (!phoneNumber.trim()) {
            toast.error('Le numéro de téléphone est requis.');
            return;
        }

        setSubmitting(true);
        try {
            await withdrawalsApi.create({
                organization_uuid: organizationUuid,
                amount: numericAmount,
                phone_number: phoneNumber.trim(),
                payout_provider: payoutProvider,
            });
            onSuccess('Demande de retrait soumise avec succès.');
            onClose();
        } catch (error) {
            toast.error(error.response?.data?.message ?? 'Erreur lors de la soumission de la demande.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-[var(--color-dark)]/40 opacity-90 flex items-center justify-center text-[var(--text-primary)] z-50">
            <div className="bg-[var(--color-white)] p-6 rounded-[var(--radius-md)] w-full max-w-md relative">
                <button onClick={onClose} className="absolute top-4 right-4">
                    <X />
                </button>

                <h2 className="font-bold mb-1">Demander un retrait</h2>
                <p className="text-sm text-[var(--color-gray)] mb-4">
                    Solde disponible : <span className="font-semibold text-[var(--color-dark)]">{availableBalance.toLocaleString('fr-FR')} CFA</span>
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <TextInput
                        label="Montant à retirer (CFA)"
                        type="number"
                        min="1000"
                        max={availableBalance}
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="Ex: 50000"
                        required
                    />

                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm text-[var(--color-gray-dark)]">Opérateur</label>
                        <select
                            value={payoutProvider}
                            onChange={(e) => setPayoutProvider(e.target.value)}
                            className="input w-full"
                        >
                            <option value="orange_money">Orange Money</option>
                            <option value="mtn_money">MTN Mobile Money</option>
                            <option value="other">Autre</option>
                        </select>
                    </div>

                    <TextInput
                        label="Numéro de téléphone pour le dépôt"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="+237 6XX XX XX XX"
                        required
                    />

                    <button type="submit" disabled={submitting} className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50">
                        {submitting ? <Loader2 size={16} className="animate-spin" /> : null}
                        {submitting ? 'Envoi...' : 'Soumettre la demande'}
                    </button>
                </form>
            </div>
        </div>
    );
}

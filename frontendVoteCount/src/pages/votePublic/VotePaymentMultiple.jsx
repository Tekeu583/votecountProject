// src/pages/votePublic/VotePaymentMultiple.jsx
//
// Équivalent de VotePayment.jsx pour le vote "multiple" : au lieu d'un seul
// candidat + un montant, on paie en une fois pour PLUSIEURS candidats,
// chacun avec son propre montant (choisis dans MultipleBallotForm.jsx).
// Même flux réel : créer le vote (1 Vote, N VoteItem) → initier le paiement
// CamPay → poller jusqu'à confirmation → rediriger vers la page de succès.

import { useState, useEffect, useRef, useMemo } from 'react';
import { Banknote, ArrowLeft, ShieldCheck, Phone, Lock, Loader2, XCircle, Smartphone, Vote as VoteIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import TextInput from '@components/ui/TextInput';
import { votesApi, paymentsApi } from '@services/api';
import { computeVoteQuantity } from '@utils/voteAmount';

const MAX_POLL_ATTEMPTS = 30;
const POLL_INTERVAL_MS = 4000;

const VotePaymentMultiple = () => {
    const { state } = useLocation();
    const { electionUuid } = useParams();
    const navigate = useNavigate();

    const election = state?.election;
    const candidates = state?.candidates ?? [];
    const votePrice = election?.vote_price;
    const currency = election?.currency ?? 'XAF';

    const [phoneNumber, setPhoneNumber] = useState('');
    // step: 'form' | 'creating' | 'polling' | 'success' | 'failed' | 'timeout'
    const [step, setStep] = useState('form');
    const [error, setError] = useState(null);
    const [transactionUuid, setTransactionUuid] = useState(null);

    const pollAttemptsRef = useRef(0);
    const pollTimerRef = useRef(null);

    useEffect(() => {
        if (!election || candidates.length === 0) {
            toast.error('Session de vote expirée. Veuillez recommencer.');
            navigate(`/elections/${electionUuid}`, { replace: true });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [election, candidates.length]);

    useEffect(() => {
        return () => {
            if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
        };
    }, []);

    const normalizePhoneForDisplay = (value) => value.replace(/[^\d]/g, '');

    const validatePhone = (value) => {
        const digits = normalizePhoneForDisplay(value);
        return digits.length === 9 || (digits.length === 12 && digits.startsWith('237'));
    };

    // Détail par candidat (montant + voix), recalculé depuis la sélection reçue.
    const items = useMemo(() => {
        return candidates.map((c) => {
            const { isValid, quantity } = computeVoteQuantity(c.amount, votePrice);
            return { ...c, isValid, quantity, amountValue: parseFloat(c.amount) };
        });
    }, [candidates, votePrice]);

    const totalAmount = items.reduce((sum, it) => sum + (it.amountValue || 0), 0);
    const totalQuantity = items.reduce((sum, it) => sum + (it.quantity || 0), 0);
    const allValid = items.length > 0 && items.every((it) => it.isValid);

    const pollPaymentStatus = async (txUuid) => {
        pollAttemptsRef.current += 1;

        try {
            const res = await paymentsApi.verifyVotePayment(electionUuid, { transaction_uuid: txUuid });
            const { status } = res.data?.data ?? {};

            if (status === 'completed') {
                setStep('success');
                toast.success('Paiement confirmé ! Vos votes sont validés.');
                navigate(`/vote/payment-success-multiple/${electionUuid}`, {
                    state: { items, election, totalAmount, totalQuantity, currency, transactionUuid: txUuid },
                });
                return;
            }

            if (status === 'failed') {
                setStep('failed');
                setError('Le paiement a échoué ou a été refusé. Vérifiez votre solde et réessayez.');
                return;
            }

            if (pollAttemptsRef.current >= MAX_POLL_ATTEMPTS) {
                setStep('timeout');
                return;
            }

            pollTimerRef.current = setTimeout(() => pollPaymentStatus(txUuid), POLL_INTERVAL_MS);
        } catch (err) {
            if (pollAttemptsRef.current >= MAX_POLL_ATTEMPTS) {
                setStep('timeout');
                return;
            }
            pollTimerRef.current = setTimeout(() => pollPaymentStatus(txUuid), POLL_INTERVAL_MS);
        }
    };

    const handleConfirmPayment = async () => {
        if (!allValid) {
            toast.error(`Chaque montant doit être un multiple exact de ${votePrice} ${currency}.`);
            return;
        }
        if (!phoneNumber.trim() || !validatePhone(phoneNumber)) {
            toast.error('Numéro invalide. Format attendu : 6XXXXXXXX ou 2376XXXXXXXX.');
            return;
        }

        setError(null);
        setStep('creating');

        try {
            const voteRes = await votesApi.submitPublic(electionUuid, {
                items: items.map((it) => ({ candidate_id: it.uuid, amount: it.amountValue })),
                idempotency_key: crypto.randomUUID(),
            });
            const vote = voteRes.data?.data;

            const payRes = await paymentsApi.initiateVotePayment(electionUuid, {
                vote_uuid: vote.uuid,
                provider: 'campay',
                phone_number: normalizePhoneForDisplay(phoneNumber),
            });
            const txUuid = payRes.data?.data?.transaction_uuid;
            setTransactionUuid(txUuid);

            setStep('polling');
            pollAttemptsRef.current = 0;
            pollPaymentStatus(txUuid);
        } catch (err) {
            const message = err.response?.data?.message ?? 'Une erreur est survenue. Veuillez réessayer.';
            setError(message);
            setStep('form');
            toast.error(message);
        }
    };

    const handleRetry = () => {
        setError(null);
        setTransactionUuid(null);
        pollAttemptsRef.current = 0;
        setStep('form');
    };

    if (!election || candidates.length === 0) return null;

    if (!votePrice || parseFloat(votePrice) <= 0) {
        return (
            <div className="pt-24 text-center px-4">
                <p className="text-gray-700 mb-4">Le prix du vote n'a pas pu être déterminé pour cette élection.</p>
                <button onClick={() => navigate(-1)} className="btn-primary">Retour</button>
            </div>
        );
    }

    return (
        <div className="bg-[var(--color-background-white)] pt-18 pb-12 min-h-screen">
            <div className=" mx-auto shadow-xl rounded-[var(--radius-md)] bg-[var(--color-white)] p-6">

                {step === 'form' && (
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-gray-700 hover:text-gray-900 font-medium mb-4"
                    >
                        <ArrowLeft size={20} /> Retour
                    </button>
                )}

                <div className="mb-6">
                    <p className="text-sm text-gray-600 text-center mb-4">{election.title}</p>
                    <div className="space-y-3">
                        {items.map((it) => (
                            <div key={it.uuid} className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
                                <img src={it.photo} alt={it.full_name} className="w-12 h-12 rounded-full object-cover shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-gray-900 truncate">{it.full_name}</p>
                                    <p className={`text-xs ${it.isValid ? 'text-[var(--color-primary)]' : 'text-amber-600'}`}>
                                        {it.isValid ? `${it.quantity} voix` : 'montant invalide'}
                                    </p>
                                </div>
                                <span className="font-semibold text-gray-800 shrink-0">{it.amountValue} {currency}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {step === 'form' && (
                    <div className="bg-white rounded-3xl p-2">
                        <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
                            <Smartphone className="text-[var(--color-primary)]" size={24} />
                            Paiement Mobile Money
                        </h3>

                        <div className="rounded-xl px-4 py-3 mb-6 flex items-center gap-2 text-sm font-medium bg-blue-50 text-[var(--color-primary)]">
                            <VoteIcon size={18} />
                            <span>
                                Total : <strong>{totalAmount} {currency}</strong> pour <strong>{totalQuantity}</strong> voix réparties sur {items.length} candidat{items.length > 1 ? 's' : ''}
                            </span>
                        </div>

                        <div className="mb-6">
                            <TextInput
                                type="tel"
                                label="Numéro de téléphone (MTN ou Orange)"
                                placeholder="6XXXXXXXX"
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                                name="phoneNumber"
                                required
                                iconLeft={Phone}
                                className="w-full text-lg"
                            />
                            <p className="text-xs text-gray-400 mt-2">
                                Vous recevrez une demande de confirmation (code PIN) sur ce numéro.
                            </p>
                        </div>

                        {error && (
                            <div className="bg-red-50 border border-red-100 text-red-700 text-sm rounded-xl p-4 mb-6 flex items-start gap-2">
                                <XCircle size={18} className="flex-shrink-0 mt-0.5" />
                                <p>{error}</p>
                            </div>
                        )}

                        <div className="bg-blue-50 border border-blue-100 p-5 rounded-2xl mb-8 text-sm">
                            <div className="flex gap-3">
                                <ShieldCheck className="text-[var(--color-primary)] mt-0.5" size={22} />
                                <p className="text-gray-700">
                                    Vos votes seront validés dès confirmation du paiement. Paiement sécurisé via CamPay.
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={handleConfirmPayment}
                            disabled={!allValid}
                            className="w-full bg-[var(--color-primary)] hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed py-3 h-12 rounded-[var(--radius-md)] text-white font-semibold text-lg flex items-center justify-center gap-3 transition-all active:scale-[0.98]"
                        >
                            <Banknote size={22} />
                            Payer {totalAmount} {currency} ({totalQuantity} voix)
                        </button>

                        <p className="text-center text-xs text-gray-500 mt-6 flex items-center justify-center gap-1">
                            <Lock size={12} /> Paiement 100% sécurisé et crypté
                        </p>
                    </div>
                )}

                {step === 'creating' && (
                    <div className="text-center py-10">
                        <Loader2 size={48} className="animate-spin text-[var(--color-primary)] mx-auto mb-4" />
                        <p className="text-gray-700 font-medium">Initialisation du paiement...</p>
                    </div>
                )}

                {step === 'polling' && (
                    <div className="text-center py-10">
                        <Loader2 size={48} className="animate-spin text-[var(--color-primary)] mx-auto mb-4" />
                        <p className="text-gray-900 font-semibold text-lg">En attente de confirmation</p>
                        <p className="text-gray-600 text-sm mt-2 max-w-sm mx-auto">
                            Une demande a été envoyée au <strong>{phoneNumber}</strong>.
                            Composez votre code PIN Mobile Money pour valider le paiement de{' '}
                            <strong>{totalQuantity} voix</strong>.
                        </p>
                    </div>
                )}

                {step === 'failed' && (
                    <div className="text-center py-10">
                        <XCircle size={48} className="text-red-500 mx-auto mb-4" />
                        <p className="text-gray-900 font-semibold text-lg">Paiement échoué</p>
                        <p className="text-gray-600 text-sm mt-2 mb-6">{error}</p>
                        <button onClick={handleRetry} className="bg-[var(--color-primary)] text-white font-semibold px-6 py-3 rounded-[var(--radius-md)]">
                            Réessayer
                        </button>
                    </div>
                )}

                {step === 'timeout' && (
                    <div className="text-center py-10">
                        <XCircle size={48} className="text-amber-500 mx-auto mb-4" />
                        <p className="text-gray-900 font-semibold text-lg">Ça prend plus de temps que prévu</p>
                        <p className="text-gray-600 text-sm mt-2 mb-6 max-w-sm mx-auto">
                            Vérifiez que vous avez bien confirmé la demande sur votre téléphone.
                            Si le problème persiste, réessayez.
                        </p>
                        <button onClick={handleRetry} className="bg-[var(--color-primary)] text-white font-semibold px-6 py-3 rounded-[var(--radius-md)]">
                            Réessayer
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default VotePaymentMultiple;

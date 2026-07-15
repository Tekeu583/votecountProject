// src/pages/votePublic/VotePayment.jsx
//
// FIX (Claude): reconstruction complète — l'ancienne version était un mockup :
// aucun paiement réel n'était jamais déclenché, le montant était un champ
// éditable sans lien avec un calcul de voix, et 3 méthodes de paiement
// fictives étaient proposées (carte/mobile-money/paypal).
//
// Modèle métier (vote payant "achat de voix en bloc") : vote_price est le
// prix d'UNE voix. L'électeur peut payer un multiple de ce prix pour obtenir
// plusieurs voix pour le même candidat (ex: vote_price=25, il paie 100 → 4
// voix). Le nombre de voix s'affiche en direct sous le champ montant.
//
// Flux réel (option validée : créer le vote seulement au moment de payer,
// pas de "votes fantômes" en base) :
//   1. L'électeur saisit un montant (multiple du prix) et son numéro
//   2. On crée le vote (POST vote/public, items[0].amount = montant saisi)
//      → is_paid=true, is_completed=false, quantité calculée côté backend
//   3. On initie le paiement CamPay avec ce vote_uuid (POST vote/payment/initiate)
//   4. On poll le statut (POST vote/payment/verify, qui interroge CamPay) toutes
//      les ~4s jusqu'à "completed" (vote validé) ou "failed"
//   5. Redirection vers la page de succès avec les vraies données

import { useState, useEffect, useRef, useMemo } from 'react';
import { Banknote, ArrowLeft, ShieldCheck, Phone, Lock, Loader2, XCircle, Smartphone, Vote as VoteIcon, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import TextInput from '@components/ui/TextInput';
import { votesApi, paymentsApi } from '@services/api';
import { computeVoteQuantity } from '@utils/voteAmount';

// Nombre max de tentatives de polling avant d'abandonner (≈ 4s * 30 = 2 min).
const MAX_POLL_ATTEMPTS = 30;
const POLL_INTERVAL_MS = 4000;

const VotePayment = () => {
    const { state } = useLocation();
    const { electionUuid, candidateUuid } = useParams();
    const navigate = useNavigate();

    const election = state?.election;
    const candidate = state?.candidate;
    const votePrice = election?.vote_price;

    const [phoneNumber, setPhoneNumber] = useState('');
    const [amount, setAmount] = useState('');
    // step: 'form' | 'creating' | 'polling' | 'success' | 'failed' | 'timeout'
    const [step, setStep] = useState('form');
    const [error, setError] = useState(null);
    const [voteData, setVoteData] = useState(null);
    const [transactionUuid, setTransactionUuid] = useState(null);

    const pollAttemptsRef = useRef(0);
    const pollTimerRef = useRef(null);

    useEffect(() => {
        if (!election || !candidate) {
            toast.error('Session de vote expirée. Veuillez recommencer.');
            navigate(`/elections/${electionUuid}`, { replace: true });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [election, candidate]);

    useEffect(() => {
        if (votePrice && !amount) {
            setAmount(String(votePrice));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [votePrice]);

    // Nettoyage du timer de polling au démontage.
    useEffect(() => {
        return () => {
            if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
        };
    }, []);

    const normalizePhoneForDisplay = (value) => value.replace(/[^\d]/g, '');

    const validatePhone = (value) => {
        const digits = normalizePhoneForDisplay(value);
        // Numéro camerounais : 9 chiffres locaux, ou 12 avec l'indicatif 237.
        return digits.length === 9 || (digits.length === 12 && digits.startsWith('237'));
    };

    // Recalculé à chaque frappe dans le champ montant.
    const { isValid: isAmountValid, quantity: voteQuantity } = useMemo(
        () => computeVoteQuantity(amount, votePrice),
        [amount, votePrice]
    );

    // ── Polling du statut de paiement ───────────────────────────────
    const pollPaymentStatus = async (txUuid) => {
        pollAttemptsRef.current += 1;

        try {
            const res = await paymentsApi.verifyVotePayment(electionUuid, {
                transaction_uuid: txUuid,
            });
            const { status } = res.data?.data ?? {};

            if (status === 'completed') {
                setStep('success');
                toast.success('Paiement confirmé ! Votre vote est validé.');
                navigate(`/vote/payment-success/${electionUuid}/candidate/${candidateUuid}`, {
                    state: {
                        candidate,
                        election,
                        amount: voteData?.total_amount,
                        currency: voteData?.currency,
                        voteQuantity,
                        transactionUuid: txUuid,
                    },
                });
                return;
            }

            if (status === 'failed') {
                setStep('failed');
                setError('Le paiement a échoué ou a été refusé. Vérifiez votre solde et réessayez.');
                return;
            }

            // Toujours en cours (processing/pending) → on continue le polling,
            // sauf si on a atteint le nombre max de tentatives.
            if (pollAttemptsRef.current >= MAX_POLL_ATTEMPTS) {
                setStep('timeout');
                return;
            }

            pollTimerRef.current = setTimeout(() => pollPaymentStatus(txUuid), POLL_INTERVAL_MS);
        } catch (err) {
            // Une erreur réseau ponctuelle ne doit pas interrompre tout le
            // polling — on retente, sauf en fin de quota de tentatives.
            if (pollAttemptsRef.current >= MAX_POLL_ATTEMPTS) {
                setStep('timeout');
                return;
            }
            pollTimerRef.current = setTimeout(() => pollPaymentStatus(txUuid), POLL_INTERVAL_MS);
        }
    };

    // ── Soumission : créer le vote PUIS initier le paiement ─────────
    const handleConfirmPayment = async () => {
        if (!isAmountValid) {
            toast.error(`Le montant doit être un multiple exact de ${votePrice} ${election.currency ?? 'XAF'}.`);
            return;
        }
        if (!phoneNumber.trim()) {
            toast.error('Veuillez saisir votre numéro de téléphone.');
            return;
        }
        if (!validatePhone(phoneNumber)) {
            toast.error('Numéro invalide. Format attendu : 6XXXXXXXX ou 2376XXXXXXXX.');
            return;
        }

        setError(null);
        setStep('creating');

        try {
            // 1. Créer le vote (en attente de paiement — pas encore complété).
            const voteRes = await votesApi.submitPublic(electionUuid, {
                items: [{ candidate_id: candidate.uuid, amount: parseFloat(amount) }],
                idempotency_key: crypto.randomUUID(),
            });
            const vote = voteRes.data?.data;
            setVoteData(vote);

            // 2. Initier le paiement CamPay pour ce vote.
            const payRes = await paymentsApi.initiateVotePayment(electionUuid, {
                vote_uuid: vote.uuid,
                provider: 'campay',
                phone_number: normalizePhoneForDisplay(phoneNumber),
            });
            const txUuid = payRes.data?.data?.transaction_uuid;
            setTransactionUuid(txUuid);

            // 3. Démarrer le polling.
            setStep('polling');
            pollAttemptsRef.current = 0;
            pollPaymentStatus(txUuid);

        } catch (err) {
            const message = err.response?.data?.message ? 'Une erreur est survenue. Veuillez réessayer.': '-';
            setError(message);
            setStep('form');
            toast.error(message);
        }
    };

    // Relance complète (nouveau vote, nouvelle transaction) après un échec.
    const handleRetry = () => {
        setError(null);
        setVoteData(null);
        setTransactionUuid(null);
        pollAttemptsRef.current = 0;
        setStep('form');
    };

    if (!election || !candidate) return null;

    const currency = election.currency ?? 'XAF';

    if (!votePrice || parseFloat(votePrice) <= 0) {
        return (
            <div className="pt-24 text-center px-4">
                <AlertTriangle className="mx-auto text-amber-500 mb-4" size={40} />
                <p className="text-gray-700 mb-4">
                    Le prix du vote n'a pas pu être déterminé pour cette élection.
                </p>
                <button onClick={() => navigate(-1)} className="btn-primary">
                    Retour
                </button>
            </div>
        );
    }

    return (
        <div className="bg-[var(--color-background-white)] pt-18 pb-12 min-h-screen">
            <div className="max-w-xl mx-auto shadow-xl rounded-[var(--radius-md)] bg-[var(--color-white)] p-6">

                {step === 'form' && (
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-gray-700 hover:text-gray-900 font-medium mb-4"
                    >
                        <ArrowLeft size={20} /> Retour
                    </button>
                )}

                {/* Candidat + élection */}
                <div className="flex flex-col text-center justify-center items-center gap-4 mb-8">
                    <img
                        src={candidate.photo || `https://i.pravatar.cc/1200?u=${candidate.full_name}`}
                        alt={candidate.full_name}
                        className="w-32 h-32 rounded-full object-cover border-2 border-white shadow"
                    />
                    <div>
                        <p className="text-sm text-gray-600">{election.title}</p>
                        <h2 className="text-2xl font-bold text-gray-900">{candidate.full_name}</h2>
                        {candidate.candidate_number && (
                            <p className="text-[var(--color-primary)] font-medium">
                                Candidat(e) N°{candidate.candidate_number}
                            </p>
                        )}
                    </div>
                </div>

                {/* ── Étape formulaire ────────────────────────────── */}
                {step === 'form' && (
                    <div className="bg-white rounded-3xl p-2">
                        <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
                            <Smartphone className="text-[var(--color-primary)]" size={24} />
                            Paiement Mobile Money
                        </h3>

                        {/* Prix d'une voix — information, pas modifiable */}
                        <p className="text-sm text-gray-500 mb-4">
                            Prix d'une voix : <strong>{votePrice} {currency}</strong>
                        </p>

                        {/* Montant — l'électeur choisit combien de voix il achète */}
                        <div className="mb-2">
                            <TextInput
                                type="number"
                                label={`Montant à payer (${currency})`}
                                placeholder={String(votePrice)}
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                name="amount"
                                required
                                iconLeft={Banknote}
                                className="w-full text-lg"
                            />
                        </div>

                        {/* Confirmation de paiement */}
                        <div className={`rounded-xl px-4 py-3 mb-6 flex items-center gap-2 text-sm font-medium transition-colors ${isAmountValid
                                ? 'bg-blue-50 text-[var(--color-primary)]'
                                : 'bg-amber-50 text-amber-700'
                            }`}>
                            <VoteIcon size={18} />
                            {isAmountValid ? (
                                <span>
                                    → <strong>{voteQuantity}</strong> voix pour {candidate.full_name.split(' ')[0]}
                                </span>
                            ) : (
                                <span>
                                    Le montant doit être un multiple exact de {votePrice} {currency}
                                    {amount && voteQuantity > 0 && (
                                        <> (le plus proche en dessous : {voteQuantity * parseFloat(votePrice)} {currency} = {voteQuantity} voix)</>
                                    )}
                                </span>
                            )}
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
                                    Votre vote sera validé dès confirmation du paiement.
                                    Paiement sécurisé via CamPay.
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={handleConfirmPayment}
                            disabled={!isAmountValid}
                            className="w-full bg-[var(--color-primary)] hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed py-3 h-12 rounded-[var(--radius-md)] text-white font-semibold text-lg flex items-center justify-center gap-3 transition-all active:scale-[0.98]"
                        >
                            <Banknote size={22} />
                            {isAmountValid
                                ? `Payer ${amount} ${currency} (${voteQuantity} voix)`
                                : 'Confirmer et Payer'}
                        </button>

                        <p className="text-center text-xs text-gray-500 mt-6 flex items-center justify-center gap-1">
                            <Lock size={12} /> Paiement 100% sécurisé et crypté
                        </p>
                    </div>
                )}

                {/* ── Étape création du vote + initiation paiement ──── */}
                {step === 'creating' && (
                    <div className="text-center py-10">
                        <Loader2 size={48} className="animate-spin text-[var(--color-primary)] mx-auto mb-4" />
                        <p className="text-gray-700 font-medium">Initialisation du paiement...</p>
                    </div>
                )}

                {/* ── Étape polling (attente confirmation) ──────────── */}
                {step === 'polling' && (
                    <div className="text-center py-10">
                        <Loader2 size={48} className="animate-spin text-[var(--color-primary)] mx-auto mb-4" />
                        <p className="text-gray-900 font-semibold text-lg">En attente de confirmation</p>
                        <p className="text-gray-600 text-sm mt-2 max-w-sm mx-auto">
                            Une demande a été envoyée au <strong>{phoneNumber}</strong>.
                            Composez votre code PIN Mobile Money pour valider le paiement de{' '}
                            <strong>{voteQuantity} voix</strong>.
                        </p>
                    </div>
                )}

                {/* ── Étape échec ────────────────────────────────────── */}
                {step === 'failed' && (
                    <div className="text-center py-10">
                        <XCircle size={48} className="text-red-500 mx-auto mb-4" />
                        <p className="text-gray-900 font-semibold text-lg">Paiement échoué</p>
                        <p className="text-gray-600 text-sm mt-2 mb-6">{error}</p>
                        <button
                            onClick={handleRetry}
                            className="bg-[var(--color-primary)] text-white font-semibold px-6 py-3 rounded-[var(--radius-md)]"
                        >
                            Réessayer
                        </button>
                    </div>
                )}

                {/* ── Étape timeout (délai dépassé sans réponse) ────── */}
                {step === 'timeout' && (
                    <div className="text-center py-10">
                        <XCircle size={48} className="text-amber-500 mx-auto mb-4" />
                        <p className="text-gray-900 font-semibold text-lg">Ça prend plus de temps que prévu</p>
                        <p className="text-gray-600 text-sm mt-2 mb-6 max-w-sm mx-auto">
                            Vérifiez que vous avez bien confirmé la demande sur votre téléphone.
                            Si le problème persiste, réessayez.
                        </p>
                        <button
                            onClick={handleRetry}
                            className="bg-[var(--color-primary)] text-white font-semibold px-6 py-3 rounded-[var(--radius-md)]"
                        >
                            Réessayer
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default VotePayment;
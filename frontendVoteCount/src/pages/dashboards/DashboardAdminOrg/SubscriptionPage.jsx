// pages/dashboards/DashboardAdminOrg/SubscriptionPage.jsx
import { useState, useEffect } from 'react';
import {
    CheckCircle, Crown, Zap, Building2, Rocket,
    Calendar, Vote, Users, HardDrive, Loader2,
    AlertCircle, RefreshCw, Phone, ChevronRight,
    X, ArrowUp, Lock
} from 'lucide-react';
import toast from 'react-hot-toast';
import { plansApi, paymentsApi, electionsApi, organizationsApi } from '@services/api';

// ── Ordre des plans du moins au plus élevé ────────────────────────
// Utilisé pour déterminer si un plan est inférieur/supérieur au plan courant.
const PLAN_ORDER = ['free', 'basic', 'professional', 'enterprise'];

const planRank = (slug) => {
    const idx = PLAN_ORDER.indexOf(slug);
    return idx === -1 ? 0 : idx;
};

// ── Constantes visuelles ──────────────────────────────────────────

const PROVIDERS = [
    { id: 'orange_money', label: 'Orange Money', color: 'bg-orange-500' },
    { id: 'mtn_money', label: 'MTN MoMo', color: 'bg-yellow-400' },
];

const PLAN_ICONS = {
    free: Rocket,
    basic: Zap,
    professional: Crown,
    enterprise: Building2,
};

const PLAN_BORDER = {
    free: 'border-gray-200',
    basic: 'border-blue-300',
    professional: 'border-[var(--color-primary)]',
    enterprise: 'border-purple-400',
};

const PLAN_BADGE = {
    free: 'bg-gray-100 text-gray-700',
    basic: 'bg-blue-100 text-blue-700',
    professional: 'bg-blue-600 text-white',
    enterprise: 'bg-purple-600 text-white',
};

// ── Helpers ───────────────────────────────────────────────────────

const formatLimit = (val) => (val === -1 ? 'Illimité' : String(val));

const formatPrice = (price, currency) =>
    price === 0
        ? 'Gratuit'
        : `${Number(price).toLocaleString('fr-FR')} ${currency} / mois`;

const formatDate = (iso) =>
    iso
        ? new Date(iso).toLocaleDateString('fr-FR', {
            day: '2-digit', month: 'long', year: 'numeric',
        })
        : '—';

// ── Modal paiement ────────────────────────────────────────────────

function PaymentModal({ plan, orgUuid, onClose, onSuccess }) {
    const [provider, setProvider] = useState('orange_money');
    const [phone, setPhone] = useState('');
    const [loading, setLoading] = useState(false);

    const handlePay = async () => {
        if (!phone.trim()) {
            toast.error('Entrez votre numéro de téléphone');
            return;
        }
        setLoading(true);
        try {
            const res = await paymentsApi.initiateSubscription({
                plan_uuid: plan.uuid,
                provider,
                phone_number: phone.trim(),
                organization_uuid: orgUuid,
            });
            const data = res.data?.data ?? res.data;
            toast.success('Paiement initié. Validez sur votre téléphone.');
            onSuccess(data);
        } catch (err) {
            toast.error(err.response?.data?.message ?? 'Erreur lors du paiement');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-[var(--radius-lg)] shadow-xl w-full max-w-md">

                <div className="flex items-center justify-between p-6 border-b border-[var(--color-gray-light)]">
                    <div>
                        <h2 className="text-lg font-semibold text-[var(--color-dark)]">
                            Souscrire — {plan.name}
                        </h2>
                        <p className="text-sm text-[var(--color-gray)] mt-0.5">
                            {formatPrice(plan.price, plan.currency)}
                        </p>
                    </div>
                    <button onClick={onClose} className="text-[var(--color-gray)] hover:text-[var(--color-dark)]">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Provider */}
                    <div>
                        <p className="text-sm font-medium text-[var(--color-dark)] mb-3">
                            Méthode de paiement
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                            {PROVIDERS.map(p => (
                                <button
                                    key={p.id}
                                    onClick={() => setProvider(p.id)}
                                    className={`flex items-center gap-3 p-4 border-2 rounded-[var(--radius-md)] transition-all text-left
                                        ${provider === p.id
                                            ? 'border-[var(--color-primary)] bg-blue-50'
                                            : 'border-[var(--color-gray-light)] hover:border-gray-300'}`}
                                >
                                    <span className={`w-3 h-3 rounded-full shrink-0 ${p.color}`} />
                                    <span className="text-sm font-medium">{p.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Téléphone */}
                    <div>
                        <label className="block text-sm font-medium text-[var(--color-dark)] mb-2">
                            Numéro de téléphone
                        </label>
                        <div className="flex items-center border border-[var(--color-gray-light)] rounded-[var(--radius-md)] overflow-hidden focus-within:border-[var(--color-primary)]">
                            <div className="px-3 py-3 bg-gray-50 border-r border-[var(--color-gray-light)]">
                                <Phone size={16} className="text-[var(--color-gray)]" />
                            </div>
                            <input
                                type="tel"
                                value={phone}
                                onChange={e => setPhone(e.target.value)}
                                placeholder="+237 6XX XXX XXX"
                                className="flex-1 px-4 py-3 outline-none text-sm"
                            />
                        </div>
                        <p className="text-xs text-[var(--color-gray)] mt-1">
                            Vous recevrez une demande de confirmation sur ce numéro.
                        </p>
                    </div>

                    {/* Récap */}
                    <div className="bg-gray-50 rounded-[var(--radius-md)] p-4 space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-[var(--color-gray)]">Plan</span>
                            <span className="font-medium">{plan.name}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-[var(--color-gray)]">Durée</span>
                            <span className="font-medium">{plan.duration_days} jours</span>
                        </div>
                        <div className="flex justify-between border-t border-[var(--color-gray-light)] pt-2">
                            <span className="font-semibold">Total</span>
                            <span className="font-bold text-[var(--color-primary)]">
                                {formatPrice(plan.price, plan.currency)}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex gap-3 p-6 border-t border-[var(--color-gray-light)]">
                    <button onClick={onClose} className="flex-1 btn-secondary">Annuler</button>
                    <button
                        onClick={handlePay}
                        disabled={loading}
                        className="flex-1 btn-primary flex items-center justify-center gap-2 disabled:opacity-60"
                    >
                        {loading
                            ? <><Loader2 size={16} className="animate-spin" /> Traitement...</>
                            : <>Payer <ChevronRight size={16} /></>}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Modal vérification paiement ───────────────────────────────────

function VerifyModal({ transactionUuid, onClose, onSuccess }) {
    const [loading, setLoading] = useState(false);

    const handleVerify = async () => {
        setLoading(true);
        try {
            const res = await paymentsApi.verifySubscription({ transaction_uuid: transactionUuid });
            const data = res.data?.data ?? res.data;
            if (data?.verified) {
                toast.success('Abonnement activé avec succès !');
                onSuccess();
            } else {
                toast.error('Paiement non encore confirmé. Réessayez dans quelques secondes.');
            }
        } catch (err) {
            toast.error(err.response?.data?.message ?? 'Erreur lors de la vérification');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-[var(--radius-lg)] shadow-xl w-full max-w-sm p-6 text-center space-y-5">
                <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                    <Phone size={28} className="text-[var(--color-primary)]" />
                </div>
                <div>
                    <h2 className="text-lg font-semibold">Confirmez le paiement</h2>
                    <p className="text-sm text-[var(--color-gray)] mt-2">
                        Acceptez la demande sur votre téléphone, puis cliquez sur Vérifier.
                    </p>
                </div>
                <div className="flex gap-3">
                    <button onClick={onClose} className="flex-1 btn-secondary">Annuler</button>
                    <button
                        onClick={handleVerify}
                        disabled={loading}
                        className="flex-1 btn-primary flex items-center justify-center gap-2 disabled:opacity-60"
                    >
                        {loading
                            ? <><Loader2 size={16} className="animate-spin" /> Vérification...</>
                            : <><RefreshCw size={16} /> Vérifier</>}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Page principale ───────────────────────────────────────────────

export default function SubscriptionPage() {
    const [plans, setPlans] = useState([]);
    const [currentSub, setCurrentSub] = useState(null);  // null = pas d'abonnement actif
    const [organization, setOrganization] = useState(null);
    const [activeCount, setActiveCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [transactionUuid, setTransactionUuid] = useState(null);

    // ── Chargement ───────────────────────────────────────────────

    const loadAll = async () => {
        setLoading(true);
        try {
            const [plansRes, subRes, orgRes] = await Promise.all([
                plansApi.getActivePlans(),
                paymentsApi.getSubscriptionStatus(),
                organizationsApi.getMyOrganizations(),
            ]);

            setPlans(plansRes.data?.data ?? plansRes.data ?? []);

            const subData = subRes.data?.data ?? subRes.data;
            console.log("subscriptions", subData);
            // On ne considère l'abonnement que s'il est actif (has_subscription = true)
            setCurrentSub(subData?.has_subscription ? subData.subscription : null);

            const orgs = orgRes.data?.data ?? orgRes.data ?? [];
            console.log("orgs", orgs);
            const org = Array.isArray(orgs) ? orgs[0] : orgs;
            setOrganization(org);

            if (org) {
                const elRes = await electionsApi.getAll({ organization_id: org.id });
                const elections = elRes.data?.data ?? elRes.data ?? [];

                console.log("elections", elections);
                setActiveCount(
                    Array.isArray(elections)
                        ? elections.filter(e => !['cancelled', 'archived'].includes(e.status)).length
                        : 0
                );
            }
        } catch {
            toast.error('Erreur lors du chargement des données');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadAll(); }, []);

    // ── Handlers ─────────────────────────────────────────────────

    const handlePaymentInitiated = (data) => {
        setSelectedPlan(null);
        setTransactionUuid(data?.transaction_uuid ?? data?.uuid ?? null);
    };

    const handleVerifySuccess = () => {
        setTransactionUuid(null);
        loadAll();
    };

    // ── Dérivés ──────────────────────────────────────────────────

    const currentPlanSlug = currentSub?.plan?.slug ?? null;
    const currentRank = planRank(currentPlanSlug);
    const daysRemaining = currentSub?.days_remaining ?? 0;
    const maxElections = currentSub?.plan?.max_elections ?? 1;
    const hasActiveSub = currentSub !== null;
    const isFreePlan = currentPlanSlug === 'free';

    /**
     * Logique bouton par plan :
     *
     *   Pas d'abonnement actif
     *     → free    : "Activer gratuitement"  (gratuit, sans modal paiement)
     *     → payants : "Choisir ce plan"        (ouvre modal paiement)
     *
     *   Plan gratuit actif
     *     → free    : désactivé "Plan actuel"
     *     → payants : "Passer à ce plan"       (ouvre modal paiement)
     *
     *   Plan payant actif
     *     → plan courant    : désactivé "Plan actuel"
     *     → plan inférieur  : désactivé "Plan inférieur"  (ne peut pas downgrader ici)
     *     → plan supérieur  : "Passer à ce plan"          (ouvre modal paiement)
     *
     *   Plan expiré (handled: currentSub = null, même cas que "pas d'abonnement")
     */
    const getButtonState = (plan) => {
        const isCurrent = plan.slug === currentPlanSlug;
        const rank = planRank(plan.slug);
        const isFree = plan.slug === 'free';

        // Plan courant → toujours désactivé
        if (isCurrent) {
            return { disabled: true, label: 'Plan actuel', variant: 'neutral' };
        }

        // Pas d'abonnement actif
        if (!hasActiveSub) {
            if (isFree) {
                return { disabled: false, label: 'Activer gratuitement', variant: 'free' };
            }
            return { disabled: false, label: 'Choisir ce plan', variant: 'primary' };
        }

        // Plan gratuit actif → peut monter vers payant
        if (isFreePlan) {
            return { disabled: false, label: 'Passer à ce plan', variant: 'primary' };
        }

        // Plan payant actif
        if (rank < currentRank) {
            // Plan inférieur → désactivé
            return { disabled: true, label: 'Plan inférieur', variant: 'neutral' };
        }
        // Plan supérieur → upgrade possible
        return { disabled: false, label: 'Passer à ce plan', variant: 'upgrade' };
    };

    /**
     * Clic sur un bouton de plan.
     * Si c'est le plan gratuit sans abonnement actif :
     *   → On souscrit directement sans paiement via initiateSubscription
     *     (le backend crée la subscription active immédiatement pour price=0).
     * Sinon → ouvre la modal de paiement.
     */
    const handlePlanClick = async (plan) => {
        if (plan.slug === 'free' && !hasActiveSub) {
            // Souscription gratuite directe — pas besoin de modal paiement
            try {
                await paymentsApi.initiateSubscription({
                    plan_uuid: plan.uuid,
                    provider: 'free',
                    organization_uuid: organization?.uuid,
                });
                toast.success('Plan gratuit activé !');
                loadAll();
            } catch (err) {
                toast.error(err.response?.data?.message ?? 'Erreur lors de l\'activation');
            }
            return;
        }
        setSelectedPlan(plan);
    };

    // ── Chargement ───────────────────────────────────────────────

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center space-y-3">
                    <Loader2 size={36} className="animate-spin text-[var(--color-primary)] mx-auto" />
                    <p className="text-sm text-[var(--color-gray)]">Chargement des abonnements...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto space-y-10 pb-16">

            {/* En-tête */}
            <div>
                <h1 className="text-2xl font-semibold text-[var(--color-dark)]">Abonnements</h1>
                <p className="text-[var(--color-gray)] mt-1">
                    Gérez votre plan et suivez votre consommation.
                </p>
            </div>

            {/* ── Abonnement courant ── */}
            <div className="bg-white rounded-[var(--radius-md)] shadow-sm p-6">
                <h2 className="text-base font-semibold text-[var(--color-dark)] mb-5">
                    Abonnement actuel
                </h2>

                {hasActiveSub ? (
                    <div className="space-y-5">
                        {/* Badge plan + statut */}
                        <div className="flex items-center gap-3 flex-wrap">
                            {(() => {
                                const Icon = PLAN_ICONS[currentPlanSlug] ?? Rocket;
                                return (
                                    <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold ${PLAN_BADGE[currentPlanSlug] ?? 'bg-gray-100 text-gray-700'}`}>
                                        <Icon size={14} />
                                        {currentSub.plan?.name}
                                    </span>
                                );
                            })()}
                            <span className="inline-flex items-center gap-1.5 text-xs text-green-700 bg-green-100 px-3 py-1 rounded-full font-medium">
                                <CheckCircle size={12} /> Actif
                            </span>
                            {isFreePlan && (
                                <span className="text-xs text-[var(--color-gray)] bg-gray-100 px-3 py-1 rounded-full">
                                    Passez à un plan supérieur pour débloquer plus d'élections
                                </span>
                            )}
                        </div>

                        {/* Métriques */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="bg-gray-50 rounded-[var(--radius-md)] p-4">
                                <div className="flex items-center gap-2 text-[var(--color-gray)] mb-1">
                                    <Calendar size={14} />
                                    <span className="text-xs font-medium uppercase tracking-wide">Expiration</span>
                                </div>
                                <p className="font-semibold text-[var(--color-dark)]">
                                    {formatDate(currentSub.end_at)}
                                </p>
                                <p className={`text-xs mt-1 ${daysRemaining <= 5 ? 'text-red-500' : 'text-[var(--color-gray)]'}`}>
                                    {daysRemaining <= 5 && daysRemaining > 0 ? '⚠ ' : ''}
                                    {daysRemaining} jour(s) restant(s)
                                </p>
                            </div>

                            <div className="bg-gray-50 rounded-[var(--radius-md)] p-4">
                                <div className="flex items-center gap-2 text-[var(--color-gray)] mb-1">
                                    <Vote size={14} />
                                    <span className="text-xs font-medium uppercase tracking-wide">Élections</span>
                                </div>
                                <p className="font-semibold text-[var(--color-dark)]">
                                    {activeCount} / {formatLimit(maxElections)}
                                </p>
                                {maxElections !== -1 && (
                                    <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all ${activeCount >= maxElections ? 'bg-red-500' : 'bg-[var(--color-primary)]'}`}
                                            style={{ width: `${Math.min((activeCount / maxElections) * 100, 100)}%` }}
                                        />
                                    </div>
                                )}
                                {activeCount >= maxElections && maxElections !== -1 && (
                                    <p className="text-xs text-red-500 mt-1 font-medium">Quota atteint — upgrade requis</p>
                                )}
                            </div>

                            <div className="bg-gray-50 rounded-[var(--radius-md)] p-4">
                                <div className="flex items-center gap-2 text-[var(--color-gray)] mb-1">
                                    <Users size={14} />
                                    <span className="text-xs font-medium uppercase tracking-wide">Votes max</span>
                                </div>
                                <p className="font-semibold text-[var(--color-dark)]">
                                    {formatLimit(currentSub.plan?.max_votes)}
                                </p>
                            </div>
                        </div>

                        {/* Alerte expiration */}
                        {daysRemaining <= 5 && daysRemaining > 0 && (
                            <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-[var(--radius-md)]">
                                <AlertCircle size={18} className="text-amber-600 shrink-0 mt-0.5" />
                                <p className="text-sm text-amber-800">
                                    Votre abonnement expire dans <strong>{daysRemaining} jour(s)</strong>.
                                    Renouvelez-le pour ne pas interrompre vos élections en cours.
                                </p>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-[var(--radius-md)]">
                        <AlertCircle size={18} className="text-blue-600 shrink-0 mt-0.5" />
                        <p className="text-sm text-blue-800">
                            Aucun abonnement actif. Choisissez un plan ci-dessous pour commencer.
                        </p>
                    </div>
                )}
            </div>

            {/* ── Plans disponibles ── */}
            <div>
                <h2 className="text-base font-semibold text-[var(--color-dark)] mb-1">
                    Plans disponibles
                </h2>
                <p className="text-sm text-[var(--color-gray)] mb-6">
                    {!hasActiveSub && 'Commencez gratuitement ou choisissez un plan adapté à vos besoins.'}
                    {isFreePlan && 'Vous êtes sur le plan gratuit. Passez à un plan supérieur pour plus d\'élections.'}
                    {hasActiveSub && !isFreePlan && 'Vous pouvez passer à un plan supérieur à tout moment.'}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    {plans.map(plan => {
                        const Icon = PLAN_ICONS[plan.slug] ?? Rocket;
                        const isCurrent = plan.slug === currentPlanSlug;
                        const isPopular = plan.slug === 'professional';
                        const btn = getButtonState(plan);

                        return (
                            <div
                                key={plan.uuid}
                                className={`relative bg-white border-2 ${PLAN_BORDER[plan.slug] ?? 'border-gray-200'}
                                    rounded-[var(--radius-md)] p-5 flex flex-col gap-4
                                    ${isCurrent ? 'ring-2 ring-[var(--color-primary)] ring-offset-2' : ''}
                                    ${btn.disabled && !isCurrent ? 'opacity-60' : ''}`}
                            >
                                {/* Badges positionnés */}
                                {isCurrent && (
                                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-600 text-white text-xs font-semibold px-3 py-0.5 rounded-full whitespace-nowrap">
                                        Plan actuel
                                    </span>
                                )}
                                {isPopular && !isCurrent && (
                                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[var(--color-primary)] text-white text-xs font-semibold px-3 py-0.5 rounded-full whitespace-nowrap">
                                        Populaire
                                    </span>
                                )}

                                {/* Icône + Nom */}
                                <div className="flex items-center gap-2">
                                    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${PLAN_BADGE[plan.slug] ?? 'bg-gray-100 text-gray-700'}`}>
                                        <Icon size={16} />
                                    </span>
                                    <span className="font-semibold text-[var(--color-dark)]">{plan.name}</span>
                                </div>

                                {/* Prix */}
                                <div>
                                    <p className="text-xl font-bold text-[var(--color-dark)]">
                                        {plan.price === 0 ? 'Gratuit' : `${Number(plan.price).toLocaleString('fr-FR')} XAF`}
                                    </p>
                                    {plan.price > 0 && (
                                        <p className="text-xs text-[var(--color-gray)]">par mois</p>
                                    )}
                                </div>

                                {/* Limites */}
                                <ul className="space-y-2 flex-1">
                                    <li className="flex items-center gap-2 text-sm text-[var(--color-gray)]">
                                        <Vote size={14} className="shrink-0 text-[var(--color-primary)]" />
                                        {formatLimit(plan.max_elections)} élection(s)
                                    </li>
                                    <li className="flex items-center gap-2 text-sm text-[var(--color-gray)]">
                                        <Users size={14} className="shrink-0 text-[var(--color-primary)]" />
                                        {formatLimit(plan.max_votes)} votes max
                                    </li>
                                    <li className="flex items-center gap-2 text-sm text-[var(--color-gray)]">
                                        <HardDrive size={14} className="shrink-0 text-[var(--color-primary)]" />
                                        {plan.max_storage_gb} Go de stockage
                                    </li>
                                    {Array.isArray(plan.features) && plan.features.slice(0, 2).map((f, i) => (
                                        <li key={i} className="flex items-start gap-2 text-sm text-[var(--color-gray)]">
                                            <CheckCircle size={14} className="shrink-0 text-green-500 mt-0.5" />
                                            {f}
                                        </li>
                                    ))}
                                </ul>

                                {/* Bouton */}
                                {btn.disabled ? (
                                    <button
                                        disabled
                                        className="w-full py-2.5 rounded-[var(--radius-md)] text-sm font-medium bg-gray-100 text-[var(--color-gray)] cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {btn.variant === 'neutral' && !isCurrent && <Lock size={14} />}
                                        {btn.label}
                                    </button>
                                ) : btn.variant === 'free' ? (
                                    <button
                                        onClick={() => handlePlanClick(plan)}
                                        className="w-full py-2.5 rounded-[var(--radius-md)] text-sm font-medium border-2 border-[var(--color-primary)] text-[var(--color-primary)] hover:bg-blue-50 transition-colors"
                                    >
                                        {btn.label}
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => handlePlanClick(plan)}
                                        className="w-full btn-primary text-sm py-2.5 flex items-center justify-center gap-2"
                                    >
                                        {btn.variant === 'upgrade' && <ArrowUp size={14} />}
                                        {btn.label}
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Modals */}
            {selectedPlan && (
                <PaymentModal
                    plan={selectedPlan}
                    orgUuid={organization?.uuid}
                    onClose={() => setSelectedPlan(null)}
                    onSuccess={handlePaymentInitiated}
                />
            )}
            {transactionUuid && (
                <VerifyModal
                    transactionUuid={transactionUuid}
                    onClose={() => setTransactionUuid(null)}
                    onSuccess={handleVerifySuccess}
                />
            )}
        </div>
    );
}
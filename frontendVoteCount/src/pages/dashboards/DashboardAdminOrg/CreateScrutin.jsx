// pages/dashboards/DashboardAdminOrg/CreateScrutin.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Step1Generales from '@components/dashboard/Step1Generales';
import StepJuryCriteria from '@components/dashboard/StepJuryCriteria';
import Step2Candidats from '@components/dashboard/Step2Candidats';
import Step3Votants from '@components/dashboard/Step3Votants';
import Step4Recapitulatif from '@components/dashboard/Step4Recapitulatif';
import ScrutinBreadcrumb from '@components/dashboard/ScrutinBreadcrumb';
import toast from 'react-hot-toast';
import { electionsApi, candidatesApi, paymentsApi } from '@services/api';
import { useAuth } from '@hooks/useAuth';
import { FadeLoader } from "react-spinners";
import { useOrg } from "@hooks/useOrg";
import { FileExclamationPoint } from 'lucide-react';
// ── Composant principal ───────────────────────────────────────────
/**
 * Step1Generales produit directement les noms de champs backend
 * (election_mode, vote_type, payment_type, start_at, end_at, vote_price...).
 * Aucun mapping n'est donc nécessaire ici — le payload reprend formData.general
 * tel quel, en ajoutant uniquement organization_id.
 */
const CreateScrutin = () => {
    const { org: organization, orgLoading, orgError } = useOrg();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [currentStep, setCurrentStep] = useState(1);
    const [submitting, setSubmitting] = useState(false);
    const [submitLabel, setSubmitLabel] = useState('Création en cours...');

    // Quota d'élections — null = pas encore chargé
    const [quotaExceeded, setQuotaExceeded] = useState(false);
    const [currentPlan, setCurrentPlan] = useState(null);

    /**
     * UUID du brouillon — créé dès la validation de Step1.
     * Si l'utilisateur revient sur Step1 et resoumet, on PATCH ce même
     * draft au lieu d'en créer un nouveau (évite les doublons en base).
     * Persisté en sessionStorage pour survivre à un rechargement de page.
     */
    const [draftUuid, setDraftUuid] = useState(() => {
        return sessionStorage.getItem('wizard_draft_uuid') ?? null;
    });

    // Synchronise sessionStorage à chaque changement de draftUuid
    useEffect(() => {
        if (draftUuid) {
            sessionStorage.setItem('wizard_draft_uuid', draftUuid);
        } else {
            sessionStorage.removeItem('wizard_draft_uuid');
        }
    }, [draftUuid]);

    const [formData, setFormData] = useState({
        general: {},
        candidats: [],
        votants: {
            importMethod: 'grouped',
            authMethods: { emailOtp: true, smsOtp: false },
            manualVotants: [],
            parsedVotants: [],
            previewCount: 0,
            totalVotants: 0,
        },
    });

    // ── Quota d'élections du plan courant ─────────────────────────

    useEffect(() => {
        if (!organization) return;

        const checkQuota = async () => {
            try {
                const subRes = await paymentsApi.getSubscriptionStatus();
                const sub = subRes.data?.data ?? subRes.data;

                if (sub?.has_subscription && sub?.subscription?.plan) {
                    const plan = sub.subscription.plan;
                    const maxElections = plan.max_elections;
                    setCurrentPlan(plan);

                    const electionsRes = await electionsApi.getAll({ organization_id: organization.uuid });
                    const elections = electionsRes.data?.data ?? electionsRes.data ?? [];
                    const activeCount = Array.isArray(elections)
                        ? elections.filter(e => !['cancelled', 'archived'].includes(e.status)).length
                        : 0;

                    if (maxElections !== -1 && activeCount >= maxElections) {
                        setQuotaExceeded(true);
                    }
                }
            } catch {
                // Quota non bloquant si l'API échoue — le backend rejettera de toute façon
            }
        };

        checkQuota();
    }, [organization]);

    // ── Dérivé : election_mode courant (depuis le draft, plus fiable que formData) ──

    const currentElectionMode = formData.general?.election_mode ?? 'public';

    // ── Séquence d'étapes dynamique : une étape "Critères de jury" est
    // insérée entre Général et Candidats uniquement pour vote_type='weighted'
    // (jury_criteria n'a de sens que pour ce type d'élection). ──
    const isWeighted = formData.general?.vote_type === 'weighted';
    const WIZARD_STEPS = isWeighted
        ? [
            { id: 1, title: 'Informations Générales' },
            { id: 2, title: 'Critères de Jury' },
            { id: 3, title: 'Gestion des Candidats' },
            { id: 4, title: 'Paramètres des Votants' },
            { id: 5, title: 'Récapitulatif & Publication' },
        ]
        : [
            { id: 1, title: 'Informations Générales' },
            { id: 2, title: 'Gestion des Candidats' },
            { id: 3, title: 'Paramètres des Votants' },
            { id: 4, title: 'Récapitulatif & Publication' },
        ];
    const CANDIDATS_STEP = isWeighted ? 3 : 2;
    const VOTANTS_STEP = isWeighted ? 4 : 3;
    const RECAP_STEP = isWeighted ? 5 : 4;

    // ── Navigation entre étapes 2→3, 3→4 ──────────────────────────

    const handleNext = (stepKey, stepData = {}) => {
        setFormData(prev => ({ ...prev, [stepKey]: stepData }));
        setCurrentStep(prev => prev + 1);
    };

    const handlePrevious = () => setCurrentStep(prev => prev - 1);

    const handleStepClick = (step) => {
        // On ne permet de sauter en avant que si un draft existe déjà
        // (sinon Step2/3/4 n'ont rien à afficher/charger)
        if (step === 1 || (draftUuid && step <= currentStep)) {
            setCurrentStep(step);
        }
    };

    /**
     * Conditions de publication :
     *   1. Minimum 2 candidats
     *   2. Si has_categories = true, TOUS les candidats approuvés doivent
     *      avoir une catégorie assignée (sinon le calcul des résultats
     *      par catégorie serait ambigu — voir ElectionService::publish()).
     */


    const acceptsCandidates = formData.general?.accepts_candidates ?? false;
    const hasMinCandidates = (formData.candidats ?? []).length >= 2;
    const hasCategoriesEnabled = formData.general?.has_categories ?? false;
    const uncategorizedCandidates = hasCategoriesEnabled
        ? (formData.candidats ?? []).filter(c => !c.category_id)
        : [];
    const allCandidatsCategorized = uncategorizedCandidates.length === 0;

    const isPublish = acceptsCandidates
        ? true
        : (hasMinCandidates && allCandidatsCategorized);


    useEffect(() => {
        const checkDraftStatus = async () => {
            if (!draftUuid) return;

            try {
                const res = await electionsApi.get(draftUuid);
                const election = res.data?.data;

                // ✅ Si l'élection n'est plus en draft, réinitialiser
                if (election && election.status !== 'draft') {
                    console.warn('⚠️ Le brouillon n\'est plus en draft, réinitialisation...');
                    setDraftUuid(null);
                    toast.info('Le brouillon a été réinitialisé.');
                }
            } catch (error) {
                // Si l'élection n'existe pas, réinitialiser
                if (error.response?.status === 404) {
                    setDraftUuid(null);
                }
            }
        };

        checkDraftStatus();
    }, [draftUuid]);
    // ── Step1 → crée OU met à jour le brouillon ───────────────────
    /**
     * Premier passage  : POST /elections/draft  → crée le draft, stocke l'UUID.
     * Passages suivants (retour Step1 puis renvoi) : PATCH /elections/{uuid}/draft.
     * Dans les deux cas, Step2 reçoit ensuite un draftUuid valide pour
     * pouvoir charger/créer ses catégories et candidats.
     */
    const handleStep1Next = async (generalData) => {
        if (!organization) {
            toast.error('Organisation introuvable.');
            return;
        }
        setSubmitting(true);
        setSubmitLabel(draftUuid ? 'Mise à jour du brouillon...' : 'Création du brouillon...');

        try {
            const payload = new FormData();
            payload.append('organization_id', organization.uuid);

            Object.entries(generalData).forEach(([key, value]) => {
                if (value === null || value === undefined) return;

                if (key === 'banner') {
                    if (value instanceof File) {
                        payload.append('banner', value);
                    }
                    return;
                }

                if (typeof value === 'boolean') {
                    payload.append(key, value ? '1' : '0');
                    return;
                }

                payload.append(key, value);
            });

            if (!draftUuid) {
                const res = await electionsApi.storeDraft(payload);
                const election = res.data?.data ?? res.data;
                const uuid = election?.uuid;
                if (!uuid) throw new Error("UUID du brouillon non reçu.");
                setDraftUuid(uuid);
                toast.success('Brouillon créé.');
            } else {
                await electionsApi.updateDraft(draftUuid, payload);
                toast.success('Brouillon mis à jour.');
            }

            setFormData(prev => ({ ...prev, general: generalData }));
            setCurrentStep(2);

        } catch (err) {
            const message = err.response?.data?.message ?? err.message ?? 'Erreur inconnue';
            toast.error(`Échec : ${message}`);
            console.error('[CreateScrutin] Erreur Step1 :', err);

            const status = err.response?.status;
            const isStaleUuid = status === 422 &&
                message.toLowerCase().includes('brouillon');

            if (err.response?.status === 422) {
                const errors = err.response.data.errors;
                console.error('🔴 Erreurs de validation:', errors);

                // Afficher chaque erreur
                Object.keys(errors).forEach(key => {
                    toast.error(`${key}: ${errors[key][0]}`);
                });
            }

            console.error('[CreateScrutin] Erreur Step1 :', err);
            if (isStaleUuid) {
                setDraftUuid(null);
                toast.error('Nouveau brouillon sera créé au prochain essai.', { icon: FileExclamationPoint });
            }
        } finally {
            setSubmitting(false);
            setSubmitLabel('Création en cours...');
        }
    };

    // ── Step Critères de jury (vote_type='weighted' uniquement) → Candidats
    const handleCriteriaNext = () => setCurrentStep(prev => prev + 1);

    /// ── Step2 → les candidats sont déjà créés en base à ce stade

    const handleStep2Next = (data) => {
        setFormData(prev => ({ ...prev, candidats: data.candidats }));
        setCurrentStep(prev => prev + 1);
    };


    // ── Soumission finale (Step4) ─────────────────────────────────
    /**
     * À ce stade, le draft existe déjà en base (créé/mis à jour dès Step1),
     * les candidats sont déjà créés depuis Step2Candidats, et les électeurs
     * sont déjà créés depuis Step3Votants (import fichier ou saisie manuelle,
     * au fil de l'eau). Step4 ne sert qu'au récapitulatif et à la décision
     * finale : publier ou laisser en brouillon — aucune création de contenu
     * ici (les réimporter/recréer produirait des doublons).
     */
    const submitElection = async (publish = false) => {
        if (!draftUuid) {
            toast.error('Brouillon introuvable. Recommencez depuis l\'étape 1.');
            setCurrentStep(1);
            return;
        }

        setSubmitting(true);

        try {
            // ── Publier si demandé ──────────────────────────────
            if (publish) {
                setSubmitLabel('Publication de l\'élection...');
                await electionsApi.publish(draftUuid);
                toast.success('Scrutin publié avec succès !', { duration: 4000 });
                setDraftUuid(null);
            } else {
                toast.success('Brouillon enregistré avec succès.', { duration: 4000 });
                setDraftUuid(null);
            }

            navigate(`/org/${organization.uuid}/scrutins`);

        } catch (err) {
            const status = err.response?.status;
            const message = err.response?.data?.message ?? err.message ?? 'Erreur inconnue';
            if (status === 403 && message.toLowerCase().includes('abonnement')) {
                toast.error('Un abonnement est requis pour publier une élection.', { duration: 4000 });
                navigate(`/org/${organization.uuid}/settings/subscription`);
                return;
            }

            toast.error(`Échec : ${message}`);
            console.error('[CreateScrutin] Erreur soumission :', err);
        } finally {
            setSubmitting(false);
            setSubmitLabel('Création en cours...');
        }
    };

    const handlePublish = () => submitElection(true);
    const handleSaveDraft = () => submitElection(false);

    // ── États de chargement et d'erreur ───────────────────────────

    if (orgLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--color-background-white)]">
                <div className="text-center space-y-3">
                    <FadeLoader size={36} color="var(--color-primary)" className="mx-auto" />
                    <p className="text-sm text-[var(--color-gray)]">Chargement de votre organisation...</p>
                </div>
            </div>
        );
    }

    if (orgError || !organization) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--color-background-white)] p-6">
                <div className="max-w-md text-center space-y-4">
                    <h2 className="text-xl font-semibold text-[var(--color-dark)]">Impossible de créer un scrutin</h2>
                    <p className="text-[var(--color-gray)]">{orgError}</p>
                    <button onClick={() => navigate(`/org/${organization?.uuid}/scrutins`)} className="btn-secondary mx-auto">
                        Retour aux scrutins
                    </button>
                </div>
            </div>
        );
    }

    if (quotaExceeded) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--color-background-white)] p-6">
                <div className="max-w-md text-center space-y-5">
                    <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto">
                        <span className="text-3xl">🔒</span>
                    </div>
                    <h2 className="text-xl font-semibold text-[var(--color-dark)]">
                        Limite du plan atteinte
                    </h2>
                    <p className="text-[var(--color-gray)]">
                        Votre plan <strong>{currentPlan?.name ?? 'actuel'}</strong> est limité
                        à <strong>{currentPlan?.max_elections} élection(s)</strong>.
                        Vous avez atteint cette limite.
                    </p>
                    <p className="text-sm text-[var(--color-gray)]">
                        Passez à un abonnement supérieur pour créer davantage d'élections.
                    </p>
                    <div className="flex flex-col gap-3 pt-2">
                        <button
                            onClick={() => navigate(`/org/${organization?.uuid}/settings/subscription`)}
                            className="btn-primary mx-auto"
                        >
                            Voir les plans d'abonnement
                        </button>
                        <button
                            onClick={() => navigate(`/org/${organization?.uuid}/scrutins`)}
                            className="btn-secondary mx-auto"
                        >
                            Retour aux scrutins
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--color-background-white)] p-2">
            <div className="max-w-5xl mx-auto px-4 lg:px-6">

                {/* Fil d'Ariane */}
                <ScrutinBreadcrumb currentStep={currentStep} onStepClick={handleStepClick} steps={WIZARD_STEPS} />

                {/* Overlay de soumission */}
                {submitting && (
                    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
                        <div className="bg-white rounded-[var(--radius-lg)] p-8 flex flex-col items-center gap-4 shadow-xl min-w-[260px]">
                            <FadeLoader size={36} color="var(--color-primary)" className='mx-auto' />
                            <p className="text-sm text-[var(--color-gray)] text-center">{submitLabel}</p>
                        </div>
                    </div>
                )}

                {/* ── Step 1 : Informations générales ── */}
                {currentStep === 1 && (
                    <Step1Generales
                        onNext={handleStep1Next}
                        initialData={formData.general}
                    />
                )}

                {/* ── Step Critères de jury (vote_type='weighted' uniquement) — draftUuid garanti non-null ici ── */}
                {isWeighted && currentStep === 2 && (
                    <StepJuryCriteria
                        electionUuid={draftUuid}
                        onNext={handleCriteriaNext}
                        onPrevious={handlePrevious}
                    />
                )}

                {/* ── Step Candidats — draftUuid garanti non-null ici ── */}
                {currentStep === CANDIDATS_STEP && (
                    <Step2Candidats
                        onNext={handleStep2Next}
                        onPrevious={handlePrevious}
                        initialData={formData.candidats}
                        electionUuid={draftUuid}
                        hasCategories={formData.general?.has_categories ?? false}
                        AcceptCandidature={formData.general?.accepts_candidates ?? false}
                    />
                )}

                {/* ── Step Votants (conditionnel selon le type d'élection) ── */}
                {currentStep === VOTANTS_STEP && (
                    <Step3Votants
                        onNext={(data) => handleNext('votants', data)}
                        onPrevious={handlePrevious}
                        initialData={formData.votants}
                        electionMode={currentElectionMode}
                        verificationMode={formData.general?.verification_mode ?? 'none'}
                        electionUuid={draftUuid}
                    />
                )}

                {/* ── Step Récapitulatif & Publication ── */}
                {currentStep === RECAP_STEP && (
                    <Step4Recapitulatif
                        data={formData}
                        isPublish={isPublish}
                        hasMinCandidates={hasMinCandidates}
                        uncategorizedCandidates={uncategorizedCandidates}
                        onPrevious={handlePrevious}
                        onPublish={handlePublish}
                        onSaveDraft={handleSaveDraft}
                    />
                )}

            </div>
        </div>
    );
};

export default CreateScrutin;
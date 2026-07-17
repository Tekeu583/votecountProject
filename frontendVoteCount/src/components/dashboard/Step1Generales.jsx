// src/components/dashboard/Step1Generales.jsx
// Version Finale Harmonisée - Expert
// Fusion des 3 versions : structure riche de v1 + UX avancée de v2/v3 + mapping backend clair

import PropTypes from 'prop-types';
import { useState } from 'react';
import {
    Vote, FileText, ArrowRight, Globe, Lock, Users,
    CreditCard, ShieldCheck, Calendar, Eye, EyeOff,
    Settings2, ChevronDown, ChevronUp, AlertCircle, Camera,
    CheckCircle,
    CheckSquare,
    Trophy,
    Star,
    Scale,
} from 'lucide-react';
import TextInput from '@components/ui/TextInput';
import toast from 'react-hot-toast';
import { NavLink } from 'react-router-dom';

// ── Toggle Réutilisable (issu de la v2.0) ────────────────────────
const Toggle = ({ name, checked, onChange, label, desc }) => (
    <div className="flex items-center justify-between py-3">
        <div>
            <p className="text-sm font-medium text-[var(--color-dark)]">{label}</p>
            {desc && <p className="text-xs text-[var(--color-gray)] mt-0.5">{desc}</p>}
        </div>
        <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-4">
            <input
                type="checkbox"
                name={name}
                checked={checked}
                onChange={onChange}
                className="sr-only peer"
            />
            <div className="w-11 h-6 bg-[var(--color-gray-light)] rounded-full peer
                peer-checked:after:translate-x-full peer-checked:after:border-white
                after:content-[''] after:absolute after:top-0.5 after:left-[2px]
                after:bg-white after:border-gray-300 after:border after:rounded-full
                after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--color-primary)]" />
        </label>
    </div>
);
// ── Constantes ────────────────────────────────────────────────────
const VOTE_TYPES = [
    { id: 1, value: 'single', label: 'Vote simple', desc: 'Chaque votant choisit 1 candidat', icon: CheckCircle },
    { id: 2, value: 'multiple', label: 'Vote multiple', desc: 'Chaque votant choisit plusieurs candidats', icon: CheckSquare },
    { id: 3, value: 'ranked', label: 'Vote par classement', desc: 'Classement par ordre de préférence', icon: Trophy },
    { id: 4, value: 'score', label: 'Vote par note', desc: 'Bientôt disponible', icon: Star, disabled: true },
    { id: 5, value: 'weighted', label: 'Vote pondéré', desc: 'Vote public + jury avec poids', icon: Scale },
];

const ELECTION_MODES = [
    { value: 'public', label: 'Public', desc: 'Tout le monde peut voter', icon: <Globe size={20} /> },
    { value: 'private', label: 'Privé', desc: 'Électeurs enregistrés avec code', icon: <Lock size={20} /> },
    { value: 'restricted', label: 'Restreint', desc: 'Accès par invitation ou lien sécurisé', icon: <Users size={20} /> },
];

const VISIBILITY_TYPES = [
    { value: 'public', label: 'Publique', desc: 'Visible dans les listes publiques', icon: <Eye size={16} /> },
    { value: 'unlisted', label: 'Non listée', desc: 'Accessible uniquement par lien', icon: <EyeOff size={16} /> },
    { value: 'private', label: 'Privée', desc: 'Invisible publiquement', icon: <Lock size={16} /> },
];

const PAYMENT_TYPES = [
    { value: 'free', label: 'Gratuit', desc: 'Aucun frais' },
    { value: 'paid', label: 'Payant', desc: 'Frais par vote' },
    { value: 'subscription', label: 'Abonnement', desc: 'Abonnement requis' },
];

const VERIFICATION_MODES = [
    { value: 'none', label: 'Aucune', desc: 'Sans vérification' },
    { value: 'email', label: 'Email OTP', desc: 'Code par email' },
    { value: 'sms', label: 'SMS OTP', desc: 'Code par SMS' },
    { value: 'both', label: 'Email + SMS', desc: 'Double vérification' },
];

const CURRENCIES = ['XAF', 'EUR', 'USD', 'GBP', 'XOF'];

const toUtcIso = (localDatetime) => (localDatetime ? new Date(localDatetime).toISOString() : null);

const MIN_START_AT = new Date(Date.now() + 60000).toISOString().slice(0, 16);

const Step1Generales = ({ onNext, initialData = {}, totalSteps = 4, }) => {
    const [image, setImage] = useState(null);
    const [form, setForm] = useState({
        // Champs principaux (alignés backend)
        title: initialData.title || initialData.titre || '',
        short_description: initialData.short_description || '',
        description: initialData.description || '',
        banner: initialData.banner || '',
        election_mode: initialData.election_mode || initialData.typeAccess || 'public',
        vote_type: initialData.vote_type || 'single',
        visibility_type: initialData.visibility_type || 'public',
        payment_type: initialData.payment_type || (initialData.isPaid ? 'paid' : 'free'),
        verification_mode: initialData.verification_mode || 'none',
        start_at: initialData.start_at || initialData.startDate,
        end_at: initialData.end_at || initialData.endDate,
        max_votes_per_user: initialData.max_votes_per_user || 1,
        vote_price: initialData.vote_price || initialData.votePrice || 0,
        currency: initialData.currency || 'XAF',

        // Candidatures
        accepts_candidates: initialData.accepts_candidates || initialData.acceptsCandidates || false,
        candidacy_start_at: initialData.candidacy_start_at || initialData.candidacyStartAt || null,
        candidacy_end_at: initialData.candidacy_end_at || initialData.candidacyEndAt || null,
        max_candidates: initialData.max_candidates || initialData.maxCandidates || 0,

        // Champs supplémentaires utiles
        categorie: initialData.categorie || null,
        real_time_results: initialData.real_time_results ?? true,
        public_results: initialData.public_results ?? true,
        allow_guest_vote: initialData.allow_guest_vote ?? false,
        fraud_detection_enabled: initialData.fraud_detection_enabled ?? true,
        has_categories: initialData.has_categories ?? false,
        scrutin_type: initialData.scrutin_type ?? '',

        public_weight_pct: initialData.public_weight != null ? Math.round(initialData.public_weight * 100) : 100,
        jury_weight_pct: initialData.jury_weight != null ? Math.round(initialData.jury_weight * 100) : 0,
    });

    const [errors, setErrors] = useState({});
    const [showAdvanced, setShowAdvanced] = useState(false);

    const isPublic = form.election_mode === 'public';

    const setField = (field, value) => {
        setForm(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => { const c = { ...prev }; delete c[field]; return c; });
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setField(name, type === 'checkbox' ? checked : value);
    };
    const handleVoteTypeChange = (e) => {
        const { value } = e.target;
        setForm(prev => ({
            ...prev,
            vote_type: value,
            payment_type: value === 'multiple' ? 'paid' : prev.payment_type,
        }));
        setErrors(prev => {
            const c = { ...prev };
            delete c.vote_type;
            delete c.payment_type;
            return c;
        });
    };

    const setPublicWeightPct = (value) => {
        const v = Math.max(0, Math.min(100, Number(value) || 0));
        setForm(prev => ({ ...prev, public_weight_pct: v, jury_weight_pct: 100 - v }));
    };

    const setJuryWeightPct = (value) => {
        const v = Math.max(0, Math.min(100, Number(value) || 0));
        setForm(prev => ({ ...prev, jury_weight_pct: v, public_weight_pct: 100 - v }));
    };

    //photo
    const handlePhotoUpload = (e) => {
        const file = e.target.files[0];
        console.log(file);
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            toast.error('La photo ne doit pas dépasser 5 Mo');
            return;
        }

        setForm(prev => ({ ...prev, banner: file }));
        const reader = new FileReader();
        reader.onload = (event) => setImage(event.target.result);
        reader.readAsDataURL(file);
    };
    // ── Validation ─────────────────────────────────────────────
    const validate = () => {
        const e = {};

        if (!form.title?.trim()) e.title = 'Le titre est obligatoire';

        if (!form.start_at) {
            e.start_at = 'Date de début requise';
        } else if (new Date(form.start_at) <= new Date()) {
            e.start_at = 'La date de début doit être dans le futur';
        }

        if (!form.end_at) {
            e.end_at = 'Date de fin requise';
        } else if (form.start_at && new Date(form.end_at) <= new Date(form.start_at)) {
            e.end_at = 'La date de fin doit être après le début';
        } else if (form.start_at) {
            const diffMin = (new Date(form.end_at) - new Date(form.start_at)) / 60000;
            if (diffMin < 60) e.end_at = 'Durée minimale : 1 heure';
        }

        if (form.payment_type === 'paid') {
            if (!form.vote_price || parseFloat(form.vote_price) <= 0) {
                e.vote_price = 'Montant positif requis';
            }
        }

        if (form.vote_type === 'multiple' && form.payment_type !== 'paid') {
            e.vote_type = 'Le vote multiple nécessite une élection payante';
        }

        if (form.accepts_candidates && isPublic) {
            if (!form.candidacy_start_at) e.candidacy_start_at = 'Date d’ouverture requise';
            if (!form.candidacy_end_at) e.candidacy_end_at = 'Date de clôture requise';
            if (form.candidacy_start_at && form.candidacy_end_at &&
                new Date(form.candidacy_end_at) >= new Date(form.start_at)) {
                e.candidacy_end_at = 'Les candidatures doivent se terminer avant le vote';
            }
        }

        return e;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const errs = validate();

        if (Object.keys(errs).length > 0) {
            setErrors(errs);
            toast.error('Veuillez corriger les erreurs');
            return;
        }

        // Nettoyage avant envoi
        const dataToSend = { ...form };
        if (!isPublic) {
            dataToSend.accepts_candidates = false;
            dataToSend.candidacy_start_at = null;
            dataToSend.candidacy_end_at = null;
            dataToSend.max_candidates = 0;
        }

        // Conversion heure locale (datetime-local) → UTC avant envoi au backend.
        dataToSend.start_at = toUtcIso(dataToSend.start_at);
        dataToSend.end_at = toUtcIso(dataToSend.end_at);
        dataToSend.candidacy_start_at = toUtcIso(dataToSend.candidacy_start_at);
        dataToSend.candidacy_end_at = toUtcIso(dataToSend.candidacy_end_at);

        // Le backend attend des fractions 0-1, pas des pourcentages.
        delete dataToSend.public_weight_pct;
        delete dataToSend.jury_weight_pct;
        if (form.vote_type === 'weighted') {
            dataToSend.public_weight = form.public_weight_pct / 100;
            dataToSend.jury_weight = form.jury_weight_pct / 100;
        }

        onNext(dataToSend);
    };

    const progress = Math.round((1 / totalSteps) * 100);

    return (
        <div className="max-w-4xl mx-auto bg-[var(--color-white)] rounded-[var(--radius-md)] shadow-[var(--shadow-sm)] p-8 md:p-10">
            {/* En-tête */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-10">
                <div className="flex-1">
                    <p className="text-sm font-medium text-[var(--color-gray)] uppercase tracking-widest">
                        ÉTAPE 1 SUR {totalSteps}
                    </p>
                    <h1 className="text-2xl sm:text-3xl font-semibold text-[var(--color-dark)] mt-1">
                        Informations Générales
                    </h1>
                    <p className="text-[var(--color-gray)] mt-2">
                        Configurez les paramètres fondamentaux de votre scrutin.
                    </p>
                </div>
                <div className="shrink-0 text-right">
                    <p className="text-[var(--color-primary)] font-semibold text-lg">{progress}%</p>
                    <div className="mt-2 w-40 h-1.5 bg-[var(--color-gray-light)] rounded-full overflow-hidden">
                        <div
                            className="h-full bg-[var(--color-primary)] rounded-full transition-all duration-300"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-10">
                {/* Titre + Descriptions */}
                <TextInput
                    label="Titre de l'élection"
                    name="title"
                    value={form.title}
                    onChange={handleChange}
                    placeholder="Ex: Élection du bureau exécutif 2026"
                    iconLeft={Vote}
                    error={errors.title}
                    required
                />
                <div className="mt-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Une photo de couverture ou une image pour votre scrutin
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-3xl p-10 text-center hover:border-blue-400 transition cursor-pointer">
                        <input
                            type="file"
                            accept="image/png,image/jpg image/jpeg, image/webp"
                            onChange={handlePhotoUpload}
                            className="hidden"
                            id="photo-upload"
                        />
                        <label htmlFor="photo-upload" className="cursor-pointer flex flex-col items-center">
                            <div className="w-24 h-24 rounded-ful flex items-center justify-center text-xl">
                                {image ? (
                                    <img src={image} alt="photo_preview" className="w-24 h-24 object-contain mb-4 rounded-full" />
                                ) : (
                                    <Camera className="w-12 h-12 text-gray-400 mb-4" />
                                )}
                            </div>
                            <p className="cursor-pointer bg-blue-50 hover:bg-blue-100 text-[var(--color-primary)] px-5 py-2.5 rounded-xl text-sm font-medium transition-colors">Cliquez pour télécharger</p>
                            <p className="text-sm text-gray-500 mt-1">PNG, JPG ou jpeg (max. 5 Mo)</p>
                        </label>
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-[var(--color-dark)] mb-1">
                        Description courte
                    </label>
                    <input
                        type="text"
                        name="short_description"
                        value={form.short_description}
                        onChange={handleChange}
                        maxLength={500}
                        placeholder="Résumé visible dans les listes..."
                        className="w-full px-5 py-3.5 border border-[var(--color-gray-light)] rounded-[var(--radius-md)] focus:outline-none focus:border-[var(--color-primary)]"
                    />
                    <p className="text-xs text-right text-[var(--color-gray)] mt-1">
                        {form.short_description.length}/500
                    </p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-[var(--color-dark)] mb-2">
                        Description complète
                    </label>
                    <textarea
                        name="description"
                        value={form.description}
                        onChange={handleChange}
                        rows={4}
                        placeholder="Contexte, enjeux, règles..."
                        className="w-full px-5 py-3.5 border border-[var(--color-gray-light)] rounded-[var(--radius-md)] focus:outline-none focus:border-[var(--color-primary)] resize-y"
                    />
                </div>
                {/* Type de vote */}
                <div>
                    <label className="block text-sm font-medium text-[var(--color-dark)] mb-3 whitespace-nowrap ">Type d'election <small className="text-red-600">*</small> </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {VOTE_TYPES.map(vt => {
                            const Icon = vt.icon
                            return (
                                <label
                                    key={vt.id}
                                    className={`p-4 border rounded-[var(--radius-md)] flex items-start gap-3 transition-all
                                    ${vt.disabled
                                        ? 'cursor-not-allowed opacity-50 border-[var(--color-gray-light)] bg-gray-50'
                                        : 'cursor-pointer ' + (form.vote_type === vt.value ? 'border-[var(--color-primary)] bg-blue-50' : 'border-[var(--color-gray-light)] hover:border-[var(--color-primary)]/50')}`}
                                >
                                    <input
                                        type="radio"
                                        name="vote_type"
                                        value={vt.value}
                                        checked={form.vote_type === vt.value}
                                        onChange={handleVoteTypeChange}
                                        disabled={vt.disabled}
                                        className="mt-1"
                                    />
                                    <div>
                                        <p className="font-medium text-sm"><Icon size={16} color="var(--color-primary)" /> {vt.label}</p>
                                        <p className="text-xs text-[var(--color-gray)] mt-0.5">{vt.desc}</p>
                                    </div>
                                </label>)
                        })}
                    </div>
                    {form.vote_type === 'multiple' && (
                        <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                            <AlertCircle size={12} /> Le vote multiple nécessite une élection payante — le paiement a été activé automatiquement.
                        </p>
                    )}

                    {form.vote_type === 'weighted' && (
                        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-[var(--radius-md)] p-5">
                            <p className="text-sm font-medium text-[var(--color-dark)] mb-3">
                                Répartition du score final entre vote public et jury
                            </p>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs text-[var(--color-gray)] mb-1">Poids du vote public (%)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={form.public_weight_pct}
                                        onChange={(e) => setPublicWeightPct(e.target.value)}
                                        className="w-full px-4 py-3 border border-[var(--color-gray-light)] rounded-[var(--radius-md)] focus:outline-none focus:border-[var(--color-primary)]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-[var(--color-gray)] mb-1">Poids du jury (%)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={form.jury_weight_pct}
                                        onChange={(e) => setJuryWeightPct(e.target.value)}
                                        className="w-full px-4 py-3 border border-[var(--color-gray-light)] rounded-[var(--radius-md)] focus:outline-none focus:border-[var(--color-primary)]"
                                    />
                                </div>
                            </div>
                            <p className="text-xs text-[var(--color-gray)] mt-2">
                                La somme est toujours ramenée à 100 %. Vous pourrez ensuite définir les critères de notation et affecter des membres du jury depuis la gestion de l'élection.
                            </p>
                        </div>
                    )}
                </div>

                {/* Mode d'élection + Visibilité */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div>
                        <label className="block text-sm font-medium text-[var(--color-dark)] mb-3 whitespace-nowrap">Mode d'élection <small className="text-red-600">*</small></label>
                        <div className="space-y-3">
                            {ELECTION_MODES.map(em => (
                                <label key={em.value} className={`p-4 border rounded-[var(--radius-md)] cursor-pointer flex items-start gap-3 transition-all ${form.election_mode === em.value ? 'border-[var(--color-primary)] bg-blue-50' : 'border-[var(--color-gray-light)] hover:border-[var(--color-primary)]/50'}`}>
                                    <input type="radio" name="election_mode" value={em.value} checked={form.election_mode === em.value} onChange={handleChange} className="mt-1" />
                                    <div className="flex-1">
                                        <p className="font-medium flex items-center gap-2">{em.icon} {em.label}</p>
                                        <p className="text-xs text-[var(--color-gray)]">{em.desc}</p>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-[var(--color-dark)] mb-3 whitespace-nowrap">Visibilité <small className="text-red-600">*</small></label>
                        <div className="space-y-3">
                            {VISIBILITY_TYPES.map(vt => (
                                <label key={vt.value} className={`p-4 border rounded-[var(--radius-md)] cursor-pointer flex items-start gap-3 transition-all ${form.visibility_type === vt.value ? 'border-[var(--color-primary)] bg-blue-50' : 'border-[var(--color-gray-light)] hover:border-[var(--color-primary)]/50'}`}>
                                    <input type="radio" name="visibility_type" value={vt.value} checked={form.visibility_type === vt.value} onChange={handleChange} className="mt-1" />
                                    <div className="flex-1">
                                        <p className="font-medium flex items-center gap-2">{vt.icon} {vt.label}</p>
                                        <p className="text-xs text-[var(--color-gray)]">{vt.desc}</p>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Paiement */}
                <div>
                    <label className="block text-sm font-medium text-[var(--color-dark)] mb-3 whitespace-nowrap">Type de paiement <small className="text-red-600">*</small></label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {PAYMENT_TYPES.map(pt => (
                            <label key={pt.value} className={`p-4 border rounded-[var(--radius-md)] cursor-pointer flex items-start gap-3 transition-all ${form.payment_type === pt.value ? 'border-[var(--color-primary)] bg-blue-50' : 'border-[var(--color-gray-light)] hover:border-[var(--color-primary)]/50'}`}>
                                <input type="radio" name="payment_type" value={pt.value} checked={form.payment_type === pt.value} onChange={handleChange} />
                                <div>
                                    <p className="font-medium">{pt.label}</p>
                                    <p className="text-xs text-[var(--color-gray)]">{pt.desc}</p>
                                </div>
                            </label>
                        ))}
                    </div>

                    {form.payment_type === 'paid' && (
                        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <TextInput
                                label="Montant par vote"
                                name="vote_price"
                                type="number"
                                value={form.vote_price}
                                onChange={handleChange}
                                placeholder="500"
                                error={errors.vote_price}
                                required
                            />
                            <div>
                                <label className="block text-sm font-medium text-[var(--color-dark)] mb-1">Devise</label>
                                <select
                                    name="currency"
                                    value={form.currency}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border border-[var(--color-gray-light)] rounded-[var(--radius-md)] focus:outline-none focus:border-[var(--color-primary)]"
                                >
                                    {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                        </div>
                    )}
                </div>

                {/* Vérification */}
                <div>
                    <label className="block text-sm font-medium text-[var(--color-dark)] mb-3">Vérification des votants</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {VERIFICATION_MODES.map(vm => (
                            <label key={vm.value} className={`p-3 border rounded-[var(--radius-md)] cursor-pointer flex items-start gap-2 transition-all ${form.verification_mode === vm.value ? 'border-[var(--color-primary)] bg-blue-50' : 'border-[var(--color-gray-light)] hover:border-[var(--color-primary)]/50'}`}>
                                <input type="radio" name="verification_mode" value={vm.value} checked={form.verification_mode === vm.value} onChange={handleChange} className="mt-1" />
                                <div>
                                    <p className="font-medium text-sm">{vm.label}</p>
                                    <p className="text-xs text-[var(--color-gray)]">{vm.desc}</p>
                                </div>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Dates de vote */}
                <div>
                    <label className="block text-sm font-medium text-[var(--color-dark)] mb-3 whitespace-nowrap">Période de vote <small className="text-red-600">*</small></label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xs text-[var(--color-gray)] mb-1">Ouverture</label>
                            <input
                                type="datetime-local"
                                name="start_at"
                                value={form.start_at}
                                min={MIN_START_AT}
                                onChange={handleChange}
                                className={`w-full px-4 py-3 border rounded-[var(--radius-md)] focus:outline-none focus:border-[var(--color-primary)] ${errors.start_at ? 'border-red-500' : 'border-[var(--color-gray-light)]'}`}
                                required
                            />
                            {errors.start_at && <p className="text-xs text-red-600 mt-1 flex items-center gap-1"><AlertCircle size={12} />{errors.start_at}</p>}
                        </div>
                        <div>
                            <label className="block text-xs text-[var(--color-gray)] mb-1">Clôture</label>
                            <input
                                type="datetime-local"
                                name="end_at"
                                value={form.end_at}
                                min={form.start_at ? new Date(new Date(form.start_at).getTime() + 3600000).toISOString().slice(0, 16) : undefined}
                                onChange={handleChange}
                                className={`w-full px-4 py-3 border rounded-[var(--radius-md)] focus:outline-none focus:border-[var(--color-primary)] ${errors.end_at ? 'border-red-500' : 'border-[var(--color-gray-light)]'}`}
                                required
                            />
                            {errors.end_at && <p className="text-xs text-red-600 mt-1 flex items-center gap-1"><AlertCircle size={12} />{errors.end_at}</p>}
                        </div>
                    </div>
                </div>

                {/* Candidatures publiques */}
                {isPublic && (
                    <div className="border border-[var(--color-gray-light)] rounded-[var(--radius-md)] p-6 space-y-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium">Candidatures publiques ouvertes</p>
                                <p className="text-sm text-[var(--color-gray)]">Permettre aux utilisateurs de candidater</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    name="accepts_candidates"
                                    checked={form.accepts_candidates}
                                    onChange={handleChange}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-[var(--color-gray-light)] rounded-full peer peer-checked:bg-[var(--color-primary)] peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all" />
                            </label>
                        </div>

                        {form.accepts_candidates && (
                            <div className="pt-4  space-y-5">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Début des candidatures</label>
                                        <input type="datetime-local" name="candidacy_start_at" value={form.candidacy_start_at} onChange={handleChange} className="w-full px-4 py-3 border border-[var(--color-gray-light)] rounded-[var(--radius-md)]" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Fin des candidatures</label>
                                        <input type="datetime-local" name="candidacy_end_at" value={form.candidacy_end_at} onChange={handleChange} className="w-full px-4 py-3 border border-[var(--color-gray-light)] rounded-[var(--radius-md)]" />
                                        {errors.candidacy_end_at && <p className="text-xs text-red-600 mt-1">{errors.candidacy_end_at}</p>}
                                    </div>
                                </div>

                                <TextInput
                                    label="Nombre maximum de candidats (0 = illimité)"
                                    name="max_candidates"
                                    type="number"
                                    value={form.max_candidates}
                                    onChange={handleChange}
                                    placeholder="0"
                                />
                            </div>
                        )}
                    </div>
                )}
                <div className="border border-[var(--color-gray-light)] rounded-[var(--radius-md)] p-6 space-y-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium">L'election possede des categories ?</p>
                            <p className="text-sm text-[var(--color-gray)]">Sa permettra ajouter les candidates par categorie a l'etape suivante</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                name="has_categories"
                                checked={form.has_categories}
                                onChange={handleChange}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-[var(--color-gray-light)] rounded-full peer peer-checked:bg-[var(--color-primary)] peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all" />
                        </label>
                    </div>
                </div>

                {/* Options avancées */}
                <div className="border border-[var(--color-gray-light)] rounded-[var(--radius-md)] overflow-hidden">
                    <button
                        type="button"
                        onClick={() => setShowAdvanced(!showAdvanced)}
                        className="w-full px-6 py-4 bg-gray-50 hover:bg-gray-100 flex items-center justify-between text-left transition"
                    >
                        <div className="flex items-center gap-3">
                            <Settings2 size={20} className="text-[var(--color-gray)]" />
                            <div>
                                <p className="font-medium">Options avancées</p>
                                <p className="text-xs text-[var(--color-gray)]">Sécurité, résultats, limites...</p>
                            </div>
                        </div>
                        {showAdvanced ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </button>

                    {showAdvanced && (
                        <div className="p-6 space-y-1 border-t divide-y divide-[var(--color-gray-light)]">
                            {/* Type de scrutin */}
                            <div>
                                <label className="block text-sm font-medium text-[var(--color-dark)] mb-2">Type de scrutin</label>
                                <select
                                    name="scrutin_type"
                                    value={form.scrutin_type}
                                    onChange={handleChange}
                                    className="w-full px-5 py-3.5 border border-[var(--color-gray-light)] rounded-[var(--radius-md)] focus:outline-none focus:border-[var(--color-primary)]"
                                >
                                    <option value="majoritaire">Majoritaire (1 choix)</option>
                                    <option value="proportionnel">Proportionnel</option>
                                    <option value="mixte">Mixte</option>
                                    <option value="classement">Classement (ranked)</option>
                                </select>
                            </div>
                            <Toggle
                                name="real_time_results"
                                checked={form.real_time_results}
                                onChange={handleChange}
                                label="Résultats en temps réel"
                                desc="Affiche les scores qui évoluent au fil des votes"
                            />
                            <Toggle
                                name="public_results"
                                checked={form.public_results}
                                onChange={handleChange}
                                label="Résultats publics"
                                desc="Les résultats sont visibles par tous après clôture"
                            />
                            <Toggle
                                name="allow_guest_vote"
                                checked={form.allow_guest_vote}
                                onChange={handleChange}
                                label="Autoriser les votes anonymes"
                                desc="Permet de voter sans compte (élections publiques uniquement)"
                            />
                            <Toggle
                                name="fraud_detection_enabled"
                                checked={form.fraud_detection_enabled}
                                onChange={handleChange}
                                label="Détection automatique de fraude"
                                desc="Analyse des comportements suspects"
                            />

                            <div className="pt-4">
                                <label className="block text-sm font-medium text-[var(--color-dark)] mb-2">
                                    Votes maximum par électeur
                                </label>
                                <input
                                    type="number"
                                    name="max_votes_per_user"
                                    value={form.max_votes_per_user}
                                    onChange={handleChange}
                                    min="1"
                                    max="50"
                                    className="w-full px-4 py-3 border border-[var(--color-gray-light)] rounded-[var(--radius-md)] focus:outline-none focus:border-[var(--color-primary)]"
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Navigation */}
                <div className="flex justify-between pt-6">
                    <NavLink to="/org/scrutins" className="btn-secondary px-8 py-3 font-medium">
                        Annuler
                    </NavLink>
                    <button
                        type="submit"
                        className="btn-primary flex items-center gap-2 px-8 py-3 font-medium"
                    >
                        Étape suivante <ArrowRight size={18} />
                    </button>
                </div>
            </form>
        </div>
    );
};

Step1Generales.propTypes = {
    onNext: PropTypes.func.isRequired,
    initialData: PropTypes.object,
    totalSteps: PropTypes.number,
};

export default Step1Generales;
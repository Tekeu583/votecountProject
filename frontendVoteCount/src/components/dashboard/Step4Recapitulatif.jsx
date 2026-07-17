import React from 'react';
import PropTypes from 'prop-types';
import {
    ArrowLeft, CheckCircle, Users, BookAlert,
    User, Navigation, LockKeyhole, NotepadText, Settings2, Tag, AlertCircle,
} from 'lucide-react';

// ── Badge utilitaire ──────────────────────────────────────────────
const Badge = ({ active, labelOn = 'Activé', labelOff = 'Désactivé' }) => (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
        }`}>
        {active ? labelOn : labelOff}
    </span>
);

const Step4Recapitulatif = ({ data, onPrevious, onPublish, isPublish = false, hasMinCandidates = true, uncategorizedCandidates = [], onSaveDraft }) => {
    const { general = {}, candidats = [], votants = {} } = data || {};

    const totalVotants = votants.totalVotants || votants.previewCount || 0;
    const importMethod = votants.importMethod || 'grouped';
    const uploadedFileName = votants.uploadedFileName || '';

    const formatDate = (date) => {
        if (!date) return '—';
        const d = new Date(date);
        return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
            + ' à '
            + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    };

    const verificationModeLabel = {
        none: 'Aucune',
        email: 'Email (OTP)',
        sms: 'SMS (OTP)',
        both: 'Email + SMS',
    }[general?.verification_mode ?? 'none'];

    // Libellés identiques à ceux de Step1Generales (VOTE_TYPES, ELECTION_MODES)
    const voteTypeLabel = {
        single: 'Vote simple',
        multiple: 'Vote multiple',
        ranked: 'Vote par classement par ordre de preference',
        score: 'Vote par note',
        weighted: 'Vote pondéré',
    }[general?.vote_type] ?? '—';

    const electionModeLabel = {
        public: 'Public',
        private: 'Privé',
        restricted: 'Restreint',
    }[general?.election_mode] ?? '—';

    return (
        <div className="max-w-4xl mx-auto">

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-10">
                <div className="flex-1">
                    <p className="text-sm text-gray-500">ÉTAPE 4 SUR 4</p>
                    <h1 className="text-3xl font-semibold text-gray-900 mt-1">Récapitulatif & Publication</h1>
                    <p className="text-gray-600 mt-2">Vérifiez les détails avant la mise en ligne.</p>
                </div>
                <div className="shrink-0 text-left md:text-right">
                    <p className="text-emerald-600 font-medium">100% complété</p>
                    <div className="h-1.5 w-40 bg-gray-200 rounded-full mt-2">
                        <div className="h-1.5 w-full bg-emerald-600 rounded-full" />
                    </div>
                </div>
            </div>

            <div className="space-y-8">

                {/* ── Informations Générales ─────────────────────── */}
                <div className="bg-white rounded-[var(--radius-md)] shadow-sm p-8">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                            <BookAlert size={20} />
                        </div>
                        <h2 className="text-xl font-semibold">Informations Générales</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-y-5 gap-x-8">
                        <div className="md:col-span-2">
                            <p className="text-sm text-gray-500">Titre</p>
                            <p className="font-semibold text-gray-900 mt-1 text-lg">{general?.title || '—'}</p>
                        </div>

                        {general?.short_description && (
                            <div className="md:col-span-2">
                                <p className="text-sm text-gray-500">Description courte</p>
                                <p className="text-gray-700 mt-1 text-sm">{general.short_description}</p>
                            </div>
                        )}

                        <div>
                            <p className="text-sm text-gray-500">Type de scrutin</p>
                            <p className="font-medium text-gray-900 mt-1 capitalize">{voteTypeLabel}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Type d'accès</p>
                            <p className="font-medium text-gray-900 mt-1 capitalize">{electionModeLabel}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Code d'accès</p>
                            <p className="font-medium text-gray-900 mt-1">{general?.voter_code || 'Aucun'}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Paiement</p>
                            <p className="font-medium text-gray-900 mt-1">
                                {general?.payment_type === 'paid' ? `Payant — ${general.vote_price ?? 0} ${general.currency ?? 'XAF'}` : 'Gratuit'}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Fuseau horaire</p>
                            <p className="font-medium text-gray-900 mt-1">{general?.timezone || 'Africa/Douala'}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Date de début</p>
                            <p className="font-medium text-gray-900 mt-1">{formatDate(general?.start_at)}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Date de fin</p>
                            <p className="font-medium text-gray-900 mt-1">{formatDate(general?.end_at)}</p>
                        </div>
                    </div>

                    {/* Options avancées */}
                    <div className="mt-6 pt-6 border-t border-gray-100">
                        <p className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-4">
                            <Settings2 size={14} /> Options avancées
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                            <div className="flex items-center justify-between gap-2">
                                <span className="text-gray-500">Résultats live</span>
                                <Badge active={general?.real_time_results} />
                            </div>
                            <div className="flex items-center justify-between gap-2">
                                <span className="text-gray-500">Résultats publics</span>
                                <Badge active={general?.public_results ?? true} />
                            </div>
                            <div className="flex items-center justify-between gap-2">
                                <span className="text-gray-500">Vote anonyme</span>
                                <Badge active={general?.allow_guest_vote} />
                            </div>
                            <div className="flex items-center justify-between gap-2">
                                <span className="text-gray-500">OTP obligatoire</span>
                                <Badge active={general?.otp_required} />
                            </div>
                            <div className="flex items-center justify-between gap-2">
                                <span className="text-gray-500">Anti-fraude</span>
                                <Badge active={general?.fraud_detection_enabled ?? true} />
                            </div>
                            <div>
                                <span className="text-gray-500">Vérification : </span>
                                <span className="font-medium">{verificationModeLabel}</span>
                            </div>
                            <div>
                                <span className="text-gray-500">Max votes/électeur : </span>
                                <span className="font-medium">{general?.max_votes_per_user ?? 1}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Candidats ─────────────────────────────────── */}
                <div className="bg-white rounded-[var(--radius-md)] shadow-sm p-8">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                                <Users size={18} className="text-purple-600" />
                            </div>
                            <h2 className="text-xl font-semibold">Candidats</h2>
                        </div>
                        <span className="text-sm font-medium text-blue-600">
                            {candidats.length} candidat(s)
                        </span>
                    </div>

                    {candidats.length > 0 ? (
                        <div className="space-y-3">
                            {candidats.map((c, index) => (
                                <div key={index}
                                    className="flex items-center gap-4 bg-gray-50 px-4 py-3 rounded-xl">
                                    {/* Avatar */}
                                    <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 shrink-0">
                                        {c.photoPreview ? (
                                            <img src={c.photo} alt={c.name}
                                                className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <User size={20} className="text-gray-400" />
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-sm text-gray-900 truncate">
                                            {c.lastname} {c.name}
                                        </p>
                                        {c.slogan && (
                                            <p className="text-xs text-gray-500 italic truncate">
                                                "{c.slogan}"
                                            </p>
                                        )}
                                        {c.bio && !c.slogan && (
                                            <p className="text-xs text-gray-500 truncate">{c.bio}</p>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-2 shrink-0">
                                        {c.position && (
                                            <span className="text-xs text-gray-400">#{c.position}</span>
                                        )}
                                        {c.category_id && (
                                            <span className="flex items-center gap-1 text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                                                <Tag size={10} />  {c?.category_name || ''}
                                            </span>
                                        )}
                                        {c.coverPhotoPreview && (
                                            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                                                Couverture
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-400 text-sm py-4">Aucun candidat ajouté</p>
                    )}
                </div>

                {/* ── Liste électorale ──────────────────────────── */}
                <div className="bg-white rounded-[var(--radius-md)] shadow-sm p-8">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                            <NotepadText size={18} className="text-emerald-600" />
                        </div>
                        <h2 className="text-xl font-semibold">Liste électorale</h2>
                    </div>

                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-4xl font-semibold text-gray-900">
                                {totalVotants.toLocaleString('fr-FR')}
                            </p>
                            <p className="text-gray-500 text-sm mt-1">Électeurs inscrits</p>
                        </div>
                        <CheckCircle size={48} className="text-emerald-500" />
                    </div>

                    <div className="mt-6 pt-6 border-t border-gray-100 text-sm space-y-3">
                        <div>
                            <span className="text-gray-500">Méthode : </span>
                            <span className="font-medium">
                                {importMethod === 'grouped' ? 'Importation groupée (CSV/Excel)' : 'Saisie manuelle'}
                            </span>
                        </div>
                        {importMethod === 'grouped' && uploadedFileName && (
                            <div>
                                <span className="text-gray-500">Fichier : </span>
                                <span className="font-medium">{uploadedFileName}</span>
                            </div>
                        )}
                        <div className="pt-2">
                            <span className="text-gray-500">Vérification des électeurs : </span>
                            <span className="font-medium">{verificationModeLabel}</span>
                        </div>
                    </div>
                </div>

                {/* ── Note sécurité ─────────────────────────────── */}
                <div className="flex items-center gap-3 bg-blue-50 text-blue-700 px-6 py-4 rounded-2xl">
                    <LockKeyhole size={22} />
                    <p className="text-sm font-medium">SCRUTIN CRYPTÉ DE BOUT-EN-BOUT (AES-256)</p>
                </div>
            </div>

            {/* ── Avertissement de blocage publication ──────────── */}
            {!isPublish && (
                <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 text-amber-800 px-6 py-4 rounded-2xl mt-8">
                    <AlertCircle size={20} className="shrink-0 mt-0.5" />
                    <div className="text-sm">
                        {!hasMinCandidates && (
                            <p>La publication nécessite au moins <strong>2 candidats</strong>. Retournez à l'étape 2 pour en ajouter.</p>
                        )}
                        {hasMinCandidates && uncategorizedCandidates.length > 0 && (
                            <>
                                <p className="font-medium mb-1">
                                    {uncategorizedCandidates.length} candidat(s) sans catégorie assignée :
                                </p>
                                <p>
                                    Cette élection utilise des catégories — chaque candidat doit en avoir une avant publication.
                                </p>
                                <ul className="list-disc list-inside mt-2 space-y-0.5">
                                    {uncategorizedCandidates.map((c, i) => (
                                        <li key={i}>{c.lastname} {c.name}</li>
                                    ))}
                                </ul>
                                <p className="mt-2">Retournez à l'étape 2 pour leur assigner une catégorie.</p>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* ── Navigation ────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row justify-between gap-4 mt-6">
                <button onClick={onPrevious}
                    className="flex items-center gap-2 justify-center btn-secondary font-medium">
                    <ArrowLeft size={20} /> Retour
                </button>
                <div className="flex flex-col sm:flex-row gap-4">
                    <button onClick={onSaveDraft} className="btn-secondary font-medium">
                        Enregistrer en brouillon
                    </button>
                    <button
                        onClick={onPublish}
                        disabled={!isPublish}
                        title={!isPublish ? "Conditions de publication non remplies — voir le message ci-dessus" : ""}
                        className={`btn-primary font-medium flex items-center justify-center gap-3
                            ${!isPublish ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        Publier le scrutin <Navigation size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
};

Step4Recapitulatif.propTypes = {
    data: PropTypes.shape({
        general: PropTypes.object,
        candidats: PropTypes.array,
        votants: PropTypes.object,
    }),
    onPrevious: PropTypes.func.isRequired,
    onPublish: PropTypes.func.isRequired,
    isPublish: PropTypes.bool,
    hasMinCandidates: PropTypes.bool,
    uncategorizedCandidates: PropTypes.array,
    onSaveDraft: PropTypes.func.isRequired,
};

export default Step4Recapitulatif;
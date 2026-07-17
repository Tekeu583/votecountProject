// pages/dashboards/DashboardAdminOrg/EditScrutin.jsx
import { useState, useEffect } from 'react';
import { useNavigate, useParams, NavLink } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FadeLoader } from 'react-spinners';
import { AlertCircle, ImagePlus } from 'lucide-react';
import TextInput from '@components/ui/TextInput';
import JuryCriteriaManager from '@components/dashboard/JuryCriteriaManager';
import { electionsApi } from '@services/api';
import { useOrg } from '@hooks/useOrg';

const toDatetimeLocal = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};


const EditScrutin = () => {
    const { uuid } = useParams();
    const { org } = useOrg();
    const navigate = useNavigate();

    const [election, setElection] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState({});

    const [form, setForm] = useState({
        title: '',
        short_description: '',
        description: '',
        start_at: '',
        end_at: '',
        max_votes_per_user: 1,
        max_choices: '',
        vote_price: '',
        public_weight_pct: 100,
        jury_weight_pct: 0,
    });
    const [bannerFile, setBannerFile] = useState(null);
    const [bannerPreview, setBannerPreview] = useState(null);

    useEffect(() => {
        let cancelled = false;
        const load = async () => {
            setLoading(true);
            try {
                const res = await electionsApi.get(uuid);
                const e = res.data?.data ?? res.data;
                if (cancelled) return;
                setElection(e);
                setForm({
                    title: e.title ?? '',
                    short_description: e.short_description ?? '',
                    description: e.description ?? '',
                    start_at: toDatetimeLocal(e.start_at),
                    end_at: toDatetimeLocal(e.end_at),
                    max_votes_per_user: e.max_votes_per_user ?? 1,
                    max_choices: e.max_choices ?? '',
                    vote_price: e.vote_price ?? '',
                    public_weight_pct: Math.round((e.public_weight ?? 1) * 100),
                    jury_weight_pct: Math.round((e.jury_weight ?? 0) * 100),
                });
                setBannerPreview(e.banner ?? null);
            } catch {
                toast.error("Impossible de charger ce scrutin.");
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        load();
        return () => { cancelled = true; };
    }, [uuid]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleBannerChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setBannerFile(file);
        setBannerPreview(URL.createObjectURL(file));
    };

    const validate = () => {
        const next = {};
        if (!form.title.trim()) next.title = 'Le titre est obligatoire.';
        if (!form.start_at) next.start_at = "La date d'ouverture est obligatoire.";
        if (!form.end_at) next.end_at = 'La date de clôture est obligatoire.';
        if (form.start_at && form.end_at && new Date(form.end_at) <= new Date(form.start_at)) {
            next.end_at = "La clôture doit être après l'ouverture.";
        }
        if (election?.vote_type === 'weighted') {
            const sum = Number(form.public_weight_pct) + Number(form.jury_weight_pct);
            if (Math.abs(sum - 100) > 0.01) {
                next.jury_weight_pct = 'La somme des deux poids doit être égale à 100%.';
            }
        }
        setErrors(next);
        return Object.keys(next).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;

        setSubmitting(true);
        try {
            const fields = {
                title: form.title,
                short_description: form.short_description || null,
                description: form.description || null,
                start_at: new Date(form.start_at).toISOString(),
                end_at: new Date(form.end_at).toISOString(),
                max_votes_per_user: form.max_votes_per_user,
                max_choices: form.max_choices || null,
            };
            if (election?.payment_type === 'paid') {
                fields.vote_price = form.vote_price;
            }
            if (election?.vote_type === 'weighted') {
                fields.public_weight = Number(form.public_weight_pct) / 100;
                fields.jury_weight = Number(form.jury_weight_pct) / 100;
            }

            let payload;
            if (bannerFile) {
                payload = new FormData();
                Object.entries(fields).forEach(([key, value]) => {
                    if (value !== null && value !== undefined) payload.append(key, value);
                });
                payload.append('banner', bannerFile);
            } else {
                payload = fields;
            }

            await electionsApi.update(uuid, payload);
            toast.success('Scrutin mis à jour avec succès.');
            navigate(`/org/${org?.uuid}/scrutins`);
        } catch (err) {
            const message = err.response?.data?.message ?? 'Erreur lors de la mise à jour.';
            toast.error(message);
            const apiErrors = err.response?.data?.errors;
            if (apiErrors) {
                setErrors(Object.fromEntries(Object.entries(apiErrors).map(([k, v]) => [k, v[0]])));
            }
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <FadeLoader color="var(--color-primary)" />
            </div>
        );
    }

    if (!election) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <p className="text-[var(--color-gray)]">Scrutin introuvable.</p>
            </div>
        );
    }

    if (!election.is_editable) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 text-center px-4">
                <AlertCircle size={40} className="text-amber-500" />
                <p className="text-[var(--color-dark)] font-medium">
                    Ce scrutin ne peut plus être modifié (statut : {election.status_label}).
                </p>
                <NavLink to={`/org/${org?.uuid}/scrutins`} className="btn-secondary">
                    Retour aux scrutins
                </NavLink>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--color-background-white)] p-2">
            <div className="max-w-3xl mx-auto px-4 lg:px-6 py-6">
                <h1 className="text-2xl font-semibold text-[var(--color-dark)] mb-1">Modifier le scrutin</h1>
                <p className="text-[var(--color-gray)] text-sm mb-8">{election.title}</p>

                <form onSubmit={handleSubmit} className="space-y-6 bg-white rounded-[var(--radius-md)] shadow-[var(--shadow-md)] p-6 border border-gray-100">
                    <TextInput
                        label="Titre"
                        name="title"
                        value={form.title}
                        onChange={handleChange}
                        required
                    />
                    {errors.title && <p className="text-xs text-red-600 -mt-4 flex items-center gap-1"><AlertCircle size={12} />{errors.title}</p>}

                    <TextInput
                        label="Description courte"
                        name="short_description"
                        value={form.short_description}
                        onChange={handleChange}
                    />

                    <div>
                        <label className="block text-sm font-medium text-[var(--color-dark)] mb-2">Description</label>
                        <textarea
                            name="description"
                            value={form.description}
                            onChange={handleChange}
                            rows={4}
                            className="w-full px-4 py-3 border border-[var(--color-gray-light)] rounded-[var(--radius-md)] focus:outline-none focus:border-[var(--color-primary)]"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-[var(--color-dark)] mb-2">Bannière</label>
                        <div className="flex items-center gap-4">
                            {bannerPreview ? (
                                <img src={bannerPreview} alt="Bannière" className="w-20 h-20 rounded-lg object-cover" />
                            ) : (
                                <div className="w-20 h-20 rounded-lg bg-blue-50 flex items-center justify-center">
                                    <ImagePlus size={20} className="text-[var(--color-primary)]" />
                                </div>
                            )}
                            <input type="file" accept="image/*" onChange={handleBannerChange} className="text-sm" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xs text-[var(--color-gray)] mb-1">Ouverture</label>
                            <input
                                type="datetime-local"
                                name="start_at"
                                value={form.start_at}
                                onChange={handleChange}
                                disabled={election.status === 'ongoing'}
                                className={`w-full px-4 py-3 border rounded-[var(--radius-md)] focus:outline-none focus:border-[var(--color-primary)] disabled:bg-[var(--color-gray-light)] disabled:cursor-not-allowed ${errors.start_at ? 'border-red-500' : 'border-[var(--color-gray-light)]'}`}
                                required
                            />
                            {election.status === 'ongoing' && (
                                <p className="text-xs text-[var(--color-gray)] mt-1">Le vote a déjà commencé, la date d'ouverture ne peut plus être modifiée.</p>
                            )}
                            {errors.start_at && <p className="text-xs text-red-600 mt-1 flex items-center gap-1"><AlertCircle size={12} />{errors.start_at}</p>}
                        </div>
                        <div>
                            <label className="block text-xs text-[var(--color-gray)] mb-1">Clôture</label>
                            <input
                                type="datetime-local"
                                name="end_at"
                                value={form.end_at}
                                onChange={handleChange}
                                className={`w-full px-4 py-3 border rounded-[var(--radius-md)] focus:outline-none focus:border-[var(--color-primary)] ${errors.end_at ? 'border-red-500' : 'border-[var(--color-gray-light)]'}`}
                                required
                            />
                            {errors.end_at && <p className="text-xs text-red-600 mt-1 flex items-center gap-1"><AlertCircle size={12} />{errors.end_at}</p>}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <TextInput
                            label="Votes max. par électeur"
                            name="max_votes_per_user"
                            type="number"
                            value={form.max_votes_per_user}
                            onChange={handleChange}
                        />
                        <TextInput
                            label="Choix max. par bulletin"
                            name="max_choices"
                            type="number"
                            value={form.max_choices}
                            onChange={handleChange}
                            placeholder="Illimité"
                        />
                    </div>

                    {election.payment_type === 'paid' && (
                        <TextInput
                            label={`Prix du vote (${election.currency ?? 'XAF'})`}
                            name="vote_price"
                            type="number"
                            value={form.vote_price}
                            onChange={handleChange}
                        />
                    )}

                    {election.vote_type === 'weighted' && (
                        <div>
                            <label className="block text-sm font-medium text-[var(--color-dark)] mb-3">
                                Pondération public / jury
                            </label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <TextInput
                                    label="Poids du vote public (%)"
                                    name="public_weight_pct"
                                    type="number"
                                    value={form.public_weight_pct}
                                    onChange={handleChange}
                                />
                                <TextInput
                                    label="Poids du jury (%)"
                                    name="jury_weight_pct"
                                    type="number"
                                    value={form.jury_weight_pct}
                                    onChange={handleChange}
                                />
                            </div>
                            {errors.jury_weight_pct && <p className="text-xs text-red-600 mt-1 flex items-center gap-1"><AlertCircle size={12} />{errors.jury_weight_pct}</p>}
                        </div>
                    )}

                    <div className="flex gap-3 pt-4 border-t border-[var(--color-gray-light)]">
                        <button
                            type="button"
                            onClick={() => navigate(`/org/${org?.uuid}/scrutins`)}
                            className="flex-1 btn-secondary py-3"
                        >
                            Annuler
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="flex-1 btn-primary py-3 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {submitting ? 'Enregistrement...' : 'Enregistrer les modifications'}
                        </button>
                    </div>
                </form>

                {/* Hors du <form> : CriteriaModal a son propre <form>, imbriquer
                    aurait été invalide en HTML. Sauvegarde indépendante (API dédiée
                    par critère), pas liée au bouton "Enregistrer" ci-dessus. */}
                {election.vote_type === 'weighted' && (
                    <div className="mt-6">
                        <JuryCriteriaManager electionUuid={uuid} />
                    </div>
                )}
            </div>
        </div>
    );
};

export default EditScrutin;

import { useState, useEffect, useCallback, useRef } from 'react';
import PropTypes from 'prop-types';
import { Plus, Trash2, ArrowLeft, ArrowRight, User, Camera, Tag, Upload, FileSpreadsheet, X, AlertCircle, Loader2, ServerCog, CheckCircle2 } from 'lucide-react';
import TextInput from '../ui/TextInput';
import toast from 'react-hot-toast';
import { electionsApi, candidatesApi } from '@services/api';
import { FadeLoader } from 'react-spinners';
import * as XLSX from 'xlsx';

// Au-delà de ce nombre de lignes détectées, l'import serveur (asynchrone,
// robuste) est suggéré à la place du parsing client-side qui charge tout
// en mémoire navigateur et créerait ensuite un appel API par candidat.
const SERVER_IMPORT_THRESHOLD = 20;

// ── Parser CSV/Excel → liste de candidats ---─
// Lecture positionnelle, alignée sur le template généré par downloadTemplate() :
// full_name | email | phone | bio | manifesto | slogan | position | category
const parseFile = (file, categories = []) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = new Uint8Array(e.target.result);
            const wb = XLSX.read(data, { type: 'array' });
            const sheet = wb.Sheets[wb.SheetNames[0]];
            const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

            const resolveCategoryId = (name) => {
                if (!name) return null;
                const normalized = String(name).trim().toLowerCase();
                const found = categories.find(c => c.name?.toLowerCase() === normalized);
                return found?.id ?? null;
            };

            // Ignorer la première ligne (en-tête)
            const candidates = rows.slice(1)
                .filter(row => row.some(cell => String(cell).trim()))
                .map((row, index) => {
                    const email = String(row[1] ?? '').trim().toLowerCase();
                    // Si email invalide, le mettre à null
                    const cleanEmail = email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;

                    return {
                        id: Date.now() + index,
                        full_name: String(row[0] ?? '').trim(),
                        email: cleanEmail,
                        category_id: resolveCategoryId(row[7]),
                        category_name: String(row['category'] ?? '').trim() || null,
                        phone: String(row[2] ?? '').trim(),
                        bio: String(row[3] ?? '').trim(),
                        manifesto: String(row[4] ?? '').trim(),
                        slogan: String(row[5] ?? '').trim(),
                        position: row[6] ? parseInt(row[6]) : null,
                        photo: null,
                        photoPreview: null,
                        cover_photo: null,
                        coverPhotoPreview: null,
                    };
                })
                .filter(c => c.full_name);

            resolve(candidates);
        } catch {
            reject(new Error('Fichier invalide ou mal formaté'));
        }
    };
    reader.onerror = () => reject(new Error('Erreur de lecture du fichier'));
    reader.readAsArrayBuffer(file);
});

const Step2Candidats = ({ onNext, onPrevious, initialData = [], electionUuid = null, hasCategories = false, AcceptCandidature = false }) => {
    const [candidats, setCandidats] = useState(() => initialData);
    const [categories, setCategories] = useState([]);
    const [catLoading, setCatLoading] = useState(false);
    const [importMode, setImportMode] = useState('manual');
    const [importing, setImporting] = useState(false);
    const [importErrors, setImportErrors] = useState([]);
    const fileInputRef = useRef(null);

    // ── Import serveur (gros fichiers, asynchrone via ImportJob) ──
    const [pendingServerFile, setPendingServerFile] = useState(null);
    const [showServerSuggestion, setShowServerSuggestion] = useState(false);
    const [serverImportJobId, setServerImportJobId] = useState(null);
    const [serverImportStatus, setServerImportStatus] = useState(null);
    const [serverImportProgress, setServerImportProgress] = useState(0);
    const [serverImportResult, setServerImportResult] = useState(null);
    const pollIntervalRef = useRef(null);

    // Sous-étape catégories : 'categories' | 'candidats'
    const [subStep, setSubStep] = useState(hasCategories ? 'categories' : 'candidats');

    // Formulaire nouvelle catégorie
    const [newCat, setNewCat] = useState({ name: '', description: '', color: '#3B82F6' });
    const [catSubmitting, setCatSubmitting] = useState(false);

    const [newCandidat, setNewCandidat] = useState({
        full_name: '', email: '', phone: null, bio: '', manifesto: '', slogan: '',
        position: '', category_id: null,
        photo: null, photoPreview: null,
        cover_photo: null, coverPhotoPreview: null,
    });

    // ── Chargement des catégories de l'élection ---───
    useEffect(() => {
        if (!electionUuid) return;
        const fetchCategories = async () => {
            setCatLoading(true);
            try {
                const res = await electionsApi.getCategories(electionUuid);
                setCategories(res.data?.data ?? []);
            } catch {
                // non bloquant
            } finally {
                setCatLoading(false);
            }
        };
        fetchCategories();
    }, [electionUuid]);

    // ── Créer une catégorie pour cette élection ---───
    const handleAddCategory = async () => {
        if (!newCat.name.trim()) { toast.error('Le nom de la catégorie est requis.'); return; }
        setCatSubmitting(true);
        try {
            const res = await electionsApi.createCategory(electionUuid, newCat);
            const created = res.data?.data;
            setCategories(prev => [...prev, created]);
            setNewCat({ name: '', description: '', color: '#3B82F6' });
            toast.success(`Catégorie "${created.name}" créée.`);
        } catch (err) {
            toast.error(err.response?.data?.message ?? 'Erreur lors de la création.');
        } finally {
            setCatSubmitting(false);
        }
    };

    const handleDeleteCategory = async (cat) => {
        // Vérifier si des candidats utilisent cette catégorie
        const used = candidats.filter(c => c.category_id === cat.id).length;
        if (used > 0) {
            toast.error(`${used} candidat(s) utilisent cette catégorie. Désassignez-les d'abord.`);
            return;
        }
        try {
            await electionsApi.deleteCategory(electionUuid, cat.id);
            setCategories(prev => prev.filter(c => c.id !== cat.id));
            toast.success('Catégorie supprimée.');
        } catch (err) {
            toast.error(err.response?.data?.message ?? 'Erreur lors de la suppression.');
        }
    };

    const handleFieldChange = (e) => {
        const { name, value } = e.target;
        setNewCandidat(prev => ({ ...prev, [name]: value }));
    };

    const handlePhotoChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) { toast.error('La photo ne doit pas dépasser 5 Mo'); return; }
        const reader = new FileReader();
        reader.onloadend = () => setNewCandidat(prev => ({ ...prev, photo: file, photoPreview: reader.result }));
        reader.readAsDataURL(file);
    };

    const handleCoverPhotoChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) { toast.error('La photo de couverture ne doit pas dépasser 5 Mo'); return; }
        const reader = new FileReader();
        reader.onloadend = () => setNewCandidat(prev => ({ ...prev, cover_photo: file, coverPhotoPreview: reader.result }));
        reader.readAsDataURL(file);
    };

    const handleAddCandidat = () => {
        if (!newCandidat.full_name.trim()) {
            toast.error('Le prénom et le nom sont obligatoires');
            return;
        }

        if (hasCategories && !newCandidat.category_id) {
            toast.error('categorie est requise');
            return;
        }

        const email = newCandidat.email.trim().toLowerCase();
        if (email && candidats.some(c => (c.email ?? '').trim().toLowerCase() === email)) {
            toast.error('Un candidat avec cet email est déjà dans la liste.');
            return;
        }

        const categoryName = newCandidat.category_id
            ? (categories.find(c => String(c.id) === String(newCandidat.category_id))?.name ?? null)
            : null;
        setCandidats(prev => [...prev, {
            id: Date.now(),
            full_name: newCandidat.full_name.trim(),
            email: newCandidat.email.trim(),
            phone: newCandidat.phone || null,
            bio: newCandidat.bio.trim(),
            manifesto: newCandidat.manifesto.trim(),
            slogan: newCandidat.slogan.trim(),
            position: newCandidat.position ? Number.parseInt(newCandidat.position) : null,
            category_name: categoryName,
            category_id: newCandidat.category_id ? Number.parseInt(newCandidat.category_id) : null,
            photo: newCandidat.photo,
            photoPreview: newCandidat.photoPreview,
            cover_photo: newCandidat.cover_photo,
            coverPhotoPreview: newCandidat.coverPhotoPreview,
        }]);

        setNewCandidat({
            full_name: '', email: '', phone: null, bio: '', manifesto: '', slogan: '',
            position: '', category_id: '',
            photo: null, photoPreview: null,
            cover_photo: null, coverPhotoPreview: null,
        });
        toast.success('Candidat ajouté');
    };

    const handleRemoveCandidat = (id) => {
        setCandidats(prev => prev.filter(c => c.id !== id));
    };

    const [submittingCandidats, setSubmittingCandidats] = useState(false);

    const handleNext = async () => {
        if (candidats.length < 2 && !AcceptCandidature) {
            toast.error('Minimum 2 candidats requis');
            return;
        }

        if (!electionUuid) {
            toast.error('Élection introuvable. Revenez à l\'étape précédente.');
            return;
        }

        const toCreate = candidats.filter(c => !c.alreadyOnServer);

        if (toCreate.length === 0) {
            onNext({ candidats });
            return;
        }

        setSubmittingCandidats(true);

        const results = await Promise.allSettled(
            toCreate.map(async (c) => {
                const fd = new FormData();
                fd.append('full_name', `${c.full_name}`.trim());
                fd.append('email', `${c.email}`.trim());
                if (c.phone) fd.append('phone', c.phone);
                if (c.bio) fd.append('bio', c.bio);
                if (c.manifesto) fd.append('manifesto', c.manifesto);
                if (c.slogan) fd.append('slogan', c.slogan);
                if (c.position) fd.append('position', c.position);
                if (c.category_id) fd.append('category_id', Number.parseInt(c.category_id));

                if (c.photo && c.photo instanceof File) {
                    fd.append('photo', c.photo);
                }
                if (c.cover_photo && c.cover_photo instanceof File) {
                    fd.append('cover_photo', c.cover_photo);
                }
                const res = await candidatesApi.create(electionUuid, fd);
                return { localId: c.id, created: res.data?.data };
            })
        );

        setSubmittingCandidats(false);

        // On reconstruit la liste : succès → marqués alreadyOnServer (avec
        // l'uuid réel reçu), échecs → laissés tels quels pour correction.
        const succeededLocalIds = new Set();
        const failedNames = [];

        results.forEach((result, index) => {
            const candidat = toCreate[index];
            if (result.status === 'fulfilled') {
                succeededLocalIds.add(candidat.id);
            } else {
                const apiMessage = result.reason?.response?.data?.message;
                failedNames.push(`${candidat.full_name}${apiMessage ? ` (${apiMessage})` : ''}`);
            }
        });

        if (succeededLocalIds.size > 0) {
            setCandidats(prev => prev.map(c =>
                succeededLocalIds.has(c.id) ? { ...c, alreadyOnServer: true } : c
            ));
        }

        if (failedNames.length > 0) {
            toast.error(
                `${failedNames.length} candidat(s) n'ont pas pu être créés : ${failedNames.join(', ')}. Corrigez-les avant de continuer.`,
                { duration: 6000 }
            );
            return; // on reste sur Step2 — aucun passage à Step3
        }

        toast.success('Tous les candidats ont été créés avec succès.');
        onNext({ candidats: candidats.map(c => (succeededLocalIds.has(c.id) ? { ...c, alreadyOnServer: true } : c)) });
    };

    const getCategoryName = (id) => {
        const cat = categories.find(c => c.id === id);
        return cat?.name ?? null;
    };

    // Ajoute des candidats importés en écartant les doublons d'email (déjà
    // dans la liste, ou en double dans le fichier lui-même) : sans ce
    // filtre, un re-import du même fichier — ou un fichier contenant deux
    // fois la même adresse — envoie deux fois le même email au serveur, qui
    // n'en accepte qu'un seul ("email déjà pris") au moment de créer.
    const addImportedCandidats = (rows) => {
        const existingEmails = new Set(
            candidats.map(c => (c.email ?? '').trim().toLowerCase()).filter(Boolean)
        );
        const seenInFile = new Set();
        const deduped = [];
        let duplicateCount = 0;

        rows.forEach(c => {
            const email = (c.email ?? '').trim().toLowerCase();
            if (email && (existingEmails.has(email) || seenInFile.has(email))) {
                duplicateCount++;
                return;
            }
            if (email) seenInFile.add(email);
            deduped.push(c);
        });

        setCandidats(prev => [...prev, ...deduped]);

        if (duplicateCount > 0) {
            toast.error(
                `${duplicateCount} candidat(s) ignoré(s) car déjà présents dans la liste (email en double).`,
                { duration: 6000 }
            );
        }
        if (deduped.length > 0) {
            toast.success(`${deduped.length} candidat(s) importé(s) avec succès`);
        }
    };

    // ── Import CSV/Excel ---──
    const handleImportFile = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const allowed = [
            'text/csv',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ];
        if (!allowed.includes(file.type) && !file.name.match(/\.(csv|xlsx|xls)$/i)) {
            toast.error('Format non supporté. Utilisez CSV ou Excel.');
            return;
        }

        setImporting(true);
        setImportErrors([]);

        try {
            const parsed = await parseFile(file, categories);

            if (parsed.length === 0) {
                toast.error('Aucun candidat trouvé dans le fichier.');
                return;
            }

            if (parsed.length > SERVER_IMPORT_THRESHOLD) {
                setPendingServerFile(file);
                setShowServerSuggestion(true);
                return;
            }

            // Validation basique
            const errors = [];
            parsed.forEach((c, i) => {
                if (!c.full_name) {
                    errors.push(`Ligne ${i + 2} : Nom complet manquant`);
                }
            });

            if (errors.length > 0) {
                setImportErrors(errors.slice(0, 5));
                toast.error(`${errors.length} erreur(s) détectée(s)`);
            }

            const valid = parsed.filter(c => c.full_name);
            addImportedCandidats(valid);

        } catch (err) {
            toast.error(err.message ?? 'Erreur lors de l\'import');
        } finally {
            setImporting(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    // L'admin confirme malgré la suggestion : on parse quand même côté client.
    const continueClientImport = async () => {
        const file = pendingServerFile;
        setShowServerSuggestion(false);
        setPendingServerFile(null);
        if (!file) return;

        setImporting(true);
        try {
            const parsed = await parseFile(file, categories);
            const valid = parsed.filter(c => c.full_name);
            addImportedCandidats(valid);
        } catch (err) {
            toast.error(err.message ?? 'Erreur lors de l\'import');
        } finally {
            setImporting(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    // L'admin accepte la suggestion : upload réel + job asynchrone côté serveur.
    const startServerImport = async () => {
        const file = pendingServerFile;
        setShowServerSuggestion(false);
        if (!file || !electionUuid) return;

        setServerImportStatus('uploading');
        setServerImportProgress(0);
        setServerImportResult(null);

        try {
            const res = await candidatesApi.import(electionUuid, file, (pct) => {
                setServerImportProgress(pct);
            });

            const jobId = res.data?.data?.import_job_id;
            if (!jobId) throw new Error('Identifiant de job non reçu.');

            setServerImportJobId(jobId);
            setServerImportStatus('processing');
            toast.success("Import lancé. Le traitement se poursuit en arrière-plan.");

        } catch (err) {
            setServerImportStatus('failed');
            toast.error(err.response?.data?.message ?? 'Échec du démarrage de l\'import.');
        } finally {
            setPendingServerFile(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    // Recharge la liste des candidats déjà créés en base après un import serveur réussi.
    const refreshCandidatsFromServer = useCallback(async () => {
        if (!electionUuid) return;
        try {
            const res = await candidatesApi.getAll(electionUuid);
            const serverCandidats = (res.data?.data ?? []).map(c => ({
                id: c.uuid,
                uuid: c.uuid,
                full_name: c.full_name,
                email: c.email,
                phone: c.phone,
                bio: c.bio,
                manifesto: c.manifesto,
                slogan: c.slogan,
                position: c.position,
                category_id: c.category_id,
                photoPreview: c.photo,
                alreadyOnServer: true, // évite de recréer via candidatesApi.create() à la soumission finale
            }));
            setCandidats(prev => [...prev.filter(c => !c.alreadyOnServer), ...serverCandidats]);
        } catch {
            // non bloquant — l'admin verra les candidats au prochain chargement de Step4
        }
    }, [electionUuid]);

    // Polling du statut tant que le job est en cours.
    useEffect(() => {
        if (!serverImportJobId || !electionUuid) return;
        if (serverImportStatus !== 'processing') return;

        pollIntervalRef.current = setInterval(async () => {
            try {
                const res = await candidatesApi.importStatus(electionUuid, serverImportJobId);
                const data = res.data?.data;

                if (data.status === 'completed' || data.status === 'failed') {
                    clearInterval(pollIntervalRef.current);
                    setServerImportStatus(data.status);
                    setServerImportResult(data);

                    if (data.status === 'completed') {
                        toast.success(`${data.success_rows}/${data.total_rows} candidat(s) importé(s) avec succès.`);
                        refreshCandidatsFromServer();
                    } else {
                        toast.error("L'import a échoué. Consultez le détail ci-dessous.");
                    }
                } else {
                    setServerImportResult(data);
                }
            } catch {
                // on retentera au prochain tick
            }
        }, 2000);

        return () => clearInterval(pollIntervalRef.current);
    }, [serverImportJobId, serverImportStatus, electionUuid, refreshCandidatsFromServer]);

    // Recharge les candidats déjà créés en base à l'arrivée sur l'étape.
    // Nécessaire quand on reprend un brouillon (ex. après rechargement de
    // page) : l'état local repart de zéro alors que des candidats existent
    // déjà côté serveur, sinon on tente de les recréer → "email déjà pris".
    useEffect(() => {
        refreshCandidatsFromServer();
    }, [refreshCandidatsFromServer]);

    const downloadTemplate = () => {
        const headers = ['full_name', 'email', 'phone', 'bio', 'manifesto', 'slogan', 'position', 'category'];
        const example = [
            'user marie', 'user.marie@email.com', '+237612345678',
            'Candidat engagé pour le changement...', 'Mon programme détaillé...',
            'Pour un avenir meilleur', '1', '',
        ];
        const ws = XLSX.utils.aoa_to_sheet([headers, example]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Candidats');
        XLSX.writeFile(wb, 'modele_candidats.xlsx');
    };

    return (
        <div className="max-w-5xl mx-auto">

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-10">
                <div className="flex-1">
                    <p className="text-sm text-[var(--color-gray)]">ÉTAPE 2 SUR 4</p>
                    <h1 className="text-3xl font-semibold text-[var(--color-dark)] mt-1">Gestion des Candidats</h1>
                    <p className="text-[var(--color-gray)] mt-2">
                        Ajoutez les participants à cette élection. Chaque candidat peut avoir une catégorie.
                    </p>
                </div>
                <div className="shrink-0 text-left md:text-right">
                    <p className="text-[var(--color-primary)] font-medium">50% complété</p>
                    <div className="h-1.5 w-40 bg-[var(--color-gray-light)] rounded-full mt-2">
                        <div className="h-1.5 w-1/2 bg-[var(--color-primary)] rounded-full" />
                    </div>
                </div>
            </div>

            {/* ── Sous-étape catégories (optionnelle) ---─ */}
            {hasCategories && (
                <div className="bg-white rounded-[var(--radius-md)] shadow-sm p-6 mb-8">
                    {/* Barre de navigation sous-étapes */}
                    <div className="flex gap-3 mb-6">
                        <button type="button" onClick={() => setSubStep('categories')}
                            className={`flex-1 py-2.5 rounded-[var(--radius-md)] text-sm font-medium border transition
                                ${subStep === 'categories'
                                    ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)]'
                                    : 'bg-white text-[var(--color-gray)] border-[var(--color-gray-light)] hover:border-[var(--color-primary)]'}`}>
                            Catégories ({categories.length})
                        </button>
                        <button type="button" onClick={() => setSubStep('candidats')}
                            className={`flex-1 py-2.5 rounded-[var(--radius-md)] text-sm font-medium border transition
                                ${subStep === 'candidats'
                                    ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)]'
                                    : 'bg-white text-[var(--color-gray)] border-[var(--color-gray-light)] hover:border-[var(--color-primary)]'}`}>
                            Candidats ({candidats.length})
                        </button>
                    </div>

                    {/* Gestion des catégories */}
                    {subStep === 'categories' && (
                        <div className="space-y-6">
                            <div>
                                <h3 className="font-semibold text-[var(--color-dark)] mb-1">
                                    Créer une catégorie
                                </h3>
                                <p className="text-xs text-[var(--color-gray)] mb-4">
                                    Les candidats seront assignés à une catégorie. Les résultats seront calculés par catégorie.
                                </p>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <input
                                        type="text"
                                        placeholder="Nom de la catégorie *"
                                        value={newCat.name}
                                        onChange={e => setNewCat(prev => ({ ...prev, name: e.target.value }))}
                                        className="px-4 py-2.5 border border-[var(--color-gray-light)] rounded-[var(--radius-md)] focus:outline-none focus:border-[var(--color-primary)] text-sm"
                                    />
                                    <input
                                        type="text"
                                        placeholder="Description (optionnel)"
                                        value={newCat.description}
                                        onChange={e => setNewCat(prev => ({ ...prev, description: e.target.value }))}
                                        className="px-4 py-2.5 border border-[var(--color-gray-light)] rounded-[var(--radius-md)] focus:outline-none focus:border-[var(--color-primary)] text-sm"
                                    />
                                    <div className="flex gap-2">
                                        <div className="flex items-center gap-2">
                                            <label className="text-xs text-[var(--color-gray)]">Couleur</label>
                                            <input
                                                type="color"
                                                value={newCat.color}
                                                onChange={e => setNewCat(prev => ({ ...prev, color: e.target.value }))}
                                                className="w-8 h-8 rounded cursor-pointer border border-[var(--color-gray-light)]"
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={handleAddCategory}
                                            disabled={catSubmitting || !newCat.name.trim()}
                                            className="flex-1 btn-primary text-sm font-medium flex items-center justify-center gap-1 disabled:opacity-50"
                                        >
                                            {catSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                                            Ajouter
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Liste des catégories */}
                            {(() => {
                                if (catLoading) {
                                    return (<div className="flex items-center justify-center py-20">
                                        <FadeLoader size={32} className=" text-[var(--color-primary)] mx-auto" />
                                        <p>Chargement...</p>
                                    </div>
                                    );
                                }
                                if (categories.length === 0) {
                                    return (
                                        <p className="text-sm text-[var(--color-gray)] text-center py-4">
                                            Aucune catégorie créée pour cette élection.
                                        </p>
                                    )
                                }
                                return (
                                    <div className="space-y-2">
                                        {categories.map(cat => (
                                            <div key={cat.id}
                                                className="flex items-center gap-3 bg-gray-50 px-4 py-3 rounded-[var(--radius-md)]">
                                                <div
                                                    className="w-3 h-3 rounded-full shrink-0"
                                                    style={{ backgroundColor: cat.color ?? '#3B82F6' }}
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium text-sm text-[var(--color-dark)]">{cat.name}</p>
                                                    {cat.description && (
                                                        <p className="text-xs text-[var(--color-gray)] truncate">{cat.description}</p>
                                                    )}
                                                </div>
                                                <span className="text-xs text-[var(--color-gray)]">
                                                    {candidats.filter(c => c.category_id === cat.id).length} candidat(s)
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => handleDeleteCategory(cat)}
                                                    className="text-[var(--color-gray)] hover:text-red-600 transition p-1"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )
                            })()}
                            <div className="flex justify-end">
                                <button
                                    type="button"
                                    onClick={() => setSubStep('candidats')}
                                    className="btn-primary flex items-center gap-2 text-sm font-medium"
                                >
                                    Continuer vers les candidats <ArrowRight size={16} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Section candidats — visible si subStep = 'candidats' ou pas de catégories */}
            {(subStep === 'candidats' || !hasCategories) && (
                <>

                    {/* ── Sélecteur de mode --------------------*/}
                    <div className="flex gap-3 mb-8">
                        <button
                            type="button"
                            onClick={() => setImportMode('manual')}
                            className={`flex-1 py-3 rounded-[var(--radius-md)] text-sm font-medium border transition
                        ${importMode === 'manual'
                                    ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)]'
                                    : 'bg-white text-[var(--color-gray)] border-[var(--color-gray-light)] hover:border-[var(--color-primary)]'}`}
                        >
                            Saisie manuelle
                        </button>
                        <button
                            type="button"
                            onClick={() => setImportMode('import')}
                            className={`flex-1 py-3 rounded-[var(--radius-md)] text-sm font-medium border transition
                        ${importMode === 'import'
                                    ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)]'
                                    : 'bg-white text-[var(--color-gray)] border-[var(--color-gray-light)] hover:border-[var(--color-primary)]'}`}
                        >
                            Import CSV / Excel
                        </button>
                    </div>

                    {/* ── Zone d'import -----------------------*/}
                    {importMode === 'import' && (
                        <div className="bg-white rounded-[var(--radius-md)] shadow-sm p-8 mb-8">
                            <h2 className="text-xl font-semibold mb-2">Import de candidats</h2>
                            <p className="text-sm text-[var(--color-gray)] mb-6">
                                Colonnes attendues (dans l'ordre) :
                                <span className="font-medium text-[var(--color-dark)]"> Nom complet · Email · Téléphone · Bio · Manifeste · Slogan · Position · Catégorie</span>
                            </p>

                            {/* Bouton télécharger modèle */}
                            <button
                                type="button"
                                onClick={downloadTemplate}
                                className="flex items-center gap-2 text-sm text-[var(--color-primary)] hover:underline mb-6"
                            >
                                <FileSpreadsheet size={16} />
                                Télécharger le modèle Excel
                            </button>

                            {/* Zone de dépôt */}
                            <div
                                className="border-2 border-dashed border-[var(--color-gray-light)] rounded-[var(--radius-md)] p-10 text-center hover:border-[var(--color-primary)] transition cursor-pointer"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <Upload size={36} className="mx-auto text-[var(--color-gray)] mb-3" />
                                <p className="font-medium text-[var(--color-dark)]">
                                    {importing ? 'Import en cours...' : 'Cliquez ou glissez un fichier ici'}
                                </p>
                                <p className="text-xs text-[var(--color-gray)] mt-1">CSV, XLS, XLSX — max 5 Mo</p>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".csv,.xlsx,.xls"
                                    onChange={handleImportFile}
                                    className="hidden"
                                />
                            </div>

                            {/* Erreurs d'import */}
                            {importErrors.length > 0 && (
                                <div className="mt-4 bg-red-50 border border-red-200 rounded-[var(--radius-md)] p-4">
                                    <p className="text-sm font-medium text-red-700 flex items-center gap-2 mb-2">
                                        <AlertCircle size={14} /> Erreurs détectées
                                    </p>
                                    <ul className="space-y-1">
                                        {importErrors.map((err, i) => (
                                            <li key={i} className="text-xs text-red-600">{err}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Suggestion d'import serveur pour les gros fichiers */}
                            {showServerSuggestion && (
                                <div className="mt-4 bg-blue-50 border border-blue-200 rounded-[var(--radius-md)] p-5">
                                    <div className="flex items-start gap-3">
                                        <ServerCog size={20} className="text-blue-600 shrink-0 mt-0.5" />
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-blue-900 mb-1">
                                                Fichier volumineux détecté
                                            </p>
                                            <p className="text-xs text-blue-800 mb-3">
                                                Ce fichier contient plus de {SERVER_IMPORT_THRESHOLD} candidats.
                                                Nous recommandons l'import serveur : plus robuste, traité en
                                                arrière-plan, sans surcharger votre navigateur.
                                            </p>
                                            <div className="flex gap-3">
                                                <button
                                                    type="button"
                                                    onClick={startServerImport}
                                                    disabled={!electionUuid}
                                                    className="btn-primary text-xs font-medium px-4 py-2 disabled:opacity-50"
                                                    title={!electionUuid ? "Élection non encore créée" : ""}
                                                >
                                                    Utiliser l'import serveur (recommandé)
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={continueClientImport}
                                                    className="text-xs font-medium px-4 py-2 text-blue-700 hover:underline"
                                                >
                                                    Continuer quand même ici
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Suivi de l'import serveur en cours */}
                            {serverImportStatus && (
                                <div className="mt-4 bg-gray-50 border border-[var(--color-gray-light)] rounded-[var(--radius-md)] p-5">
                                    {serverImportStatus === 'uploading' && (
                                        <div className="flex items-center gap-3">
                                            <Loader2 size={18} className="animate-spin text-[var(--color-primary)]" />
                                            <p className="text-sm text-[var(--color-dark)]">
                                                Envoi du fichier... {serverImportProgress}%
                                            </p>
                                        </div>
                                    )}

                                    {serverImportStatus === 'processing' && (
                                        <div className="flex items-center gap-3">
                                            <FadeLoader size={18} className="text-[var(--color-primary)]" />
                                            <div>
                                                <p className="text-sm text-[var(--color-dark)]">
                                                    Traitement en cours sur le serveur...
                                                </p>
                                                {serverImportResult?.total_rows > 0 && (
                                                    <p className="text-xs text-[var(--color-gray)] mt-1">
                                                        {serverImportResult.success_rows ?? 0} / {serverImportResult.total_rows} lignes traitées
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {serverImportStatus === 'completed' && serverImportResult && (
                                        <div>
                                            <div className="flex items-center gap-3 mb-2">
                                                <CheckCircle2 size={18} className="text-green-600" />
                                                <p className="text-sm font-medium text-green-700">
                                                    Import terminé : {serverImportResult.success_rows}/{serverImportResult.total_rows} candidat(s) créé(s)
                                                </p>
                                            </div>
                                            {serverImportResult.failed_rows > 0 && (
                                                <p className="text-xs text-amber-700">
                                                    {serverImportResult.failed_rows} ligne(s) en échec — voir les détails dans le tableau de bord.
                                                </p>
                                            )}
                                        </div>
                                    )}

                                    {serverImportStatus === 'failed' && (
                                        <div className="flex items-center gap-3">
                                            <AlertCircle size={18} className="text-red-600" />
                                            <p className="text-sm text-red-700">
                                                L'import serveur a échoué. Réessayez ou utilisez la saisie manuelle.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    <div className={`grid grid-cols-1 lg:grid-cols-2 gap-8 ${importMode === 'import' ? 'lg:grid-cols-1' : ''}`}>

                        {/* Formulaire d'ajout — masqué en mode import */}
                        {importMode === 'manual' && (
                            <div className="bg-[var(--color-white)] rounded-[var(--radius-md)] shadow-sm p-8">
                                <h2 className="text-xl font-semibold mb-6">Nouveau Candidat</h2>

                                {/* Photo */}
                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-[var(--color-gray)] mb-2">
                                        Photo du candidat
                                    </label>
                                    <div className="flex items-center gap-4">
                                        <div className="w-24 h-24 rounded-[var(--radius-md)] border-2 border-dashed border-[var(--color-gray-light)] flex items-center justify-center overflow-hidden">
                                            {newCandidat.photoPreview ? (
                                                <img src={newCandidat.photoPreview} alt="Preview" className="w-full h-full object-cover" />
                                            ) : (
                                                <Camera size={32} className="text-[var(--color-gray)]" />
                                            )}
                                        </div>
                                        <label className="cursor-pointer bg-blue-50 hover:bg-blue-100 text-[var(--color-primary)] px-5 py-2.5 rounded-xl text-sm font-medium transition-colors">
                                            Choisir une image
                                            <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                                        </label>
                                    </div>
                                </div>

                                {/* Nom & Prénom */}
                                <div className=" mb-4">
                                    <TextInput
                                        label="Nom et Prénom"
                                        type="text"
                                        name="full_name"
                                        value={newCandidat.full_name}
                                        iconLeft={User}
                                        onChange={handleFieldChange}
                                        placeholder="Ex: Tekeu Toto"
                                        required
                                    />
                                </div>
                                <div className="mb-4">
                                    <TextInput
                                        label="Email"
                                        type="email"
                                        name="email"
                                        value={newCandidat.email}
                                        onChange={handleFieldChange}
                                        placeholder="Ex: candidate@email.com"
                                        required
                                    />
                                </div>
                                <div className="mb-4">
                                    <TextInput
                                        label="telephone"
                                        type="tel"
                                        name="phone"
                                        value={newCandidat.phone}
                                        onChange={handleFieldChange}
                                        placeholder="237 6 xx xx xx xx"
                                    />
                                </div>

                                {/* Catégorie — liée au candidat */}
                                {categories.length > 0 && (
                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-[var(--color-dark)] mb-2 flex items-center gap-2">
                                            <Tag size={14} /> Catégorie*
                                        </label>
                                        <select name="category_id" value={newCandidat.category_id}
                                            onChange={handleFieldChange}
                                            className="w-full px-4 py-3 border border-[var(--color-gray-light)] rounded-[var(--radius-md)] focus:outline-none focus:border-[var(--color-primary)] bg-white text-sm">
                                            <option value="">Sans catégorie</option>
                                            {categories.map(cat => (
                                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                                {/* Slogan */}
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-[var(--color-dark)] mb-2">
                                        Slogan (optionnel)
                                    </label>
                                    <input type="text" name="slogan" value={newCandidat.slogan}
                                        onChange={handleFieldChange} maxLength={200}
                                        placeholder="Ex: Pour un avenir meilleur"
                                        className="w-full px-4 py-3 border border-[var(--color-gray-light)] rounded-[var(--radius-md)] focus:outline-none focus:border-[var(--color-primary)] text-sm" />
                                </div>

                                {/* Bio */}
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-[var(--color-gray)] mb-2">
                                        Biographie courte
                                    </label>
                                    <textarea name="bio" value={newCandidat.bio}
                                        onChange={handleFieldChange}
                                        placeholder="Présentation en quelques mots..."
                                        rows={3}
                                        className="w-full px-4 py-3 border border-[var(--color-gray-light)] rounded-xl focus:outline-none focus:border-blue-500 resize-y text-sm" />
                                </div>

                                {/* Manifeste */}
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-[var(--color-gray)] mb-2">
                                        Programme / Manifeste (optionnel)
                                    </label>
                                    <textarea name="manifesto" value={newCandidat.manifesto}
                                        onChange={handleFieldChange}
                                        placeholder="Détaillez le programme du candidat..."
                                        rows={4}
                                        className="w-full px-4 py-3 border border-[var(--color-gray-light)] rounded-xl focus:outline-none focus:border-blue-500 resize-y text-sm" />
                                </div>

                                {/* Photo de couverture */}
                                <div className="mb-8">
                                    <label className="block text-sm font-medium text-[var(--color-dark)] mb-2">
                                        Photo de couverture (optionnel)
                                    </label>
                                    <div className="border-2 border-dashed border-[var(--color-gray-light)] rounded-[var(--radius-md)] p-4 text-center hover:border-[var(--color-primary)] transition cursor-pointer">
                                        {newCandidat.coverPhotoPreview && (
                                            <img src={newCandidat.coverPhotoPreview} alt="Couverture"
                                                className="w-full h-24 object-cover rounded-[var(--radius-md)] mb-2" />
                                        )}
                                        <label className="cursor-pointer text-sm text-[var(--color-primary)] hover:underline">
                                            {newCandidat.coverPhotoPreview ? 'Changer la couverture' : 'Ajouter une photo de couverture'}
                                            <input type="file" accept="image/*" onChange={handleCoverPhotoChange} className="hidden" />
                                        </label>
                                        <p className="text-xs text-[var(--color-gray)] mt-1">Max 5 Mo</p>
                                    </div>
                                </div>

                                <button
                                    onClick={handleAddCandidat}
                                    className="w-full btn-primary text-[var(--color-white)] font-medium flex items-center justify-center gap-2"
                                >
                                    <Plus size={20} /> Ajouter à la liste
                                </button>
                            </div>
                        )} {/* fin importMode === 'manual' */}

                        {/* Liste des candidats */}
                        <div className="bg-[var(--color-white)] rounded-[var(--radius-md)] shadow-sm p-8">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-semibold">
                                    Candidats ({candidats.length})
                                </h2>
                                <p className="text-sm text-[var(--color-gray)]">
                                    {AcceptCandidature ? 'Optionnel (candidatures ouvertes)' : 'Minimum : 2'}
                                </p>
                            </div>

                            <div className="space-y-4 max-h-[520px] overflow-y-auto pr-2">
                                {candidats.length > 0 ? candidats.map((c) => (
                                    <div key={c.id} className="flex items-center gap-4 bg-gray-50 p-4 rounded-[var(--radius-md)] group">
                                        {/* Avatar */}
                                        <div className="w-14 h-14 rounded-full overflow-hidden bg-[var(--color-gray-light)] flex-shrink-0">
                                            {c.photoPreview ? (
                                                <img src={c.photoPreview} alt={c.full_name} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <User size={28} className="text-[var(--color-gray)]" />
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-[var(--color-dark)] truncate flex items-center gap-2">
                                                {c.full_name}
                                                {c.alreadyOnServer ? (
                                                    <CheckCircle2 size={14} className="text-green-600 shrink-0" title="Créé en base" />
                                                ) : (
                                                    <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full shrink-0">
                                                        En attente
                                                    </span>
                                                )}
                                            </p>
                                            {c.category_id && (
                                                <span className="inline-flex items-center gap-1 text-xs text-[var(--color-primary)] bg-blue-50 px-2 py-0.5 rounded-full mt-0.5">
                                                    <Tag size={10} /> {getCategoryName(c.category_id)}
                                                </span>
                                            )}
                                            {c.bio && (
                                                <p className="text-sm text-[var(--color-gray)] line-clamp-1 mt-0.5">{c.bio}</p>
                                            )}
                                        </div>

                                        <button
                                            onClick={() => handleRemoveCandidat(c.id)}
                                            className="p-2 text-[var(--color-gray)] hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                )) : (
                                    <div className="text-center py-12 text-[var(--color-gray)]">
                                        {AcceptCandidature
                                            ? 'Aucun candidat ajouté. Les candidats s\'inscriront eux-mêmes via la page de candidature — vous pourrez passer à l\'étape suivante.'
                                            : 'Aucun candidat ajouté pour le moment'}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Navigation */}
                    <div className="flex flex-col sm:flex-row justify-between mt-10 gap-4">
                        <button onClick={onPrevious} disabled={submittingCandidats} className="flex items-center gap-2 px-6 py-3 btn-secondary font-medium disabled:opacity-50">
                            <ArrowLeft size={20} /> Précédent
                        </button>
                        <button
                            onClick={handleNext}
                            disabled={(candidats.length < 2 && !AcceptCandidature) || submittingCandidats}
                            className="flex items-center gap-2 btn-primary font-medium disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                        >
                            {submittingCandidats ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" />
                                    Création des candidats...
                                </>
                            ) : (
                                <>
                                    Continuer vers l'étape 3 <ArrowRight size={20} />
                                </>
                            )}
                        </button>
                    </div>

                </> /* fin subStep === 'candidats' */
            )}

        </div>
    );
};

Step2Candidats.propTypes = {
    onNext: PropTypes.func.isRequired,
    onPrevious: PropTypes.func.isRequired,
    initialData: PropTypes.array,
    electionUuid: PropTypes.string,
    hasCategories: PropTypes.bool,
};

export default Step2Candidats;
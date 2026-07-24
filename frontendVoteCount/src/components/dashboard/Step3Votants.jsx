// components/dashboard/Step3Votants.jsx
import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import {
    ArrowLeft, ArrowRight, Upload, Download,
    Users, Lock, Mail, MessageSquare, Plus,
    Trash2, User, Phone, Info
} from 'lucide-react';
import TextInput from '../ui/TextInput';
import toast from 'react-hot-toast';
import { usePapaParse } from 'react-papaparse';
import * as XLSX from 'xlsx';
import { electorsApi } from '@services/api';

/**
 * Step3Votants
 *
 * Comportement selon le type d'élection (prop electionMode) :
 *
 *   'public'     → Aucune liste d'électeurs requise.
 *                  On affiche juste les paramètres d'authentification.
 *                  Le composant peut passer directement à Step4.
 *
 *   'private'    → Liste d'électeurs OBLIGATOIRE.
 *                  Import CSV/Excel ou saisie manuelle requis.
 *
 *   'restricted' → Liste d'électeurs recommandée mais non bloquante.
 */
const Step3Votants = ({ onNext, onPrevious, initialData = {}, electionMode = 'public', verificationMode = 'none', electionUuid }) => {
    const { readString } = usePapaParse();

    const isPublic = electionMode === 'public';
    const isPrivate = electionMode === 'private';
    const isRestricted = electionMode === 'restricted';

    const [importMethod, setImportMethod] = useState(initialData.importMethod || 'grouped');

    const [uploadedFile, setUploadedFile] = useState(initialData.uploadedFile || null);

    // Mode groupé
    const [uploadedFileName, setUploadedFileName] = useState(initialData.uploadedFileName || '');
    const [previewCount, setPreviewCount] = useState(initialData.previewCount || 0);
    const [parsedVotants, setParsedVotants] = useState(initialData.parsedVotants || []);

    const [importing, setImporting] = useState(false);
    const [importProgress, setImportProgress] = useState(0);
    const [importedCount, setImportedCount] = useState(0);
    const [importErrors, setImportErrors] = useState([]);
    const [importJobId, setImportJobId] = useState(null);
    const pollIntervalRef = useRef(null);

    const [existingElectorsCount, setExistingElectorsCount] = useState(0);

    useEffect(() => {
        if (!electionUuid) return;
        let cancelled = false;
        electorsApi.getAll(electionUuid, { per_page: 1 })
            .then(res => {
                if (!cancelled) setExistingElectorsCount(res.data?.meta?.total ?? 0);
            })
            .catch(() => {
                // non bloquant
            });
        return () => { cancelled = true; };
    }, [electionUuid]);

    // Mode saisie manuelle
    const [manualVotants, setManualVotants] = useState(initialData.manualVotants || []);
    const [newVotant, setNewVotant] = useState({ nom: '', email: '', telephone: '' });
    const [currentPageManual, setCurrentPageManual] = useState(1);
    const itemsPerPage = 10;



    // ── Mode groupé : Excel/CSV ────────────────────────────────────────
    const downloadTemplate = () => {
        // Données du template
        const headers = ['full_name', 'email', 'phone'];
        const exampleData = [
            'votant1 jean',
            'votant1.jean@email.com',
            '+237612345678'
        ];
        const exampleData2 = [
            'Marie Rose',
            'marierose@gmail.com',
            '+237655443322'
        ];

        // Créer le workbook Excel
        const wsData = [
            headers,
            exampleData,
            exampleData2
        ];

        const ws = XLSX.utils.aoa_to_sheet(wsData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Votants');

        // Définir la largeur des colonnes
        ws['!cols'] = [
            { wch: 25 },
            { wch: 30 },
            { wch: 20 }
        ];

        // Télécharger le fichier
        XLSX.writeFile(wb, 'modele_import_votants.xlsx');
    };

    const normalizeErrors = (errors) => {
        if (!errors) return [];
        if (Array.isArray(errors)) {
            return errors.map(e => (typeof e === 'string' ? e : e.error_message ?? JSON.stringify(e)));
        }
        if (typeof errors === 'object') {
            return Object.values(errors).flat();
        }
        return [String(errors)];
    };

    const importElectors = async (file) => {
        if (!electionUuid) {
            toast.error('Élection introuvable. Veuillez recommencer.');
            return false;
        }

        setImporting(true);
        setImportProgress(0);
        setImportErrors([]);

        try {
            const response = await electorsApi.import(electionUuid, file, true, (progress) => {
                setImportProgress(progress);
            });

            const jobId = response.data?.data?.import_job_id;
            if (!jobId) throw new Error('Identifiant de job non reçu.');

            setImportJobId(jobId);
            toast.success('Import lancé, traitement en cours...');
            return true;
        } catch (error) {
            console.error('Import error:', error);
            const message = error.response?.data?.message || 'Erreur lors de l\'import';
            toast.error(message);
            setImportErrors(normalizeErrors(error.response?.data?.errors));
            setImporting(false);
            return false;
        }
    };

    // Polling du statut tant que le job est en cours.
    useEffect(() => {
        if (!importJobId || !electionUuid) return;

        pollIntervalRef.current = setInterval(async () => {
            try {
                const res = await electorsApi.importStatus(electionUuid, importJobId);
                const data = res.data?.data;

                if (data.status === 'completed' || data.status === 'failed') {
                    clearInterval(pollIntervalRef.current);
                    setImporting(false);
                    setImportJobId(null);

                    if (data.status === 'completed' && data.success_rows > 0) {
                        setImportedCount(data.success_rows);
                        setPreviewCount(data.success_rows);
                        toast.success(`${data.success_rows} électeur(s) importé(s) avec succès !`);

                        if (data.failed_rows > 0) {
                            setImportErrors(normalizeErrors(data.errors));
                            toast.error(`${data.failed_rows} ligne(s) en erreur.`);
                        }
                    } else {
                        setImportErrors(normalizeErrors(data.errors));
                        toast.error('Aucun électeur importé.');
                    }
                }
            } catch {
                // on retentera au prochain tick
            }
        }, 2000);

        return () => clearInterval(pollIntervalRef.current);
    }, [importJobId, electionUuid]);

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploadedFileName(file.name);
        setUploadedFile(file);
        if (electionUuid) {
            await importElectors(file);
        } else {
            // Lire le fichier Excel
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const data = new Uint8Array(event.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });
                    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                    const jsonData = XLSX.utils.sheet_to_json(firstSheet);

                    // Vérifier les colonnes
                    const validRows = jsonData.filter(row => {
                        // Colonnes en français
                        const nomFr = row['Nom complet'] || row['nom complet'] || row['Nom'];
                        const emailFr = row['Email'] || row['email'];

                        // Colonnes en anglais
                        const nomEn = row['full_name'] || row['Full Name'];
                        const emailEn = row['email'] || row['Email'];

                        const nom = nomFr || nomEn;
                        const email = emailFr || emailEn;

                        return nom && email;
                    });

                    //  Transformer les données pour les normaliser
                    const normalizedRows = validRows.map(row => {
                        const nom = row['Nom complet'] || row['nom complet'] || row['Nom'] || row['full_name'] || row['Full Name'] || '';
                        const email = row['Email'] || row['email'] || '';
                        const phone = row['Téléphone'] || row['telephone'] || row['phone'] || row['Phone'] || '';

                        return {
                            nom: String(nom).trim(),
                            email: String(email).trim().toLowerCase(),
                            telephone: String(phone).trim()
                        };
                    });
                    setParsedVotants(normalizedRows);
                    setPreviewCount(normalizedRows.length);

                    if (normalizedRows.length > 0) {
                        toast.success(`${normalizedRows.length} votant(s) valide(s) détecté(s)`);
                    } else {
                        toast.error('Aucun votant valide trouvé. Vérifiez les colonnes "Nom complet" et "Email".');
                    }
                } catch (error) {
                    toast.error('Erreur lors de la lecture du fichier Excel');
                    console.error(error);
                }
            };
            reader.readAsArrayBuffer(file);
        }
    };

    // ── Mode saisie manuelle ─────────────────────────────────────

    const handleAddVotant = async () => {
        if (!newVotant.nom.trim() || !newVotant.email.trim()) {
            toast.error('Nom et email sont obligatoires');
            return;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newVotant.email)) {
            toast.error('Email invalide');
            return;
        }
        if (electionUuid) {
            try {
                await electorsApi.create(electionUuid, {
                    full_name: newVotant.nom.trim(),
                    email: newVotant.email.trim(),
                    phone: newVotant.telephone || null,
                });

                toast.success('Électeur ajouté avec succès !');
                setManualVotants(prev => [...prev, { id: Date.now(), ...newVotant }]);
                setNewVotant({ nom: '', email: '', telephone: '' });
            } catch (error) {
                const message = error.response?.data?.message || 'Erreur lors de l\'ajout';
                toast.error(message);
            }
        } else {
            // Sinon, stocker localement
            setManualVotants(prev => [...prev, { id: Date.now(), ...newVotant }]);
            setNewVotant({ nom: '', email: '', telephone: '' });
            toast.success('Électeur ajouté localement');
        }
    };

    const handleRemoveVotant = (id) => {
        setManualVotants(prev => prev.filter(v => v.id !== id));
    };

    const totalManualPages = Math.ceil(manualVotants.length / itemsPerPage);
    const paginatedManual = manualVotants.slice(
        (currentPageManual - 1) * itemsPerPage,
        currentPageManual * itemsPerPage
    );

    // ── Navigation ───────────────────────────────────────────────

    const handleNext = () => {
        if (importing) {
            toast.error("Import en cours, veuillez patienter avant de continuer.");
            return;
        }

        if (isPrivate) {
            const hasGroupedData = importMethod === 'grouped'
                ? (previewCount > 0 || existingElectorsCount > 0)
                : (manualVotants.length > 0 || existingElectorsCount > 0);

            if (!hasGroupedData) {
                toast.error("Une élection privée requiert au moins un électeur créé dans la liste");
                return;
            }
        }

        const totalVotants = existingElectorsCount + (importMethod === 'grouped'
            ? previewCount
            : manualVotants.length);

        onNext({
            importMethod,
            totalVotants,
            uploadedFile: importMethod === 'grouped' ? uploadedFile : null,
            parsedVotants: importMethod === 'grouped' ? parsedVotants : [],
            manualVotants: importMethod === 'manual' ? manualVotants : [],
            uploadedFileName: importMethod === 'grouped' ? uploadedFileName : '',
            previewCount: importMethod === 'grouped' ? previewCount : manualVotants.length,
        });
    };

    return (
        <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-10">
                <div className="flex-1">
                    <p className="text-sm text-[var(--color-gray)]">ÉTAPE 3 SUR 4</p>
                    <h1 className="text-3xl font-semibold text-[var(--color-dark)] mt-1">Paramètres des Votants</h1>
                </div>
                <div className="shrink-0 text-left md:text-right">
                    <p className="text-[var(--color-primary)] font-medium">75% complété</p>
                    <div className="h-1.5 w-40 bg-[var(--color-gray-light)] rounded-full mt-2">
                        <div className="h-1.5 w-3/4 bg-[var(--color-primary)] rounded-full" />
                    </div>
                </div>
            </div>

            <div className="space-y-10">

                {/* ── Bandeau informatif selon le type ── */}
                {isPublic && (
                    <div className="flex items-start gap-3 p-5 bg-blue-50 border border-blue-200 rounded-[var(--radius-md)]">
                        <Info size={20} className="text-blue-600 shrink-0 mt-0.5" />
                        <div>
                            <p className="font-medium text-blue-800">Élection publique — liste d'électeurs non requise</p>
                            <p className="text-sm text-blue-700 mt-1">
                                Tout le monde peut voter sur cette élection. Vous pouvez configurer les méthodes d'authentification ci-dessous, ou passer directement à l'étape 4.
                            </p>
                        </div>
                    </div>
                )}
                {isPrivate && (
                    <div className="flex items-start gap-3 p-5 bg-amber-50 border border-amber-200 rounded-[var(--radius-md)]">
                        <Lock size={20} className="text-amber-600 shrink-0 mt-0.5" />
                        <div>
                            <p className="font-medium text-amber-800">Élection privée — liste d'électeurs obligatoire</p>
                            <p className="text-sm text-amber-700 mt-1">
                                Seuls les électeurs présents dans la liste pourront voter. Importez ou saisissez la liste ci-dessous.
                            </p>
                        </div>
                    </div>
                )}

                {isRestricted && (
                    <div className="flex items-start gap-3 p-5 bg-gray-50 border border-gray-200 rounded-[var(--radius-md)]">
                        <Users size={20} className="text-gray-600 shrink-0 mt-0.5" />
                        <div>
                            <p className="font-medium text-gray-800">Élection restreinte</p>
                            <p className="text-sm text-gray-600 mt-1">
                                L'accès se fait via un lien ou code. Vous pouvez optionnellement pré-définir une liste d'électeurs autorisés.
                            </p>
                        </div>
                    </div>
                )}

                {!isPublic && existingElectorsCount > 0 && (
                    <div className="flex items-start gap-3 p-5 bg-green-50 border border-green-200 rounded-[var(--radius-md)]">
                        <Users size={20} className="text-green-600 shrink-0 mt-0.5" />
                        <p className="text-sm text-green-800">
                            <span className="font-medium">{existingElectorsCount} électeur(s)</span> déjà enregistré(s) pour cette élection. Vous pouvez continuer sans réimporter, ou ajouter des électeurs supplémentaires ci-dessous.
                        </p>
                    </div>
                )}

                {/* ── Section liste électorale — masquée si public ── */}
                {!isPublic && (
                    <div className="bg-white rounded-[var(--radius-md)] shadow-sm p-8">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                <Users size={20} />
                            </div>
                            <h2 className="text-xl font-semibold">
                                Liste électorale
                                {isPrivate && <span className="ml-2 text-sm text-red-500 font-normal">* Obligatoire</span>}
                            </h2>
                        </div>

                        <div className="space-y-5">
                            {/* Importation groupée */}
                            <div
                                onClick={() => setImportMethod('grouped')}
                                className={`p-6 border-2 rounded-[var(--radius-md)] cursor-pointer transition-all
                                    ${importMethod === 'grouped'
                                        ? 'border-[var(--color-primary)] bg-blue-50'
                                        : 'border-[var(--color-gray-light)] hover:border-gray-300'}`}
                            >
                                <div className="flex items-start gap-4">
                                    <input type="radio" checked={importMethod === 'grouped'} readOnly className="mt-1.5" />
                                    <div className="flex-1">
                                        <p className="font-semibold text-lg">Importation groupée (CSV)</p>
                                        <p className="text-[var(--color-gray)] mt-1 text-sm">
                                            Importez rapidement des centaines d'électeurs depuis un fichier.
                                        </p>
                                        <div className="mt-4 flex flex-wrap gap-3">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); downloadTemplate(); }}
                                                className="flex items-center gap-2 text-[var(--color-primary)] text-sm font-medium"
                                            >
                                                <Download size={16} /> Télécharger le modèle
                                            </button>
                                            <label className="flex items-center gap-2 text-[var(--color-primary)] text-sm font-medium cursor-pointer">
                                                <Upload size={16} /> Importer un fichier
                                                <input
                                                    type="file"
                                                    accept=".csv,.xlsx,.xls"
                                                    onChange={handleFileUpload}
                                                    className="hidden"
                                                />
                                            </label>
                                        </div>
                                        {uploadedFileName && (
                                            <p className="mt-3 text-green-600 text-sm">
                                                ✓ {uploadedFileName} — {previewCount} votant(s) valide(s)
                                            </p>
                                        )}

                                        {importing && (
                                            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-[var(--radius-md)]">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-sm font-medium text-blue-700">
                                                        Import en cours...
                                                    </span>
                                                    <span className="text-sm text-blue-700">{importProgress}%</span>
                                                </div>
                                                <div className="w-full h-2 bg-blue-100 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-blue-600 rounded-full transition-all duration-300"
                                                        style={{ width: `${importProgress}%` }}
                                                    />
                                                </div>
                                                {importedCount > 0 && (
                                                    <p className="text-sm text-blue-700 mt-2">
                                                        {importedCount} électeur(s) importé(s) avec succès
                                                    </p>
                                                )}
                                            </div>
                                        )}

                                        {importErrors.length > 0 && (
                                            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-[var(--radius-md)]">
                                                <p className="text-sm font-medium text-red-700 mb-2">
                                                    {importErrors.length} erreur(s) :
                                                </p>
                                                <ul className="text-xs text-red-600 space-y-1 max-h-32 overflow-y-auto">
                                                    {importErrors.map((err, index) => (
                                                        <li key={index}>• {err}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Saisie manuelle */}
                            <div
                                onClick={() => setImportMethod('manual')}
                                className={`p-6 border-2 rounded-[var(--radius-md)] cursor-pointer transition-all
                                    ${importMethod === 'manual'
                                        ? 'border-[var(--color-primary)] bg-blue-50'
                                        : 'border-[var(--color-gray-light)] hover:border-gray-300'}`}
                            >
                                <div className="flex items-start gap-4">
                                    <input type="radio" checked={importMethod === 'manual'} readOnly className="mt-1.5" />
                                    <div className="flex-1">
                                        <p className="font-semibold text-lg">Saisie manuelle</p>
                                        <p className="text-[var(--color-gray)] text-sm mt-1">Ajoutez les votants un par un.</p>

                                        {importMethod === 'manual' && (
                                            <>
                                                {/* Formulaire */}
                                                <div className="mt-5 p-5 border border-[var(--color-gray-light)] rounded-[var(--radius-md)]">
                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                        <TextInput
                                                            label="Nom complet"
                                                            placeholder="Jean Dupont"
                                                            value={newVotant.nom}
                                                            iconLeft={User}
                                                            onChange={(e) => setNewVotant(p => ({ ...p, nom: e.target.value }))}
                                                        />
                                                        <TextInput
                                                            label="Email"
                                                            type="email"
                                                            placeholder="jean@email.com"
                                                            value={newVotant.email}
                                                            iconLeft={Mail}
                                                            onChange={(e) => setNewVotant(p => ({ ...p, email: e.target.value }))}
                                                        />
                                                        <TextInput
                                                            label="Téléphone"
                                                            type="tel"
                                                            placeholder="+237 612 345 678"
                                                            value={newVotant.telephone}
                                                            iconLeft={Phone}
                                                            onChange={(e) => setNewVotant(p => ({ ...p, telephone: e.target.value }))}
                                                        />
                                                    </div>
                                                    <button
                                                        onClick={handleAddVotant}
                                                        className="mt-4 btn-primary flex items-center gap-2 text-sm"
                                                    >
                                                        <Plus size={16} /> Ajouter
                                                    </button>
                                                </div>

                                                {/* Tableau paginé */}
                                                {manualVotants.length > 0 && (
                                                    <div className="mt-6">
                                                        <div className="flex justify-between items-center mb-3">
                                                            <p className="font-medium text-sm">
                                                                Votants ajoutés ({manualVotants.length})
                                                            </p>
                                                            {totalManualPages > 1 && (
                                                                <p className="text-xs text-[var(--color-gray)]">
                                                                    Page {currentPageManual} / {totalManualPages}
                                                                </p>
                                                            )}
                                                        </div>
                                                        <div className="border border-[var(--color-gray-light)] rounded-[var(--radius-md)] overflow-hidden">
                                                            <table className="w-full text-sm">
                                                                <thead className="bg-gray-50">
                                                                    <tr>
                                                                        <th className="text-left p-3 font-medium">Nom</th>
                                                                        <th className="text-left p-3 font-medium">Email</th>
                                                                        <th className="text-left p-3 font-medium">Tél.</th>
                                                                        <th className="w-10" />
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {paginatedManual.map(v => (
                                                                        <tr key={v.id} className="border-t border-[var(--color-gray-light)]">
                                                                            <td className="p-3 font-medium">{v.nom}</td>
                                                                            <td className="p-3 text-[var(--color-gray)]">{v.email}</td>
                                                                            <td className="p-3 text-[var(--color-gray)]">{v.telephone || '—'}</td>
                                                                            <td className="p-3">
                                                                                <button
                                                                                    onClick={() => handleRemoveVotant(v.id)}
                                                                                    className="text-red-400 hover:text-red-600"
                                                                                >
                                                                                    <Trash2 size={16} />
                                                                                </button>
                                                                            </td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                        {totalManualPages > 1 && (
                                                            <div className="flex justify-center gap-2 mt-3">
                                                                <button
                                                                    onClick={() => setCurrentPageManual(p => Math.max(1, p - 1))}
                                                                    disabled={currentPageManual === 1}
                                                                    className="px-3 py-1.5 border rounded text-sm disabled:opacity-50"
                                                                >
                                                                    Précédent
                                                                </button>
                                                                <button
                                                                    onClick={() => setCurrentPageManual(p => Math.min(totalManualPages, p + 1))}
                                                                    disabled={currentPageManual === totalManualPages}
                                                                    className="px-3 py-1.5 border rounded text-sm disabled:opacity-50"
                                                                >
                                                                    Suivant
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Méthodes d'authentification ── */}
                <div className="bg-white rounded-[var(--radius-md)] shadow-sm p-8">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                            <Lock size={20} />
                        </div>
                        <h2 className="text-xl font-semibold">Vérification des électeurs</h2>
                    </div>
                    <p className="text-sm text-[var(--color-gray)]">
                        Mode choisi à l'étape 1 :{' '}
                        <span className="font-medium text-[var(--color-dark)]">
                            {{
                                none: 'Aucune vérification',
                                email: 'OTP par Email',
                                sms: 'OTP par SMS',
                                both: 'OTP par Email et SMS',
                            }[verificationMode] ?? 'Aucune vérification'}
                        </span>
                    </p>
                </div>
            </div>

            {/* Navigation */}
            <div className="flex justify-between sm:flex-row flex-col mt-12 gap-4">
                <button onClick={onPrevious} className="flex items-center gap-2 btn-secondary font-medium">
                    <ArrowLeft size={20} /> Précédent
                </button>
                <button
                    onClick={handleNext}
                    disabled={importing}
                    className="flex items-center gap-2 btn-primary font-medium whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {importing ? 'Import en cours...' : "Continuer vers l'étape 4"} <ArrowRight size={20} />
                </button>
            </div>
        </div>
    );
};

Step3Votants.propTypes = {
    onNext: PropTypes.func.isRequired,
    onPrevious: PropTypes.func.isRequired,
    electionMode: PropTypes.oneOf(['public', 'private', 'restricted']),
    verificationMode: PropTypes.oneOf(['none', 'email', 'sms', 'both']),
    initialData: PropTypes.object,
};

export default Step3Votants;
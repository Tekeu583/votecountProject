import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { ClipLoader } from 'react-spinners';
import {
    ChevronLeft,
    Award,
    FileText,
    Upload,
    Check,
    AlertCircle,
    User,
    Mail,
    Phone,
    Image as ImageIcon,
    File,
    Trash2,
    AlertTriangle,
    Loader2,
    Calendar,
    Clock,
    CheckCircle,
    XCircle,
    Info
} from 'lucide-react';


import { electionsApi, candidateApplicationsApi } from '@services/api';


import { useParams } from 'react-router-dom';

const CandidateApplicationPage = () => {

    const { electionUuid } = useParams();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [election, setElection] = useState(null);

    const [existingApplication, setExistingApplication] = useState(null);
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        gender: '',
        manifesto: '',
        slogan: '',
        bio: ''
    });
    const [documents, setDocuments] = useState({
        photo: null,
        identity_document: null
    });
    const [documentPreviews, setDocumentPreviews] = useState({});
    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});

    // Récupération des données de l'élection
    useEffect(() => {
        const fetchData = async () => {
            // Guard: Don't fetch if electionUuid is undefined
            if (!electionUuid) {
                setLoading(false);
                toast.error('Election UUID non trouvée');
                return;
            }
            try {
                setLoading(true);
                const response = await electionsApi.get(electionUuid);
                setElection(response.data.data);
            } catch (error) {
                console.error('Error:', error);
                toast.error('Erreur de chargement');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [electionUuid]);


    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setTouched(prev => ({ ...prev, [name]: true }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null }));
        }
    };

    const handleFileChange = (type, file) => {
        if (!file) return;

        const validImageTypes = ['image/jpeg', 'image/png', 'image/jpg'];
        const validDocTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
        const maxSize = 5 * 1024 * 1024; // 5MB

        const validTypes = type === 'photo' ? validImageTypes : validDocTypes;

        if (!validTypes.includes(file.type)) {
            toast.error(`Format non supporté pour ${type === 'photo' ? 'la photo' : 'le document'}. Utilisez JPG, PNG ou PDF.`);
            return;
        }
        if (file.size > maxSize) {
            toast.error('Le fichier ne doit pas dépasser 5MB.');
            return;
        }
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setDocumentPreviews(prev => ({ ...prev, [type]: reader.result }));
            };
            reader.readAsDataURL(file);
        }
        setDocuments(prev => ({ ...prev, [type]: file }));
    };
    const removeDocument = (type) => {
        setDocuments(prev => ({ ...prev, [type]: null }));
        setDocumentPreviews(prev => ({ ...prev, [type]: null }));
    };

    const validateField = (name, value) => {
        switch (name) {
            case 'first_name':
                if (!value?.trim()) return 'Le prénom est requis';
                if (value.length < 2) return 'Le prénom doit contenir au moins 2 caractères';
                break;
            case 'last_name':
                if (!value?.trim()) return 'Le nom est requis';
                if (value.length < 2) return 'Le nom doit contenir au moins 2 caractères';
                break;
            case 'email': {
                if (!value?.trim()) return 'L\'email est requis';
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(value)) return 'Format d\'email invalide';
                break;
            }
            case 'phone':
                if (value && !/^[0-9+\s-]{8,20}$/.test(value)) return 'Format de téléphone invalide';
                break;
            case 'bio':
                if (value && value.length > 500) return 'La bio ne doit pas dépasser 500 caractères';
                break;
            case 'manifesto':
                if (value && value.length > 5000) return 'Le manifeste ne doit pas dépasser 5000 caractères';
                break;
            case 'slogan':
                if (value && value.length > 200) return 'Le slogan ne doit pas dépasser 200 caractères';
                break;
            default:
                break;
        }
        return null;
    };

    const getGenderLabel = (gender) => {
        if (gender === 'male') return 'Homme';
        if (gender === 'female') return 'Femme';
        return 'orther';
    };

    const handleBlur = (field) => {
        setTouched(prev => ({ ...prev, [field]: true }));
        const error = validateField(field, formData[field]);
        setErrors(prev => ({ ...prev, [field]: error }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation finale
        const newErrors = {};
        Object.keys(formData).forEach(field => {
            const error = validateField(field, formData[field]);
            if (error) newErrors[field] = error;
        });

        if (!documents.photo) {
            toast.error('La photo est requise');
            return;
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            console.log(`Erreurs: ${newErrors}`);
            toast.error('Veuillez corriger les erreurs dans le formulaire');
            return;
        }

        setSubmitting(true);
        const submitToast = toast.loading('Envoi de votre candidature...');

        try {
            // Utiliser FormData pour l'upload
            const formDataToSend = new FormData();

            Object.keys(formData).forEach(key => {
                if (formData[key]) {
                    formDataToSend.append(key, formData[key]);
                }
            });

            if (documents.photo) {
                formDataToSend.append('photo', documents.photo);
            }

            const response = await candidateApplicationsApi.submit(electionUuid, formDataToSend);

            toast.success('Candidature soumise avec succès !', { id: submitToast });
            setExistingApplication(response.data.data);

            // Réinitialiser le formulaire
            setFormData({
                first_name: '',
                last_name: '',
                email: '',
                phone: '',
                gender: '',
                manifesto: '',
                slogan: '',
                bio: ''
            });
            setDocuments({ photo: null, identity_document: null });
            setDocumentPreviews({});

        } catch (error) {
            console.error('Submission error:', error);

            if (error.response?.status === 422) {
                const validationErrors = error.response.data.errors;
                const formattedErrors = {};
                Object.keys(validationErrors).forEach(key => {
                    formattedErrors[key] = validationErrors[key][0];
                });
                setErrors(formattedErrors);
                console.log('Validation errors from server:', formattedErrors);
                toast.error('Veuillez corriger les erreurs dans le formulaire', { id: submitToast });
            } else if (error.response?.status === 403) {
                toast.error('Vous n\'êtes pas autorisé à candidater pour cette élection', { id: submitToast });
            } else {
                toast.error('Une erreur est survenue. Veuillez réessayer.', { id: submitToast });
            }
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 flex items-center justify-center">
                <div className="text-center">
                    <ClipLoader color="#1e40af" size={48} />
                    <p className="mt-4 text-gray-600">Chargement de l'élection...</p>
                </div>
            </div>
        );
    }

    if (!election) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 flex items-center justify-center">
                <div className="text-center">
                    <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Élection non trouvée</h2>
                    <p className="text-gray-600">L'élection que vous recherchez n'existe pas.</p>
                </div>
            </div>
        );
    }

    if (existingApplication) {
        const status = existingApplication.application_status;
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 py-12 px-4">
                <div className="max-w-4xl mx-auto">
                    <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
                        {status === 'approved' ? (
                            <>
                                <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4" />
                                <h2 className="text-2xl font-bold text-gray-800 mb-2">Candidature Approuvée !</h2>
                                <p className="text-gray-600">
                                    Votre candidature a été approuvée. Vous êtes maintenant officiellement candidat.
                                </p>
                            </>
                        ) : status === 'rejected' ? (
                            <>
                                <XCircle className="w-20 h-20 text-red-500 mx-auto mb-4" />
                                <h2 className="text-2xl font-bold text-gray-800 mb-2">Candidature Non Retenue</h2>
                                <p className="text-gray-600 mb-4">
                                    Nous vous remercions pour votre intérêt. Malheureusement, votre candidature n'a pas été retenue.
                                </p>
                                {existingApplication.rejection_reason && (
                                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-left">
                                        <p className="text-red-800 font-medium">Raison :</p>
                                        <p className="text-red-700 mt-1">{existingApplication.rejection_reason}</p>
                                    </div>
                                )}
                            </>
                        ) : (
                            <>
                                <Clock className="w-20 h-20 text-yellow-500 mx-auto mb-4" />
                                <h2 className="text-2xl font-bold text-gray-800 mb-2">Candidature en Cours</h2>
                                <p className="text-gray-600">
                                    Votre dossier est en cours d'examen. Vous serez notifié dès qu'une décision sera prise.
                                </p>
                            </>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    const requiredFieldsCount = ['first_name', 'last_name', 'email'].filter(f => formData[f]?.trim()).length;
    const progress = Math.round((requiredFieldsCount / 3) * 100);

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200">
            {/* Header Institutionnel */}
            <div className="relative overflow-hidden bg-gradient-to-r from-blue-950 via-blue-900 to-blue-950 text-white">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-0 -left-40 w-80 h-80 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl animate-pulse" />
                    <div className="absolute bottom-0 -right-40 w-80 h-80 bg-indigo-400 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-1000" />
                </div>

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
                    <button
                        onClick={() => window.history.back()}
                        className="flex items-center gap-2 text-blue-200 hover:text-white transition-colors mb-6 group"
                    >
                        <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                        <span>Retour</span>
                    </button>

                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                        <div>
                            <div className="flex items-center gap-3 mb-4">
                                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold">{election.title}</h1>
                                <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                                    Candidature ouverte
                                </span>
                            </div>
                            <p className="text-blue-100 text-lg max-w-2xl">{election.short_description || election.description?.substring(0, 150)}</p>
                        </div>

                        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 min-w-[200px]">
                            <div className="text-center">
                                <p className="text-sm text-blue-200 mb-1">Date limite</p>
                                <p className="text-2xl font-bold">{new Date(election.end_at).toLocaleDateString('fr-FR')}</p>
                                <div className="mt-3">
                                    <div className="flex justify-between text-sm mb-1">
                                        <span>Progression</span>
                                        <span>{progress}%</span>
                                    </div>
                                    <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                                        <div className="h-full bg-green-400 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Colonne gauche - Informations */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Carte Éligibilité */}
                        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                <Award className="w-5 h-5 text-blue-600" />
                                Critères d'éligibilité
                            </h3>
                            <ul className="space-y-3">
                                <li className="flex items-start gap-3">
                                    <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                                    <span className="text-gray-600 text-sm">Être âgé d'au moins 18 ans</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                                    <span className="text-gray-600 text-sm">Remplir le formulaire de candidature</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                                    <span className="text-gray-600 text-sm">Fournir une pièce d'identité</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                                    <span className="text-gray-600 text-sm">Soumettre une photo d'identité</span>
                                </li>
                            </ul>
                        </div>

                        {/* Carte Documents */}
                        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                <FileText className="w-5 h-5 text-blue-600" />
                                Documents requis
                            </h3>
                            <ul className="space-y-3">
                                <li className="flex items-center gap-3 text-sm">
                                    <div className={`w-2 h-2 rounded-full ${documents.photo ? 'bg-green-500' : 'bg-gray-300'}`} />
                                    <span className="text-gray-600">Photo d'identité (obligatoire)</span>
                                </li>
                                <li className="flex items-center gap-3 text-sm">
                                    <div className={`w-2 h-2 rounded-full ${documents.identity_document ? 'bg-green-500' : 'bg-gray-300'}`} />
                                    <span className="text-gray-600">Pièce d'identité (optionnelle)</span>
                                </li>
                            </ul>
                        </div>

                        {/* Carte Infos */}
                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl shadow-lg p-6">
                            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                <Info className="w-5 h-5 text-blue-600" />
                                Informations
                            </h3>
                            <div className="space-y-2 text-sm text-gray-700">
                                <li>Les candidatures sont examinées sous 48h</li>
                                <li>Un email de confirmation vous sera envoyé</li>
                                <li>Les documents sont confidentiels</li>
                            </div>
                        </div>
                    </div>

                    {/* Colonne droite - Formulaire */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                            <div className="bg-gradient-to-r from-gray-50 to-white px-6 py-5 border-b border-gray-200">
                                <h2 className="text-xl font-bold text-gray-800">Formulaire de candidature</h2>
                                <p className="text-gray-500 text-sm mt-1">Les champs marqués * sont obligatoires</p>
                            </div>

                            <form onSubmit={handleSubmit} className="p-6 space-y-8">
                                {/* Informations personnelles */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2 border-b border-gray-200 pb-2">
                                        <User className="w-5 h-5 text-blue-600" />
                                        Informations personnelles
                                    </h3>

                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Prénom <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                name="first_name"
                                                value={formData.first_name}
                                                onChange={handleInputChange}
                                                onBlur={() => handleBlur('first_name')}
                                                className={`w-full px-4 py-3 rounded-xl border transition-all focus:outline-none focus:ring-2 ${errors.first_name && touched.first_name
                                                    ? 'border-red-300 focus:ring-red-200'
                                                    : 'border-gray-200 focus:ring-blue-200 focus:border-blue-400'
                                                    }`}
                                                placeholder="Jean"
                                            />
                                            {errors.first_name && touched.first_name && (
                                                <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                                                    <AlertCircle className="w-3 h-3" /> {errors.first_name}
                                                </p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Nom <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                name="last_name"
                                                value={formData.last_name}
                                                onChange={handleInputChange}
                                                onBlur={() => handleBlur('last_name')}
                                                className={`w-full px-4 py-3 rounded-xl border transition-all focus:outline-none focus:ring-2 ${errors.last_name && touched.last_name
                                                    ? 'border-red-300 focus:ring-red-200'
                                                    : 'border-gray-200 focus:ring-blue-200 focus:border-blue-400'
                                                    }`}
                                                placeholder="Dupont"
                                            />
                                            {errors.last_name && touched.last_name && (
                                                <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                                                    <AlertCircle className="w-3 h-3" /> {errors.last_name}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Email <span className="text-red-500">*</span>
                                            </label>
                                            <div className="relative">
                                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                                <input
                                                    type="email"
                                                    name="email"
                                                    value={formData.email}
                                                    onChange={handleInputChange}
                                                    onBlur={() => handleBlur('email')}
                                                    className={`w-full pl-10 pr-4 py-3 rounded-xl border transition-all focus:outline-none focus:ring-2 ${errors.email && touched.email
                                                        ? 'border-red-300 focus:ring-red-200'
                                                        : 'border-gray-200 focus:ring-blue-200 focus:border-blue-400'
                                                        }`}
                                                    placeholder="jean.dupont@example.com"
                                                />
                                            </div>
                                            {errors.email && touched.email && (
                                                <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                                                    <AlertCircle className="w-3 h-3" /> {errors.email}
                                                </p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Téléphone
                                            </label>
                                            <div className="relative">
                                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                                <input
                                                    type="tel"
                                                    name="phone"
                                                    value={formData.phone}
                                                    onChange={handleInputChange}
                                                    onBlur={() => handleBlur('phone')}
                                                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-all"
                                                    placeholder="+225 07 XX XX XX XX"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Genre</label>
                                        <div className="flex gap-4">
                                            {['male', 'female', 'other'].map(gender => (
                                                <label key={gender} className="flex items-center gap-2">
                                                    <input
                                                        type="radio"
                                                        name="gender"
                                                        value={gender}
                                                        checked={formData.gender === gender}
                                                        onChange={handleInputChange}
                                                        className="w-4 h-4 text-blue-600"
                                                    />
                                                    <span className="text-gray-700">
                                                        {getGenderLabel(gender)}
                                                    </span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Présentation */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2 border-b border-gray-200 pb-2">
                                        <FileText className="w-5 h-5 text-blue-600" />
                                        Présentation
                                    </h3>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Biographie
                                        </label>
                                        <textarea
                                            name="bio"
                                            value={formData.bio}
                                            onChange={handleInputChange}
                                            onBlur={() => handleBlur('bio')}
                                            rows={3}
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-all resize-none"
                                            placeholder="Présentez-vous, votre parcours..."
                                        />
                                        <div className="flex justify-end mt-1">
                                            <span className={`text-xs ${formData.bio?.length > 500 ? 'text-red-500' : 'text-gray-400'}`}>
                                                {formData.bio?.length || 0}/500
                                            </span>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Manifeste / Programme
                                        </label>
                                        <textarea
                                            name="manifesto"
                                            value={formData.manifesto}
                                            onChange={handleInputChange}
                                            onBlur={() => handleBlur('manifesto')}
                                            rows={6}
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-all resize-none"
                                            placeholder="Détaillez votre programme..."
                                        />
                                        <div className="flex justify-end mt-1">
                                            <span className={`text-xs ${formData.manifesto?.length > 5000 ? 'text-red-500' : 'text-gray-400'}`}>
                                                {formData.manifesto?.length || 0}/5000
                                            </span>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Slogan
                                        </label>
                                        <input
                                            type="text"
                                            name="slogan"
                                            value={formData.slogan}
                                            onChange={handleInputChange}
                                            onBlur={() => handleBlur('slogan')}
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-all"
                                            placeholder="Votre slogan de campagne"
                                        />
                                        <div className="flex justify-end mt-1">
                                            <span className={`text-xs ${formData.slogan?.length > 200 ? 'text-red-500' : 'text-gray-400'}`}>
                                                {formData.slogan?.length || 0}/200
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Upload Documents */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2 border-b border-gray-200 pb-2">
                                        <Upload className="w-5 h-5 text-blue-600" />
                                        Documents
                                    </h3>

                                    {/* Photo */}
                                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 hover:border-blue-400 transition-colors">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Photo d'identité <span className="text-red-500">*</span>
                                        </label>
                                        {!documents.photo ? (
                                            <div className="text-center">
                                                <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                                                <p className="text-gray-500 text-sm mb-2">
                                                    Glissez-déposez votre photo
                                                </p>
                                                <input
                                                    type="file"
                                                    accept="image/jpeg,image/png,image/jpg"
                                                    onChange={(e) => handleFileChange('photo', e.target.files[0])}
                                                    className="hidden"
                                                    id="photo-upload"
                                                    name='photo'
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => document.getElementById('photo-upload').click()}
                                                    className="mt-3 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                                                >
                                                    Sélectionner
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                                                {documentPreviews.photo ? (
                                                    <img src={documentPreviews.photo} alt="Preview" className="w-16 h-16 object-cover rounded-lg" />
                                                ) : (
                                                    <File className="w-12 h-12 text-gray-400" />
                                                )}
                                                <div className="flex-1">
                                                    <p className="font-medium text-gray-800">{documents.photo.name}</p>
                                                    <p className="text-sm text-gray-500">{(documents.photo.size / 1024 / 1024).toFixed(2)} MB</p>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => removeDocument('photo')}
                                                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Pièce d'identité */}
                                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 hover:border-blue-400 transition-colors">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Pièce d'identité
                                        </label>
                                        {!documents.identity_document ? (
                                            <div className="text-center">
                                                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                                                <p className="text-gray-500 text-sm mb-2">
                                                    CNI, Passeport
                                                </p>
                                                <input
                                                    type="file"
                                                    accept=".pdf,image/jpeg,image/png,image/jpg"
                                                    onChange={(e) => handleFileChange('identity_document', e.target.files[0])}
                                                    className="hidden"
                                                    id="identity-upload"
                                                    name='identity_document'
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => document.getElementById('identity-upload').click()}
                                                    className="mt-3 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                                                >
                                                    Sélectionner
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                                                <File className="w-12 h-12 text-gray-400" />
                                                <div className="flex-1">
                                                    <p className="font-medium text-gray-800">{documents.identity_document.name}</p>
                                                    <p className="text-sm text-gray-500">{(documents.identity_document.size / 1024 / 1024).toFixed(2)} MB</p>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => removeDocument('identity_document')}
                                                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Disclaimer */}
                                <div className="pt-4 border-t border-gray-200">
                                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
                                        <div className="flex gap-3">
                                            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                                            <div>
                                                <p className="text-sm text-amber-800 font-medium">Déclaration sur l'honneur</p>
                                                <p className="text-xs text-amber-700 mt-1">
                                                    Je certifie l'exactitude des informations fournies et m'engage à respecter le règlement électoral.
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {submitting ? (
                                            <>
                                                <ClipLoader size={18} color="var(--color-white)" />
                                                Soumission...
                                            </>
                                        ) : (
                                            <>
                                                <FileText className="w-5 h-5" />
                                                Soumettre ma candidature
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CandidateApplicationPage;
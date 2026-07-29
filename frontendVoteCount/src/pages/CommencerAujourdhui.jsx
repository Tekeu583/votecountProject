import React, { useState } from 'react';
import {
    Shield, Zap, BarChart3, Upload,
    Building2, Globe, Landmark, Users,
    Building, Phone, Home, Mail, ArrowRight, ZapIcon,
    Loader2,
} from 'lucide-react';
import TextInput from '@components/ui/TextInput';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { organizationsApi } from '@services/api';
import { useAuth } from '@hooks/useAuth';

const CommencerAujourdhui = () => {
    const navigate = useNavigate();
    const { refreshUser } = useAuth();

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        address: '',
        description: '',
        logo: null,
        banner: null,
        website: '',
        country: '',
        city: '',
    });

    const [logoPreview, setLogoPreview] = useState(null);
    const [banner, setBanner] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState({});

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => { const c = { ...prev }; delete c[name]; return c; });
    };

    const handleLogoUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 3 * 1024 * 1024) {
            toast.error('Le logo ne doit pas dépasser 3 Mo');
            return;
        }

        setFormData(prev => ({ ...prev, logo: file }));
        const reader = new FileReader();
        reader.onload = (event) => setLogoPreview(event.target.result);
        reader.readAsDataURL(file);
    };
    const handleBannerUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 4 * 1024 * 1024) {
            toast.error('Le banner ne doit pas dépasser 4 Mo');
            return;
        }

        setFormData(prev => ({ ...prev, banner: file }));
        const reader = new FileReader();
        reader.onload = (event) => setBanner(event.target.result);
        reader.readAsDataURL(file);
    };
    const validate = () => {
        const e = {};
        if (!formData.name.trim()) e.name = "Le nom de l'organisation est requis.";
        if (!formData.email.trim()) e.email = "L'email est requis.";
        if (!formData.address.trim()) e.address = "L'adresse est requise.";
        return e;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const validationErrors = validate();
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        setIsSubmitting(true);

        try {
            // FormData pour envoyer le logo (multipart/form-data)
            const fd = new FormData();
            fd.append('name', formData.name.trim());
            fd.append('email', formData.email);
            fd.append('phone', formData.phone);
            fd.append('address', formData.address);
            fd.append('description', formData.description);
            if (formData.logo instanceof File) {
                fd.append('logo', formData.logo);
            }
            if (formData.banner instanceof File) {
                fd.append('banner', formData.banner);
            }
            fd.append('website', formData.website);
            fd.append('country', formData.country);
            fd.append('city', formData.city);

            // Créer l'organisation
            await organizationsApi.create(fd);

            // Rafraîchir le user pour avoir son nouveau rôle organization_owner
            await refreshUser?.();

            toast.success('Organisation créée avec succès !', {
                icon: <ZapIcon size={20} className="text-green-500" />,
            });

            // Rediriger directement vers le dashboard organisation
            navigate('/org/dashboard', { replace: true });

        } catch (err) {
            const status = err.response?.status;
            const data = err.response?.data;

            if (status === 422) {
                // Erreurs de validation Laravel
                const backendErrors = data?.errors ?? {};
                setErrors(backendErrors);
                toast.error(data?.message ?? 'Erreur de validation.');
            } else if (status === 403) {
                toast.error("Vous n'êtes pas autorisé à créer une organisation.");
            } else if (status === 401) {
                toast.error("Veillez vous connecter");
            } else {
                toast.error(data?.message ?? 'Une erreur est survenue.');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 pt-18 px-4 pb-4">
            <div className="max-w-7xl mx-auto">
                <div className="grid lg:grid-cols-12 gap-10">

                    {/* Formulaire */}
                    <div className="lg:col-span-7">
                        <div className="mb-8">
                            <p className="text-orange-600 font-medium text-sm tracking-widest">ÉTAPE 1</p>
                            <h1 className="text-5xl font-bold text-gray-900 mt-2">Commencer aujourd'hui</h1>
                            <p className="text-gray-600 mt-3 text-lg">
                                Créez votre organisation pour accéder à la plateforme de vote sécurisée.
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-10">

                            {/* Infos organisation */}
                            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center font-bold">1</div>
                                    <h2 className="text-2xl font-semibold text-gray-900">Informations de l'organisation</h2>
                                </div>

                                <div className="grid md:grid-cols-2 gap-6">
                                    <TextInput
                                        type="text"
                                        label="Nom de l'organisation"
                                        placeholder="Ex : Association des jeunes"
                                        iconLeft={Building}
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        required
                                        error={errors.name}
                                    />
                                    <TextInput
                                        type="email"
                                        label="Email professionnel"
                                        placeholder="contact@organisation.com"
                                        name="email"
                                        iconLeft={Mail}
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                        error={errors.email}
                                    />
                                    <TextInput
                                        type="tel"
                                        placeholder="+237 623 45 67 89"
                                        label="Numéro de téléphone"
                                        iconLeft={Phone}
                                        value={formData.phone}
                                        name="phone"
                                        onChange={handleChange}
                                        error={errors.phone}
                                    />
                                    <TextInput
                                        type="text"
                                        placeholder="123 Makepe Missoke"
                                        label="Adresse "
                                        iconLeft={Home}
                                        value={formData.address}
                                        name="address"
                                        onChange={handleChange}
                                        required
                                        error={errors.address}
                                    />
                                    <TextInput
                                        type="text"
                                        placeholder="lien de votre site"
                                        label="Site "
                                        iconLeft={Home}
                                        value={formData.website}
                                        name="website"
                                        onChange={handleChange}
                                        error={errors.website}
                                    />
                                    <TextInput
                                        type="text"
                                        placeholder="votre pays"
                                        label="Pays "
                                        iconLeft={Home}
                                        value={formData.country}
                                        name="country"
                                        onChange={handleChange}
                                        error={errors.country}
                                    />
                                    <TextInput
                                        type="text"
                                        placeholder="votre ville"
                                        label="Ville "
                                        iconLeft={Home}
                                        value={formData.city}
                                        name="city"
                                        onChange={handleChange}
                                        error={errors.city}
                                    />
                                </div>

                                {/* Description */}
                                <div className="mt-6">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Description
                                    </label>
                                    <textarea
                                        name="description"
                                        value={formData.description}
                                        onChange={handleChange}
                                        rows={3}
                                        placeholder="Décrivez brièvement votre organisation..."
                                        className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 transition resize-none"
                                    />
                                </div>

                                {/* Logo */}
                                <div className="mt-6">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Logo de l'organisation
                                    </label>
                                    <div className="border-2 border-dashed border-gray-300 rounded-3xl p-10 text-center hover:border-blue-400 transition cursor-pointer">
                                        <input
                                            type="file"
                                            accept="image/png, image/jpeg, image/svg+xml"
                                            onChange={handleLogoUpload}
                                            className="hidden"
                                            id="logo-upload"
                                        />
                                        <label htmlFor="logo-upload" className="cursor-pointer flex flex-col items-center">
                                            {logoPreview ? (
                                                <img src={logoPreview} alt="Logo preview" className="w-24 h-24 object-contain mb-4 rounded-xl" />
                                            ) : (
                                                <Upload className="w-12 h-12 text-gray-400 mb-4" />
                                            )}
                                            <p className="font-medium text-gray-700">Cliquez pour télécharger</p>
                                            <p className="text-sm text-gray-500 mt-1">PNG, JPG ou SVG (max. 3 Mo)</p>
                                        </label>
                                    </div>
                                </div>
                                <div className="mt-6">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Banner de l'organisation
                                    </label>
                                    <div className="border-2 border-dashed border-gray-300 rounded-3xl p-10 text-center hover:border-blue-400 transition cursor-pointer">
                                        <input
                                            type="file"
                                            accept="image/png, image/jpeg, image/svg+xml"
                                            onChange={handleBannerUpload}
                                            className="hidden"
                                            id="banner-upload"
                                        />
                                        <label htmlFor="banner-upload" className="cursor-pointer flex flex-col items-center">
                                            {banner ? (
                                                <img src={banner} alt="banner preview" className="w-24 h-24 object-contain mb-4 rounded-xl" />
                                            ) : (
                                                <Upload className="w-12 h-12 text-gray-400 mb-4" />
                                            )}
                                            <p className="font-medium text-gray-700">Cliquez pour télécharger</p>
                                            <p className="text-sm text-gray-500 mt-1">PNG, JPG ou SVG (max. 4 Mo)</p>
                                        </label>
                                    </div>
                                </div>
                            </div>

                            {/* Bouton */}
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full btn-primary font-semibold py-4 rounded-xl text-lg flex items-center justify-center gap-3 transition disabled:opacity-70"
                            >
                                {isSubmitting ? (
                                    <><Loader2 size={20} className="animate-spin" /> Création en cours...</>
                                ) : (
                                    <>Créer mon organisation <ArrowRight size={22} /></>
                                )}
                            </button>
                        </form>

                        <p className="text-center text-xs text-gray-500 mt-4">
                            En continuant, vous acceptez nos{' '}
                            <a href="#" className="underline hover:text-gray-700">Conditions d'Utilisation</a>{' '}
                            et notre{' '}
                            <a href="#" className="underline hover:text-gray-700">Politique de Confidentialité</a>.
                        </p>
                    </div>

                    {/* Sidebar */}
                    <div className="lg:col-span-5">
                        <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-3xl p-8 sticky top-8">
                            <h3 className="text-2xl font-semibold mb-8">Pourquoi choisir VoteCount ?</h3>
                            <div className="space-y-8">
                                <div className="flex gap-4">
                                    <div className="mt-1"><Shield className="w-7 h-7" /></div>
                                    <div>
                                        <h4 className="font-semibold text-lg">Sécurité Maximale</h4>
                                        <p className="text-blue-100 mt-1 text-sm">
                                            Protocoles de cryptage de bout en bout conformes aux normes RGPD et ISO.
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="mt-1"><Zap className="w-7 h-7" /></div>
                                    <div>
                                        <h4 className="font-semibold text-lg">Configuration Rapide</h4>
                                        <p className="text-blue-100 mt-1 text-sm">
                                            Lancez votre premier scrutin en moins de 10 minutes grâce à nos modèles.
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="mt-1"><BarChart3 className="w-7 h-7" /></div>
                                    <div>
                                        <h4 className="font-semibold text-lg">Résultats en Temps Réel</h4>
                                        <p className="text-blue-100 mt-1 text-sm">
                                            Accédez à des rapports détaillés et audits dès la clôture des votes.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-12 pt-8 border-t border-blue-500">
                                <p className="italic text-blue-100">
                                    "VoteCount a transformé notre assemblée générale annuelle en un processus fluide et transparent."
                                </p>
                                <div className="flex items-center gap-3 mt-6">
                                    <div className="w-10 h-10 bg-white/20 rounded-full overflow-hidden">
                                        <img
                                            src="https://randomuser.me/api/portraits/men/7.jpg"
                                            alt="Merlin Kengni"
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <div>
                                        <p className="font-semibold">M. Merlin Kengni</p>
                                        <p className="text-xs text-blue-200">DIR. ASSOCIATION FR</p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mt-12">
                                <div className="bg-white/10 backdrop-blur rounded-2xl p-6 text-center">
                                    <div className="text-3xl font-bold">5 000+</div>
                                    <div className="text-sm text-blue-100 mt-1">VOTES SÉCURISÉS</div>
                                </div>
                                <div className="bg-white/10 backdrop-blur rounded-2xl p-6 text-center">
                                    <div className="text-3xl font-bold text-orange-300">99.9%</div>
                                    <div className="text-sm text-blue-100 mt-1">DISPONIBILITÉ</div>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default CommencerAujourdhui;

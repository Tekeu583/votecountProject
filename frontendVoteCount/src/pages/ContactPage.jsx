import React, { useState } from 'react';
import {
    Mail,
    MapPin,
    Phone,
    User,
} from 'lucide-react';
import TextInput from '@components/ui/TextInput';
import IutImage  from '@assets/img/iut.jpeg';
import toast from 'react-hot-toast';
import LogoReseau from '@components/LogoReseau';
import Linkedin from '@assets/img/linkedin.png';
import Twitter from '@assets/img/Twitter.png';
import Instagram from '@assets/img/Instagram.jpg';
import Whatsapp from '@assets/img/Whatsapp.jpg';


const ContactPage = () => {
    const [formData, setFormData] = useState({
        nom: '',
        email: '',
        sujet: 'Demande de démonstration',
        message: ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log('Form submitted:', formData);
        // Ici tu peux ajouter l'appel API ou l'intégration (ex: EmailJS, Formspree, etc.)
        toast.success("Message envoyé ! (Simulation)");
    };

    return (
        <div className="min-h-screen bg-[var(--color-background-white)] pt-18">
            {/* Hero Section */}
            <div className="max-w-4xl mx-auto text-center px-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-4">
                    Contactez-nous
                </h1>
                <p className="text-xl text-gray-600 ">
                    Une question sur nos solutions de vote électronique sécurisées ?
                    Notre équipe d'experts vous accompagne pour garantir le succès de vos scrutins.
                </p>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-12">
                <div className="grid lg:grid-cols-12 gap-12">

                    {/* Formulaire de contact */}
                    <div className="lg:col-span-7">
                        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 md:p-10">
                            <h2 className="text-2xl font-semibold text-gray-900 mb-8">
                                Envoyez-nous un message
                            </h2>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid md:grid-cols-2 gap-6">
                                    <TextInput
                                        type="text"
                                        name="nom"
                                        label="Nom complet"
                                        value={formData.nom}
                                        onChange={handleChange}
                                        iconLeft={User}
                                        placeholder="Ex: Arsene Tekeu"
                                        className="w-full px-5 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:border-blue-600 transition"
                                        required
                                    />
                                </div>
                                <div>
                                    <TextInput
                                        type="email"
                                        name="email"
                                        label="Email professionnel"
                                        value={formData.email}
                                        onChange={handleChange}
                                        placeholder="arsenetekeu@gmail.com"
                                        iconLeft={Mail}
                                        className="w-full px-5 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:border-blue-600 transition"
                                        required
                                    />
                                </div>


                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Sujet
                                    </label>
                                    <select
                                        name="sujet"
                                        value={formData.sujet}
                                        onChange={handleChange}
                                        className="w-full px-5 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:border-blue-600 transition bg-white"
                                    >
                                        <option value="Demande de démonstration">Demande de démonstration</option>
                                        <option value="Question sur la tarification">Question sur la tarification</option>
                                        <option value="Support technique">Support technique</option>
                                        <option value="Partenariat">Partenariat</option>
                                        <option value="Autre">Autre</option>
                                    </select>
                                </div>

                                <div>
                                    <label htmlFor='message' className="block text-sm font-medium text-gray-700 mb-2">
                                        Votre message
                                    </label>
                                    <textarea
                                        name="message"
                                        value={formData.message}
                                        onChange={handleChange}
                                        rows={6}
                                        placeholder="Comment pouvons-nous vous aider ?"
                                        className="w-full px-5 py-4 border border-gray-200 rounded-[var(--radius-md)] focus:outline-none focus:border-blue-600 transition resize-y"
                                        required
                                    />
                                </div>

                                <button
                                    type="submit"
                                    className="w-full btn-primary py-4 text-lg transition transform active:scale-[0.98]"
                                >
                                    Envoyer le message
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Informations de contact + Réseaux sociaux */}
                    <div className="lg:col-span-5 space-y-10">

                        {/* Infos de contact */}
                        <div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-6">Informations de contact</h3>

                            <div className="space-y-6">
                                <div className="flex gap-4">
                                    <div className="w-11 h-11 bg-blue-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                                        <Mail className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900">Email Support</p>
                                        <a href="mailto:arsenetekeu@gmail.com" className="text-blue-600 hover:underline">
                                            support@votecount.fr
                                        </a>
                                        <p className="text-sm text-gray-500 mt-0.5">Réponse sous 24h ouvrées</p>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <div className="w-11 h-11 bg-blue-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                                        <MapPin className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900">Siège social</p>
                                        <p className="text-gray-600">
                                            IUT De Douala
                                        </p>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <div className="w-11 h-11 bg-blue-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                                        <Phone className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900">Téléphone</p>
                                        <a href="#" target="_blank" className="text-gray-600 hover:text-gray-900">
                                            +237 653 45 67 89
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Réseaux sociaux */}
                        <div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-4">Suivez-nous</h3>
                            <div className="flex gap-4">
                                <a href="https://wa.me/237654736265?text=Bonjour je viens depuis votre site VoteCount et j'ai besoin d'aide" target="_blank" title='Whatsapp' className="w-11 h-11 bg-gray-100 hover:bg-gray-200  flex items-center justify-center transition">
                                    <LogoReseau Image={Whatsapp} />
                                </a>
                                <a href="https://www.linkedin.com/in/ars%C3%A8ne-tekeu-kana-14433b347" target="_blank" title='Linkedin' className="w-11 h-11 bg-gray-100 hover:bg-gray-200  flex items-center justify-center transition">
                                    <LogoReseau Image={Linkedin} />
                                </a>
                                <a href="https://x.com/ArseneTeke98775" target="_blank" title='Twitter' className="w-11 h-11 bg-gray-100 hover:bg-gray-200 rounded-2xl flex items-center justify-center transition">
                                    <LogoReseau Image={Twitter} />
                                </a>
                                <a href="#" target="_blank" className="w-11 h-11 bg-gray-100 hover:bg-gray-200 rounded-2xl flex items-center justify-center transition">
                                    <LogoReseau Image={Instagram} />
                                </a>
                            </div>
                        </div>

                        {/* Image Tour Eiffel */}
                        <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100">
                            <img
                                src={IutImage}
                                alt="Institut Universitaire De Technologies De Douala, Douala, Cameroon"
                                className="w-full h-80 object-cover"
                            />
                            <div className="p-4">
                                <a
                                    href="https://maps.google.com?q=Institut Universitaire De Technologies De Douala, Douala, Cameroon"
                                    target="_blank"
                                    className="block text-center bg-[var(--color-white)] hover:bg-[var(--color-gray-light)] text-[var(--color-dark)] font-medium py-3 rounded-[var(--radius-md)] transition"
                                >
                                    Voir sur Google Maps
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div >

            {/* Section Confiance */}
            <div className="bg-gray-100 py-16 mt-12" >
                <div className="max-w-5xl mx-auto text-center px-6">
                    <p className="uppercase tracking-widest text-sm text-gray-500 font-medium mb-6">
                        ILS NOUS FONT CONFIANCE POUR LEURS ÉLECTIONS
                    </p>
                    <div className="flex flex-wrap justify-center items-center gap-x-12 gap-y-8 text-xl font-semibold text-gray-900">
                        <span>CTEC SARL</span>
                        <span>IUT de Douala</span>
                        <span>Universite de Douala</span>
                        <span>BDE de Douala</span>
                    </div>
                </div>
            </div>
        </div >
    );
};

export default ContactPage;
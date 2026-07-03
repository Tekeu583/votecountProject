import React, { useState } from 'react';
import { Clock, ChevronLeft, ChevronRight, ArrowRight, User, Mail, Building2 } from 'lucide-react';
import toast from 'react-hot-toast';
import TextInput from '@components/ui/TextInput';

const DemoPage = () => {
    const [selectedDate, setSelectedDate] = useState(() => {
        const today = new Date();
        today.setDate(today.getDate() + 1); // Par défaut dans 1 jour
        return today.toISOString().split('T')[0];
    });

    const [selectedTime, setSelectedTime] = useState('11:00');

    const timeSlots = ['09:30', '11:00', '14:00', '16:30'];

    const [formData, setFormData] = useState({
        nomComplet: '',
        email: '',
        organisation: '',
        tailleOrganisation: '1-50',
        message: '',
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.nomComplet || !formData.email) {
            toast.error("Veuillez remplir le nom et l'email");
            return;
        }
        toast.success("Demande de démo envoyée avec succès ! Nous vous contacterons bientôt.");
        // Ici tu feras l'appel API
    };

    return (
        <div className="min-h-screen bg-[var(--color-background-white)]">
            <div className="max-w-7xl mx-auto px-6 py-12 lg:py-20">
                <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">

                    {/* Partie Gauche - Texte */}
                    <div>
                        <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-700 text-sm font-medium px-4 py-1.5 rounded-full mb-6">
                            <span>✨</span> Essai Gratuit Disponible
                        </div>

                        <h1 className="text-5xl lg:text-6xl font-bold leading-tight text-gray-900">
                            Démarrer une démo <span className="text-blue-600">personnalisée</span>
                        </h1>

                        <p className="mt-6 text-lg text-gray-600 max-w-lg">
                            Découvrez comment VoteCount peut transformer vos processus de vote.
                            Planifiez une présentation avec l'un de nos experts et obtenez des réponses
                            à toutes vos questions techniques et de conformité.
                        </p>

                        {/* Formulaire */}
                        <form onSubmit={handleSubmit} className="mt-10 bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <TextInput
                                        type="text"
                                        name="nomComplet"
                                        label="Nom complet"
                                        value={formData.nomComplet}
                                        onChange={handleChange}
                                        iconLeft={User}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:border-blue-600"
                                        placeholder="Arsene Tekeu"
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
                                        iconLeft={Mail}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:border-blue-600"
                                        placeholder="arseneteku@entreprise.fr"
                                        required
                                    />
                                </div>

                                <div>
                                    <TextInput
                                        type="text"
                                        name="organisation"
                                        label="Organisation"
                                        value={formData.organisation}
                                        onChange={handleChange}
                                        iconLeft={Building2}
                                        className="w-full px-4 py-3  focus:outline-none focus:border-blue-600"
                                        placeholder="Nom de l'entreprise"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="tailleOrganisation" className="block text-sm font-medium text-gray-700 mb-2">Taille de l'organisation</label>
                                    <select
                                        name="tailleOrganisation"
                                        value={formData.tailleOrganisation}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3  rounded-xl focus:outline-none focus:border-blue-600"
                                    >
                                        <option value="1-50">1-50 employés</option>
                                        <option value="51-200">51-200 employés</option>
                                        <option value="201-500">201-500 employés</option>
                                        <option value="500+">500+ employés</option>
                                    </select>
                                </div>
                            </div>

                            <div className="mt-6">
                                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">Message (optionnel)</label>
                                <textarea
                                    name="message"
                                    id="message"
                                    value={formData.message}
                                    onChange={handleChange}
                                    rows={4}
                                    className="w-full px-4 py-3  rounded-xl focus:outline-none focus:border-blue-600 resize-y"
                                    placeholder="Quels sont vos besoins spécifiques ?"
                                />
                            </div>

                            <button
                                type="submit"
                                className="mt-8 w-full btn-primary  flex items-center justify-center gap-3 transition-all active:scale-[0.98]"
                            >
                                Réserver ma démo
                                <ArrowRight size={20} />
                            </button>

                            <p className="text-center text-xs text-gray-500 mt-4">
                                En soumettant ce formulaire, vous acceptez notre{' '}
                                <a href="#" className="underline hover:text-blue-600">politique de confidentialité</a>.
                            </p>
                        </form>
                    </div>

                    {/* Partie Droite - Calendrier */}
                    <div className="bg-white rounded-xl shadow-[var(--shadow-md)] border border-gray-100 overflow-hidden">
                        <div className="bg-blue-600 text-white p-6">
                            <h3 className="text-xl font-semibold">Choisissez votre créneau</h3>
                            <p className="text-blue-200 text-sm mt-1">Sélectionnez une date et un horaire disponible</p>
                        </div>

                        <div className="p-6 space-y-8">
                            {/* Date Picker */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Date de la démo</label>
                                <TextInput
                                    type="date"
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                    className="w-full"
                                    min={new Date().toISOString().split('T')[0]} // Pas de date passée
                                />
                            </div>

                            {/* Time Slots */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-3">Créneaux disponibles</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {timeSlots.map((time) => (
                                        <button
                                            key={time}
                                            onClick={() => setSelectedTime(time)}
                                            className={`py-4 border-2 rounded-2xl text-sm font-medium transition-all flex items-center justify-center gap-2
                                                    ${selectedTime === time
                                                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                                                    : 'border-gray-200 hover:border-gray-400'
                                                }`}
                                        >
                                            <Clock size={18} />
                                            {time}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Expert Info */}
                            <div className="pt-6 border-t border-gray-100 flex items-center gap-4">
                                <img
                                    src="https://i.pravatar.cc/150?u=tonny"
                                    alt="tonny fokam"
                                    className="w-12 h-12 rounded-full object-cover border border-gray-200"
                                />
                                <div>
                                    <p className="font-medium text-gray-900">Tonny Fokam</p>
                                    <p className="text-sm text-gray-500">Expert Solutions VoteCount</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DemoPage;
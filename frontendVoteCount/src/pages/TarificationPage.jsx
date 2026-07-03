import React, { useState, useEffect } from 'react';
import {
    Check,
    Star,
    ArrowRight,
    ArrowLeft,
    Pencil,
    NotebookIcon
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import TextInput from '@components/ui/TextInput';
import { paymentsApi, plansApi } from '@services/api';

const TarificationPage = () => {
    const [selectedPlan, setSelectedPlan] = useState('business');
    const navigate = useNavigate();
    const [accepted, setAccepted] = useState(false);
    const [planDetails, setPlanDetails] = useState(null);
    const data = JSON.parse(localStorage.getItem("orgData"));

    // recuperer les details du plan pour afficher le montant depuis API
    useEffect(() => {
        plansApi.getAll().then(res => {
            setPlanDetails(res.data.data);
            console.log("Plan details →", res.data.data);
        });
    }, []);

    const plans = [
        {
            id: 'pro',
            name: 'Started',
            price: '25 000',
            period: 'par élection',
            badge: 'PONCTUEL',
            popular: false,
            features: [
                'Jusqu’à 500 votants',
                '1 scrutin unique',
                'Résultats certifiés PDF',
                'Support par email'
            ],
            buttonVariant: 'secondary'
        },
        {
            id: 'business',
            name: 'Pro',
            price: '150 000',
            period: 'par an',
            badge: 'ANNUEL',
            popular: true,
            features: [
                'Votants illimités',
                'Scrutins illimités',
                'Support prioritaire 24/7',
                'Exports Excel & Statistiques',
                'Marquage personnalisé'
            ],
            buttonVariant: 'primary'
        },
        {
            id: 'enterprise',
            name: 'Entreprise',
            price: '450 000',
            period: 'par an',
            badge: 'SUR MESURE',
            popular: false,
            features: [
                'Tout du pack Business',
                'Accompagnement juridique',
                'API & Intégrations',
                'Serveurs dédiés (SaaS/On-Prem)',
                'SSO & Sécurité avancée'
            ],
            buttonVariant: 'secondary'
        },
    ];
    const selectedPlanData = plans.find(p => p.id === selectedPlan);
    const handleCheckout = () => {
        if (!accepted) {
            toast.error("Veuillez accepter les conditions");
            return;
        }

        if (!data) {
            toast.success("Données organisation manquantes");
            navigate('/inscription');
            return;
        }

        const payload = {
            ...data,
            plan: selectedPlan,
        };

        // stockage temporaire (ou API)
        localStorage.setItem("checkoutData", JSON.stringify(payload));

        navigate("/checkout"); // page paiement
    };
    return (
        <div className="min-h-screen bg-[var(--color-background-white)] p-4 pt-18">
            {/* Header */}
            <div className="bg-[var(--color-white)]">
                <div className="max-w-5xl mx-auto  text-center">
                    <h1 className="text-5xl font-bold text-gray-900 mb-3">Choisissez votre forfait</h1>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                        Sélectionnez la solution de vote sécurisée adaptée à vos besoins organisationnels.
                    </p>
                </div>
            </div>

            {/* Pricing Cards */}
            <div className="max-w-8xl mx-auto px-4">
                <div className=" mx-auto mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                    {plans.map((plan) => (
                        <div
                            key={plan.id}
                            className={`relative bg-[var(--color-white)] rounded-3xl p-8 border transition-all mt-9 duration-300 ${plan.popular
                                ? 'border-[var(--color-primary)] shadow-[var(--shadow-md)] scale-105 z-10'
                                : 'border-[var(--color-gray-light)]  hover:border-gray-300 '
                                }`}
                        >
                            {plan.popular && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                                    <span className="bg-[var(--color-primary)] text-white text-xs whitespace-nowrap font-semibold px-6 py-1.5 rounded-full flex items-center gap-1">
                                        <Star className="w-4 h-4" />
                                        LE PLUS POPULAIRE
                                    </span>
                                </div>
                            )}

                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h3 className="text-2xl font-semibold text-gray-900">Pack {plan.name}</h3>
                                    <span className="inline-block px-3 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full mt-2">
                                        {plan.badge}
                                    </span>
                                </div>
                            </div>

                            <div className="mb-8">
                                <div className="flex items-baseline">
                                    <span className="text-5xl font-bold text-gray-900">{plan.price}</span>
                                    <span className="text-2xl font-semibold text-gray-900 ml-1">FCFA</span>
                                </div>
                                <p className="text-gray-500 mt-1">{plan.period}</p>
                            </div>

                            <ul className="space-y-4 mb-10">
                                {plan.features.map((feature, index) => (
                                    <li key={index} className="flex items-start gap-3">
                                        <div className="mt-1">
                                            <Check className="w-5 h-5 text-emerald-500" />
                                        </div>
                                        <span className="text-gray-700">{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            <button
                                onClick={() => setSelectedPlan(plan.id)}
                                className={`w-full py-4 rounded-[var(--radius-md)] font-semibold transition-all ${plan.popular
                                    ? 'btn-primary'
                                    : 'btn-secondary'
                                    } ${selectedPlan === plan.id && plan.popular ? 'ring-2 ring-[var(--color-primary)] ring-offset-2' : ''}`}
                            >
                                choisir ce pack
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Résumé de l'organisation */}
            <div className=" mx-auto px-6 mt-20">
                <div className="bg-[var(--color-white)] rounded-3xl shadow-sm border border-gray-100 p-10">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-8 h-8 bg-blue-100 rounded-2xl flex items-center justify-center">
                            <span className="text-[var(--color-primary)] font-bold"><NotebookIcon /></span>
                        </div>
                        <h2 className="text-2xl font-semibold text-gray-900">Résumé de votre organisation</h2>
                    </div>

                    <div className="grid md:grid-cols-3 gap-10">
                        <div>
                            <p className="uppercase text-xs tracking-widest text-gray-500 mb-1">NOM DE L'ORGANISATION</p>
                            <p className="font-medium text-gray-900">{data?.name || 'indisponible'}</p>
                        </div>
                        <div>
                            <p className="uppercase text-xs tracking-widest text-gray-500 mb-1">Type d'organisation</p>
                            <p className="font-medium text-gray-900">{data?.types || ''}</p>
                        </div>
                        <div>
                            <p className="uppercase text-xs tracking-widest text-gray-500 mb-1">RESPONSABLE</p>
                            <p className="font-medium text-gray-900">Arsene Tekeu</p>
                        </div>
                        <div>
                            <p className="uppercase text-xs tracking-widest text-gray-500 mb-1">E-MAIL DE CONTACT</p>
                            <p className="font-medium text-gray-900">{data?.email || 'indisponible'}</p>
                        </div>
                        <div>
                            <p className="uppercase text-xs tracking-widest text-gray-500 mb-1">FORFAIT SÉLECTIONNÉ</p>
                            <p className="font-semibold text-[var(--color-primary)]">Pack {selectedPlanData?.name} ({selectedPlanData?.price}) FCFA</p>
                        </div>
                    </div>

                    <div className="mt-10 pt-8 border-t border-gray-100">
                        <label className="flex items-start gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={accepted}
                                onChange={(e) => setAccepted(e.target.checked)}
                                className="mt-1 w-5 h-5 accent-[var(--color-primary)]"
                            />
                            <span className="text-sm text-gray-600">
                                J'accepte les <span className="underline">conditions générales d'utilisation</span> et la{' '}
                                <span className="underline">politique de confidentialité</span> de VoteCount.
                            </span>
                        </label>
                    </div>

                    <div className="flex flex-col md:flex-row gap-4 mt-10">
                        <button
                            onClick={() => {
                                navigate('/inscription')
                            }}
                            className="flex-1 py-4 btn-secondary transition flex items-center justify-center gap-2">
                            Modifier les informations
                            <Pencil className="w-5 h-5" />
                        </button>

                        <button
                            disabled={!accepted}
                            onClick={handleCheckout}
                            className={`flex-1 py-4 rounded-2xl font-semibold transition-all flex items-center justify-center gap-3
                                ${accepted
                                    ? 'bg-blue-600 hover:bg-blue-700 cursor-pointer text-white'
                                    : 'bg-gray-200 text-gray-400 cursor-not-allowed pointer-events-none disabled:outline-none'
                                }`}
                        >
                            Finaliser le paiement (FCFA)
                            <ArrowRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>
        </div >
    );
};

export default TarificationPage;
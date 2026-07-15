// src/pages/PaymentSuccessMultiple.jsx
// Équivalent de PaymentSuccess.jsx pour le vote multiple : liste chaque
// candidat soutenu avec sa quantité de voix, au lieu d'un candidat unique.
import React from "react";
import { CheckCircle, ArrowLeft, Home, Lock } from "lucide-react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import Logo from "@components/Logo";

const PaymentSuccessMultiple = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { electionUuid } = useParams();

    const {
        items = [],
        election,
        totalAmount,
        totalQuantity,
        currency = 'XAF',
        transactionUuid,
    } = location.state ?? {};

    if (items.length === 0 || !transactionUuid) {
        return (
            <div className="pt-24 text-center px-4">
                <p className="text-gray-500 mb-4">Aucune confirmation de paiement à afficher.</p>
                <button
                    onClick={() => navigate(electionUuid ? `/elections/${electionUuid}` : '/elections')}
                    className="btn-primary"
                >
                    Retour à l'élection
                </button>
            </div>
        );
    }

    const now = new Date();

    return (
        <div className="bg-[var(--color-background-white)] pt-18 flex items-center justify-center px-4 min-h-screen">
            <div className="w-full max-w-xl bg-white rounded-[var(--radius-md)] shadow-[var(--shadow-md)] overflow-hidden">
                <div className="bg-gradient-to-b from-blue-100 to-white text-center px-6 py-5">
                    <button
                        onClick={() => navigate('/elections')}
                        className="flex items-center gap-2 text-gray-900 hover:text-blue-900"
                    >
                        <ArrowLeft size={20} />
                        Retour
                    </button>
                    <div className="flex justify-center">
                        <div className=" p-4 rounded-full">
                            <Logo size="lg" showText={false} />
                        </div>
                    </div>
                    <p className="text-blue-600 font-semibold mt-4 tracking-wide">
                        SÉCURISÉ & VÉRIFIÉ
                    </p>
                </div>

                <div className="px-6 pb-8 text-center">
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
                        Votes Confirmés avec Succès
                    </h1>
                    <p className="text-gray-500 mt-3 text-sm md:text-base">
                        Merci d'avoir soutenu {items.length} candidat{items.length > 1 ? 's' : ''}
                        {election?.title && <> à l'élection « {election.title} »</>}.
                        Votre paiement a été confirmé et vos votes enregistrés.
                    </p>

                    <div className="mt-6 bg-gray-50 rounded-xl p-5 text-left space-y-3">
                        <h2 className="text-sm font-semibold text-gray-500 uppercase">Répartition par candidat</h2>
                        {items.map((it) => (
                            <div key={it.uuid} className="flex items-center gap-3">
                                <img src={it.photo} alt={it.full_name} className="w-10 h-10 rounded-full object-cover shrink-0" />
                                <span className="flex-1 text-sm text-gray-800 truncate">{it.full_name}</span>
                                <span className="text-sm font-semibold text-[var(--color-primary)] shrink-0">
                                    {it.quantity} voix
                                </span>
                                <span className="text-sm text-gray-500 shrink-0">{it.amountValue} {currency}</span>
                            </div>
                        ))}
                    </div>

                    <div className="mt-4 bg-gray-50 rounded-xl p-5 text-left space-y-3">
                        <h2 className="text-sm font-semibold text-gray-500 uppercase">
                            Détails de la transaction
                        </h2>

                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Référence</span>
                            <span className="font-medium text-gray-800 break-all text-right ml-4">
                                {transactionUuid}
                            </span>
                        </div>

                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Date</span>
                            <span className="text-gray-800">{now.toLocaleDateString('fr-FR')}</span>
                        </div>

                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Heure</span>
                            <span className="text-gray-800">{now.toLocaleTimeString('fr-FR')}</span>
                        </div>

                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Montant total</span>
                            <span className="font-semibold text-green-600">
                                {totalAmount} {currency}
                            </span>
                        </div>

                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Voix totales</span>
                            <span className="font-semibold text-[var(--color-primary)]">
                                {totalQuantity}
                            </span>
                        </div>

                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Statut</span>
                            <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-600 font-medium">
                                Validé
                            </span>
                        </div>
                    </div>

                    <div className="mt-6 space-y-3">
                        <button
                            onClick={() => navigate('/elections')}
                            className="w-full flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 rounded-lg transition"
                        >
                            <Home size={18} />
                            Retour à l'accueil
                        </button>
                    </div>

                    <p className="text-xs flex gap-2 items-center justify-center text-gray-400 mt-6">
                        <Lock size={16} /> Ces votes sont chiffrés de bout en bout et ne peuvent pas être modifiés.
                    </p>
                </div>

                <div className="text-center text-xs text-gray-400 py-4 border-t border-t-[var(--color-gray-light)]">
                    © 2026 Système de Vote Sécurisé. Tous droits réservés.
                </div>
            </div>
        </div>
    );
};

export default PaymentSuccessMultiple;

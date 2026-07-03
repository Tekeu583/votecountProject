import React, { useState, useMemo, useEffect } from "react";
import {
    Smartphone,
    CreditCard,
    ArrowLeft,
    CheckCircle,
    Loader2
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import TextInput from "@components/ui/TextInput";
import { paymentsApi, plansApi } from "@services/api";

export default function Checkout() {
    const navigate = useNavigate();

    // ================= DATA =================
    const data = JSON.parse(localStorage.getItem("checkoutData"));

    const [paymentMethod, setPaymentMethod] = useState("MTN");
    const [phone, setPhone] = useState(data?.phone || "");
    const [loading, setLoading] = useState(false);
    const [planDetails, setPlanDetails] = useState(null);

    // recuperer les details du plan pour afficher le montant depuis API
    useEffect(() => {
        plansApi.getAll().then(res => {
            setPlanDetails(res.data.data);
        });
    }, [data?.plan]);


    const plans = {
        pro: 25000,
        business: 150000,
        enterprise: 450000,
    };

    const amount = useMemo(() => {
        return plans[data?.plan] || 0;
    }, [data, plans]);

    // ================= VALIDATION =================
    const isValidPhone = (num) => {
        return /^6\d{8}$/.test(num); // format cameroun
    };

    // ================= PAYMENT =================
    const handlePayment = async () => {
        if (!isValidPhone(phone)) {
            toast.error("Numéro invalide (ex: 6XXXXXXXX)");
            return;
        }

        setLoading(true);

        try {
            const payload = {
                phone,
                amount,
                method: paymentMethod,
                organisation: data?.name,
                email: data?.email,
                plan: data?.plan,
            };

            console.log("PAYLOAD →", payload);

            // ================= API CALL =================

            const response = await paymentsApi.initiateSubscription(payload);

            console.log("PAYMENT RESPONSE →", response);

            if (response?.data?.error) {
                throw new Error(response?.data?.error);
            }
            localStorage.removeItem("checkoutData");
            toast.success("Paiement initié");
            navigate("/org/scrutins/CreateScrutin");
        } catch (error) {
            toast.error(error.message || "Erreur paiement");
        } finally {
            setLoading(false);
        }
    };

    if (!data) {
        return (
            <div className="p-10 text-center">
                Données manquantes — retour à l'inscription
            </div>
        );
    }

    return (
        <main className="pt-18 bg-[var(--color-background-white)] px-4 pb-5">
            <div className="max-w-5xl mx-auto space-y-6">

                {/* HEADER */}
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 border rounded-full"
                    >
                        <ArrowLeft size={18} />
                    </button>

                    <h1 className="text-2xl font-bold">
                        Finaliser le paiement
                    </h1>
                </div>

                <div className="grid md:grid-cols-2 gap-6">

                    {/* LEFT - PAYMENT */}
                    <div className="bg-[var(--color-white)] p-6 rounded-[var(--radius-md)] shadow-[var(--shadow-md)] space-y-6">

                        <h3 className="font-semibold text-lg">
                            Méthode de paiement
                        </h3>

                        {/* METHODS */}
                        <div className="grid grid-cols-2 gap-4">

                            {/* MTN */}
                            <button
                                onClick={() => setPaymentMethod("MTN")}
                                className={`p-4 rounded-xl border flex flex-col items-center gap-2
                                    ${paymentMethod === "MTN"
                                        ? "border-yellow-400 bg-yellow-50"
                                        : "border-gray-200"}
                                `}
                            >
                                <Smartphone />
                                MTN Money
                            </button>

                            {/* ORANGE */}
                            <button
                                onClick={() => setPaymentMethod("ORANGE")}
                                className={`p-4 rounded-xl border flex flex-col items-center gap-2
                                    ${paymentMethod === "ORANGE"
                                        ? "border-orange-400 bg-orange-50"
                                        : "border-gray-200"}
                                `}
                            >
                                <CreditCard />
                                Orange Money
                            </button>
                        </div>

                        {/* PHONE INPUT */}
                        <div>
                            <TextInput
                                type="tel"
                                value={phone}
                                label="Numéro de paiement"
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="6XXXXXXXX"
                                className="w-full text-xl focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        {/* PAY BUTTON */}
                        <button
                            onClick={handlePayment}
                            disabled={loading}
                            className="w-full btn-primary py-3 flex justify-center items-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="animate-spin" />
                                    Paiement en cours...
                                </>
                            ) : (
                                <>Payer {amount.toLocaleString()} FCFA</>
                            )}
                        </button>
                    </div>

                    {/* RIGHT - SUMMARY */}
                    <div className="bg-[var(--color-white)] p-6 rounded-[var(--radius-md)] shadow-[var(--shadow-md)] space-y-6">

                        <h3 className="font-semibold text-lg">
                            Récapitulatif
                        </h3>

                        <div className="space-y-3 text-sm">

                            <div className="flex justify-between">
                                <span>Organisation</span>
                                <span className="font-medium">
                                    {data.name}
                                </span>
                            </div>

                            <div className="flex justify-between">
                                <span>Email</span>
                                <span>{data.email}</span>
                            </div>

                            <div className="flex justify-between">
                                <span>Plan</span>
                                <span className="capitalize">
                                    {data.plan}
                                </span>
                            </div>

                            <div className="border-t border-t-[var(--color-gray-light)] pt-3 flex justify-between font-bold text-lg">
                                <span>Total</span>
                                <span>{amount.toLocaleString()} FCFA</span>
                            </div>
                        </div>

                        <div className="bg-green-50 p-3 rounded-lg flex items-center gap-2 text-sm text-green-700">
                            <CheckCircle size={16} />
                            Paiement sécurisé via Mobile Money
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
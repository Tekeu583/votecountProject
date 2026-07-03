import { X, ShieldAlert, Ban } from "lucide-react";
import { securityApi } from "@services/api";
import {
    toastError,
    toastLoading,
    toastSuccess,
    toastDismiss,
} from "@services/toastService";
import { useState } from "react";

export default function SecurityModal({ data, onClose }) {
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!data) return null;

    const incidentTitle = data.title || "Incident non renseigné";
    const sourceIp = data.source || "Source inconnue";
    const target = data.target || "Cible non renseignée";
    const time = data.time || "Date indisponible";

    const handleBlockIp = async () => {
        if (!data?.source || isSubmitting) return;

        setIsSubmitting(true);
        const loading = toastLoading("Blocage de l’adresse IP en cours...");

        try {
            await securityApi.blockIp({
                ip: data.source,
            });

            toastDismiss(loading);
            toastSuccess("Adresse IP bloquée avec succès");
            onClose();
        } catch (err) {
            toastDismiss(loading);
            toastError(err?.message || "Impossible de bloquer cette adresse IP.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const details = [
        {
            label: "Incident",
            value: incidentTitle,
            valueClassName: "text-slate-900 font-semibold",
        },
        {
            label: "Adresse source",
            value: sourceIp,
            valueClassName: "text-slate-700 font-medium break-all",
        },
        {
            label: "Cible",
            value: target,
            valueClassName: "text-slate-700 font-medium",
        },
        {
            label: "Horodatage",
            value: time,
            valueClassName: "text-slate-700 font-medium",
        },
    ];

    return (
        <div className="fixed inset-0  flex items-center justify-center bg-slate-950/60 px-4 py-6 backdrop-blur-sm">
            <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
                <div className="border-b border-slate-200 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-800 px-6 py-5 text-white">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                            <div className="rounded-xl bg-red-500/15 p-3 ring-1 ring-inset ring-red-400/30">
                                <ShieldAlert size={20} className="text-red-300" />
                            </div>

                            <div>
                                <div className="mb-2 inline-flex items-center rounded-full border border-red-400/20 bg-red-500/10 px-2.5 py-1 text-xs font-medium text-red-200">
                                    Alerte sécurité
                                </div>
                                <h2 className="text-lg font-semibold tracking-tight">
                                    Analyse d’incident
                                </h2>
                                <p className="mt-1 text-sm text-slate-300">
                                    Consultez les informations de l’événement et appliquez
                                    une action défensive si nécessaire.
                                </p>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-lg p-2 text-slate-300 transition hover:bg-white/10 hover:text-white"
                            aria-label="Fermer la fenêtre"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>

                <div className="px-6 py-5">
                    <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">
                            Recommandation
                        </p>
                        <p className="mt-1 text-sm leading-6 text-amber-900">
                            Vérifiez la légitimité de la source avant blocage. Cette action
                            doit être réservée aux IPs identifiées comme malveillantes ou
                            abusives.
                        </p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                        {details.map(({ label, value, valueClassName }) => (
                            <div
                                key={label}
                                className="rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-slate-300 hover:bg-white"
                            >
                                <div className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                                    {label}
                                </div>
                                <p className={valueClassName}>{value}</p>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4 sm:flex-row sm:items-center sm:justify-end">
                    <button
                        type="button"
                        onClick={onClose}
                        className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-100"
                    >
                        Annuler
                    </button>

                    <button
                        type="button"
                        onClick={handleBlockIp}
                        disabled={isSubmitting || !data?.source}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-300"
                    >
                        <Ban size={16} />
                        {isSubmitting ? "Blocage..." : "Bloquer l’IP"}
                    </button>
                </div>
            </div>
        </div>
    );
}

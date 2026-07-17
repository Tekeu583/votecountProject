import { X, ShieldAlert, CheckCircle } from "lucide-react";
import { securityApi } from "@services/api";
import toast from 'react-hot-toast';
import { useState } from "react";

export default function SecurityModal({ data, onClose, onResolved }) {
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!data) return null;

    const handleResolve = async () => {
        if (isSubmitting || data.is_resolved) return;

        setIsSubmitting(true);
        try {
            await securityApi.resolveAlert(data.uuid);
            toast.success("Alerte marquée comme résolue");
            onResolved?.();
            onClose();
        } catch (err) {
            toast.error(err.response?.data?.message ?? "Impossible de résoudre cette alerte.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const details = [
        { label: "Type", value: data.type ?? '—' },
        { label: "Sévérité", value: data.severity_label ?? '—' },
        { label: "Adresse IP", value: data.ip_address ?? '—' },
        { label: "Appareil", value: data.device ?? '—' },
        { label: "Localisation", value: data.location ?? '—' },
        { label: "Élection", value: data.election?.title ?? '—' },
        { label: "Utilisateur", value: data.user?.full_name ?? '—' },
        { label: "Date", value: data.created_at ? new Date(data.created_at).toLocaleString('fr-FR') : '—' },
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
                                    Détail de l'alerte
                                </h2>
                                <p className="mt-1 text-sm text-slate-300">
                                    Consultez les informations de l'événement et marquez-le comme résolu si le traitement est terminé.
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
                    {data.metadata?.signals && (
                        <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">
                                Signaux de fraude
                            </p>
                            <p className="mt-1 text-sm leading-6 text-amber-900">
                                {Object.entries(data.metadata.signals).map(([k, v]) => `${k}: ${Number(v).toFixed(2)}`).join(' • ')}
                            </p>
                        </div>
                    )}

                    <div className="grid gap-3 sm:grid-cols-2">
                        {details.map(({ label, value }) => (
                            <div
                                key={label}
                                className="rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-slate-300 hover:bg-white"
                            >
                                <div className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                                    {label}
                                </div>
                                <p className="text-slate-700 font-medium break-all">{value}</p>
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
                        Fermer
                    </button>

                    {!data.is_resolved && (
                        <button
                            type="button"
                            onClick={handleResolve}
                            disabled={isSubmitting}
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-green-300"
                        >
                            <CheckCircle size={16} />
                            {isSubmitting ? "Résolution..." : "Marquer comme résolue"}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

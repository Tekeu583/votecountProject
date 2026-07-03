//src/components/ui/ConfirmModal.jsx
import { X, AlertTriangle, LoaderCircle } from "lucide-react";

export default function ConfirmModal({
    title = "Confirmation",
    message = "Êtes-vous sûr de vouloir continuer ?",
    onConfirm,
    onClose,
    loading = false,
    confirmText = "Confirmer",
    cancelText = "Annuler",
    type = "danger", // danger | warning | info
}) {

    // styles dynamiques selon type
    const typeStyles = {
        danger: {
            iconBg: "bg-red-100",
            iconColor: "text-red-500",
            button: "bg-red-500 hover:bg-red-600 text-white",
        },
        warning: {
            iconBg: "bg-yellow-100",
            iconColor: "text-yellow-500",
            button: "bg-yellow-500 hover:bg-yellow-600 text-white",
        },
        info: {
            iconBg: "bg-blue-100",
            iconColor: "text-blue-500",
            button: "bg-blue-500 hover:bg-blue-600 text-white",
        },
    };

    const styles = typeStyles[type] || typeStyles.danger;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">

            {/* OVERLAY */}
            <div
                onClick={onClose}
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />

            {/* MODAL */}
            <div className="relative w-full max-w-md mx-4 bg-white rounded-2xl shadow-lg p-6 animate-in fade-in zoom-in-95">

                {/* HEADER */}
                <div className="flex items-start gap-3 mb-4">

                    <div className={`p-2 rounded-full ${styles.iconBg}`}>
                        <AlertTriangle className={styles.iconColor} size={18} />
                    </div>

                    <div className="flex-1">
                        <h2 className="text-lg font-semibold">
                            {title}
                        </h2>
                        <p className="text-sm text-gray-600 mt-1">
                            {message}
                        </p>
                    </div>

                    <button
                        onClick={onClose}
                        className="p-2 rounded hover:bg-gray-100"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* ACTIONS */}
                <div className="flex justify-end gap-2 pt-2">

                    <button
                        onClick={onClose}
                        className="px-4 py-2 border rounded-md hover:bg-gray-50"
                    >
                        {cancelText}
                    </button>

                    <button
                        onClick={onConfirm}
                        disabled={loading}
                        className={`px-4 py-2 rounded-md flex items-center gap-2 ${styles.button} disabled:opacity-70`}
                    >
                        {loading && (
                            <LoaderCircle className="animate-spin" size={16} />
                        )}
                        {confirmText}
                    </button>

                </div>
            </div>
        </div>
    );
}
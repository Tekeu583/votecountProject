import { useState } from "react";
import PropTypes from "prop-types";
import { X, Loader2, Mail } from "lucide-react";
import { notificationsApi, usersApi } from "@services/api";
import TextInput from "@components/ui/TextInput";

// data = notification existante (lecture seule) ; sinon, formulaire d'envoi.
export default function NotificationModal({
    data,
    onClose,
    onSuccess,
    onError,
}) {
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        email: '',
        title: '',
        message: '',
    });

    const handleChange = (field, value) => {
        setForm({ ...form, [field]: value });
    };

    const validate = () => {
        if (!form.email.trim()) return "L'email du destinataire est requis";
        if (!form.title.trim()) return "Le titre est requis";
        if (!form.message.trim() || form.message.trim().length < 5) return "Message trop court (min 5 caractères)";
        return null;
    };

    const handleSubmit = async () => {
        const validationError = validate();
        if (validationError) {
            onError(validationError);
            return;
        }
        setLoading(true);

        try {
            // Le destinataire doit être un compte existant : on le retrouve par email.
            const res = await usersApi.getAll(1, 5, { search: form.email.trim() });
            const list = res.data?.data?.data ?? res.data?.data ?? [];
            const match = list.find(u => u.email?.toLowerCase() === form.email.trim().toLowerCase());

            if (!match) {
                onError("Aucun utilisateur trouvé avec cet email.");
                setLoading(false);
                return;
            }

            await notificationsApi.create({
                user_uuid: match.uuid,
                title: form.title,
                message: form.message,
            });
            onSuccess("Notification envoyée avec succès");
            onClose();
        } catch (err) {
            onError(err.response?.data?.message ?? "Une erreur est survenue lors de l'envoi");
        } finally {
            setLoading(false);
        }
    };

    // ── Mode lecture seule : affiche une notification déjà envoyée ──
    if (data) {
        return (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                <div className="bg-[var(--color-background-white)] w-full max-w-lg rounded-[var(--radius-md)] shadow-[var(--shadow-md)] overflow-hidden">
                    <div className="flex justify-between items-center p-4 border-b border-b-[var(--color-gray-light)]">
                        <h2 className="font-semibold text-lg">Notification</h2>
                        <button onClick={onClose} className="hover:opacity-70 transition"><X /></button>
                    </div>
                    <div className="p-4 space-y-3">
                        <p><span className="font-medium">Destinataire : </span>{data.user?.full_name ?? '—'} ({data.user?.email ?? '—'})</p>
                        <p><span className="font-medium">Titre : </span>{data.title}</p>
                        <p className="whitespace-pre-wrap"><span className="font-medium">Message : </span>{data.message}</p>
                        <p className="text-sm text-gray-500">
                            {data.is_read ? `Lue le ${new Date(data.read_at).toLocaleString('fr-FR')}` : 'Non lue'}
                        </p>
                    </div>
                    <div className="flex justify-end gap-2 p-4 border-t border-t-[var(--color-gray-light)] bg-gray-50">
                        <button onClick={onClose} className="btn-secondary">Fermer</button>
                    </div>
                </div>
            </div>
        );
    }

    // ── Mode envoi ──
    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-[var(--color-background-white)] w-full max-w-lg rounded-[var(--radius-md)] shadow-[var(--shadow-md)] overflow-hidden">
                <div className="flex justify-between items-center p-4 border-b border-b-[var(--color-gray-light)]">
                    <h2 className="font-semibold text-lg">Envoyer une notification</h2>
                    <button onClick={onClose} className="hover:opacity-70 transition"><X /></button>
                </div>

                <div className="p-4 space-y-4">
                    <TextInput
                        value={form.email}
                        type="email"
                        name="email"
                        className="w-full mt-1"
                        label="Destinataire (email d'un utilisateur existant)"
                        iconLeft={Mail}
                        required
                        onChange={(e) => handleChange('email', e.target.value)}
                        placeholder="destinataire@email.com"
                        disabled={loading}
                    />
                    <TextInput
                        value={form.title}
                        type="text"
                        name="title"
                        className="w-full mt-1"
                        label="Titre"
                        required
                        onChange={(e) => handleChange('title', e.target.value)}
                        placeholder="Titre de la notification"
                        disabled={loading}
                    />
                    <div>
                        <label htmlFor="message" className="text-xs text-gray-800 capitalize">message</label>
                        <textarea
                            className="input w-full mt-1"
                            rows={5}
                            id="message"
                            name="message"
                            value={form.message}
                            onChange={(e) => handleChange("message", e.target.value)}
                            placeholder="Contenu de la notification..."
                            disabled={loading}
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-2 p-4 border-t border-t-[var(--color-gray-light)] bg-gray-50">
                    <button onClick={onClose} className="btn-secondary" disabled={loading}>Annuler</button>
                    <button
                        onClick={handleSubmit}
                        className="btn-primary flex items-center gap-2"
                        disabled={loading}
                    >
                        {loading && <Loader2 size={16} className="animate-spin" />}
                        {loading ? "Envoi..." : "Envoyer"}
                    </button>
                </div>
            </div>
        </div>
    );
}

NotificationModal.propTypes = {
    data: PropTypes.shape({
        uuid: PropTypes.string,
        title: PropTypes.string,
        message: PropTypes.string,
        is_read: PropTypes.bool,
        read_at: PropTypes.string,
        user: PropTypes.shape({ full_name: PropTypes.string, email: PropTypes.string }),
    }),
    onClose: PropTypes.func.isRequired,
    onSuccess: PropTypes.func,
    onError: PropTypes.func,
};

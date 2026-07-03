import { useState } from "react";
import PropTypes from "prop-types";
import { X, Loader2, User } from "lucide-react";
import { notificationsApi } from "@services/api";
import TextInput from "@components/ui/TextInput";
export default function NotificationModal({
    data,
    onClose,
    onSuccess,
    onError,
}) {
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        id: data?.id || null,
        name: data?.name || "ServiceVoteCount",
        destinataire: data?.destinataire || "",
        subject: data?.subject || "",
        message: data?.message || "",
    });
    const handleChange = (field, value) => {
        setForm({ ...form, [field]: value });
    };

    //Validation
    const validate = () => {
        if (!form.message.trim()) {
            return "Le message est requis";
        }
        if (form.message.trim().length < 5) {
            return "Message trop court (min 5 caractères)";
        }
        if (!form.subject.trim()) {
            return "L'subject est requis";
        }
        return null;
    };

    //Submit handler
    const handleSubmit = async () => {
        const validationError = validate();

        if (validationError) {
            onError(validationError);
            return;
        }
        setLoading(true);

        try {
            if (data) {
                await notificationsApi.update(data.id, form);
                onSuccess("Notification repondue avec succès");
                onClose();
            } else {
                await notificationsApi.create(form);
                onSuccess("Notification envoye avec succès");
                onClose();
            }
        } catch (err) {
            onError(`"Une erreur est survenue lors de l’envoi ${err || ""}"`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-[var(--color-background-white)] w-full max-w-lg rounded-[var(--radius-md)] shadow-[var(--shadow-md)] overflow-hidden">
                {/* HEADER */}
                <div className="flex justify-between items-center p-4 border-b border-b-[var(--color-gray-light)]">
                    <h2 className="font-semibold text-lg">
                        Répondre à la notification
                    </h2>
                    <button
                        onClick={onClose}
                        className="hover:opacity-70 transition"
                    >
                        <X />
                    </button>
                </div>

                <div className="p-4 space-y-4">
                    <div >
                        <TextInput
                            value={form.name}
                            type="text"
                            name="name"
                            className="w-full mt-1"
                            label="Nom"
                            iconLeft={User}
                            required
                            onChange={(e) => handleChange('name', e.target.value)}
                            placeholder="Nom"
                        />
                    </div>
                    {/* Destinataire */}
                    <div>
                        <TextInput
                            value={form.destinataire}
                            type="email"
                            name="destinataire"
                            className="w-full mt-1"
                            label="Destinataire"
                            required
                            onChange={(e) => handleChange('destinataire', e.target.value)}
                            placeholder="Destinataire@gmail.com"
                        />
                    </div>
                    {/* subject modifiable */}
                    <div>
                        <TextInput
                            value={form.subject}
                            type="text"
                            name="subject"
                            className="w-full mt-1"
                            label="Subject"
                            required
                            onChange={(e) => handleChange('subject', e.target.value)}
                            placeholder="Objet du message"
                            disabled={loading}
                        />
                    </div>
                    <div>
                        <label htmlFor="message" className="text-xs text-gray-800 capitalize">message</label>
                        <textarea
                            className="input w-full mt-1"
                            rows={5}
                            id="message"
                            name="message"
                            value={form.message}
                            onChange={(e) => handleChange("message", e.target.value)}
                            placeholder="Votre réponse..."
                            disabled={loading}
                        />
                    </div>
                </div>

                {/* FOOTER */}
                <div className="flex justify-end gap-2 p-4 border-t border-t-[var(--color-gray-light)] bg-gray-50">

                    <button
                        onClick={onClose}
                        className="btn-secondary"
                        disabled={loading}
                    >
                        Annuler
                    </button>

                    <button
                        onClick={handleSubmit}
                        className="btn-primary flex items-center gap-2"
                        disabled={loading}
                    >
                        {loading && (
                            <Loader2 size={16} className="animate-spin" />
                        )}
                        {loading ? "Envoi..." : "Envoyer"}
                    </button>

                </div>
            </div>
        </div>
    );
}

NotificationModal.propTypes = {
    data: PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
        destinataire: PropTypes.string.isRequired,
        subject: PropTypes.string,
        message: PropTypes.string,
        name: PropTypes.string
    }),
    onClose: PropTypes.func.isRequired,
    onSuccess: PropTypes.func,
    onError: PropTypes.func,
};
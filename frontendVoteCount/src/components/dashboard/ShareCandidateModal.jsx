// src/components/dashboard/ShareCandidateModal.jsx
import { useState } from "react";
import PropTypes from "prop-types";
import { X, Share2, Facebook, Twitter, Send, MessageCircle, Copy, Check } from "lucide-react";
import toast from "react-hot-toast";

/**
 * Partage du lien de campagne d'un candidat.
 *
 * Le lien pointe vers la page publique du candidat, qui n'affiche que lui :
 * les personnes qui le reçoivent ne voient pas ses concurrents. Le paramètre
 * `from=share` sert à la page cible pour renvoyer vers la liste des élections
 * quand on clique sur « Retour » (un onglet ouvert depuis WhatsApp n'a aucun
 * historique de navigation).
 */
export default function ShareCandidateModal({ shareUrl, candidateName, electionTitle, onClose }) {
    const [copied, setCopied] = useState(false);

    const message = `Soutenez ${candidateName} pour « ${electionTitle} » — votez ici :`;

    const channels = [
        {
            key: 'whatsapp',
            label: 'WhatsApp',
            icon: MessageCircle,
            style: 'bg-green-50 text-green-600 hover:bg-green-100',
            url: `https://wa.me/?text=${encodeURIComponent(`${message} ${shareUrl}`)}`,
        },
        {
            key: 'facebook',
            label: 'Facebook',
            icon: Facebook,
            style: 'bg-blue-50 text-blue-600 hover:bg-blue-100',
            url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
        },
        {
            key: 'x',
            label: 'X',
            icon: Twitter,
            style: 'bg-gray-100 text-gray-900 hover:bg-gray-200',
            url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}&url=${encodeURIComponent(shareUrl)}`,
        },
        {
            key: 'telegram',
            label: 'Telegram',
            icon: Send,
            style: 'bg-sky-50 text-sky-600 hover:bg-sky-100',
            url: `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(message)}`,
        },
    ];

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            toast.success('Lien copié.');
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // navigator.clipboard exige HTTPS (ou localhost) : hors de ce cadre
            // on laisse l'utilisateur copier le lien affiché à l'écran.
            toast.error("Copie impossible ici — sélectionnez le lien ci-dessous.");
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
                onClick={onClose}
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />

            <div className="relative w-full max-w-md mx-4 bg-white rounded-2xl shadow-lg p-6 animate-in fade-in zoom-in-95">
                <div className="flex items-start gap-3 mb-5">
                    <div className="p-2 rounded-full bg-blue-100">
                        <Share2 className="text-blue-500" size={18} />
                    </div>

                    <div className="flex-1">
                        <h2 className="text-lg font-semibold">Partager ma campagne</h2>
                        <p className="text-sm text-gray-600 mt-1">
                            Vos contacts arrivent sur une page dédiée où ils ne voient
                            que vous, et peuvent voter directement.
                        </p>
                    </div>

                    <button onClick={onClose} className="p-2 rounded hover:bg-gray-100" aria-label="Fermer">
                        <X size={16} />
                    </button>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-5">
                    {channels.map((channel) => (
                        <a
                            key={channel.key}
                            href={channel.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-colors ${channel.style}`}
                        >
                            <channel.icon size={18} />
                            {channel.label}
                        </a>
                    ))}
                </div>

                <div className="flex items-center gap-2 p-2 pl-3 bg-gray-50 border border-gray-200 rounded-xl">
                    <span className="flex-1 text-xs text-gray-600 truncate" title={shareUrl}>
                        {shareUrl}
                    </span>
                    <button
                        onClick={handleCopy}
                        className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[var(--color-primary)] text-white text-sm font-medium hover:opacity-90"
                    >
                        {copied ? <Check size={15} /> : <Copy size={15} />}
                        {copied ? 'Copié' : 'Copier'}
                    </button>
                </div>
            </div>
        </div>
    );
}

ShareCandidateModal.propTypes = {
    shareUrl: PropTypes.string.isRequired,
    candidateName: PropTypes.string.isRequired,
    electionTitle: PropTypes.string.isRequired,
    onClose: PropTypes.func.isRequired,
};

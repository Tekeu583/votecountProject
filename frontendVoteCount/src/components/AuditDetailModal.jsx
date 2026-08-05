import { useEffect, useMemo, useState } from 'react';
import { X, Search, ArrowRight } from 'lucide-react';
import TextInput from '@components/ui/TextInput';

const ACTION_COLORS = {
    created: 'bg-green-100 text-green-700',
    updated: 'bg-amber-100 text-amber-700',
    deleted: 'bg-red-100 text-red-700',
    restored: 'bg-blue-100 text-[var(--color-primary)]',
};

// Au-delà de cette longueur, la valeur est repliée derrière « Voir tout » :
// une biographie ou un manifeste rendrait sinon la liste illisible.
const LONG_VALUE = 160;

/** Valeur d'un champ — repliée si trop longue. */
function FieldValue({ value, tone }) {
    const [expanded, setExpanded] = useState(false);

    if (value === null || value === undefined || value === '') {
        return <span className="italic text-[var(--color-gray)]">vide</span>;
    }

    const isLong = value.length > LONG_VALUE;
    const shown = isLong && !expanded ? `${value.slice(0, LONG_VALUE)}…` : value;

    return (
        <span className={tone}>
            <span className="break-words whitespace-pre-wrap">{shown}</span>
            {isLong && (
                <button
                    type="button"
                    onClick={() => setExpanded(!expanded)}
                    className="ml-1 text-xs text-[var(--color-primary)] hover:underline whitespace-nowrap"
                >
                    {expanded ? 'Réduire' : 'Voir tout'}
                </button>
            )}
        </span>
    );
}

export default function AuditDetailModal({ log, onClose }) {
    const [query, setQuery] = useState('');

    // Fermeture au clavier : une modale que seule la souris peut fermer piège
    // l'utilisateur qui navigue au clavier.
    useEffect(() => {
        const onKeyDown = (e) => {
            if (e.key === 'Escape') onClose();
        };

        window.addEventListener('keydown', onKeyDown);

        return () => window.removeEventListener('keydown', onKeyDown);
    }, [onClose]);

    const changes = useMemo(() => {
        const all = log.changes ?? [];
        const q = query.trim().toLowerCase();

        if (!q) return all;

        return all.filter(
            (c) =>
                c.label.toLowerCase().includes(q) ||
                c.field.toLowerCase().includes(q),
        );
    }, [log.changes, query]);

    const total = log.changes?.length ?? 0;

    return (
        <div
            className="fixed inset-0 bg-[var(--color-dark)]/40 flex items-center justify-center text-[var(--text-primary)] z-50 p-4"
            onClick={onClose}
        >
            <div
                className="bg-[var(--color-white)] rounded-[var(--radius-md)] w-full max-w-2xl relative flex flex-col max-h-[85vh]"
                onClick={(e) => e.stopPropagation()}
            >
                {/* En-tête — fixe */}
                <div className="p-6 pb-4 border-b border-[var(--color-gray-light)]">
                    <button onClick={onClose} className="absolute top-4 right-4" aria-label="Fermer">
                        <X />
                    </button>

                    <div className="flex items-center gap-2 mb-2 pr-8">
                        <span
                            className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${
                                ACTION_COLORS[log.action] ?? 'bg-gray-100 text-gray-700'
                            }`}
                        >
                            {log.action_label}
                        </span>
                        <h2 className="font-bold">
                            {log.entity_label} #{log.entity_id}
                        </h2>
                    </div>

                    <p className="text-sm text-[var(--color-gray)]">
                        {new Date(log.created_at).toLocaleString('fr-FR')}
                        {' • '}
                        {log.user?.name ?? 'Système'}
                        {log.ip_address ? ` • ${log.ip_address}` : ''}
                    </p>
                </div>

                {/* Recherche — utile dès qu'une création journalise 30+ champs */}
                {total > 8 && (
                    <div className="px-6 pt-4">
                        <TextInput
                            type="text"
                            placeholder="Rechercher un champ..."
                            iconLeft={Search}
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            className="w-full pl-11 pr-4 py-2 border border-[var(--color-gray-light)] rounded-[var(--radius-md)] focus:outline-none focus:border-[var(--color-primary)]"
                        />
                    </div>
                )}

                {/* Liste — seule zone défilante */}
                <div className="flex-1 overflow-y-auto px-6 py-4">
                    {changes.length === 0 ? (
                        <p className="text-center text-[var(--color-gray)] py-8">
                            {total === 0 ? 'Aucun détail enregistré.' : 'Aucun champ ne correspond.'}
                        </p>
                    ) : (
                        <ul className="divide-y divide-[var(--color-gray-light)]">
                            {changes.map((c) => (
                                <li key={c.field} className="py-3">
                                    <p className="font-medium text-gray-900 text-sm mb-1">{c.label}</p>

                                    {/* Une création n'a pas d'état précédent : afficher une
                                        flèche « vide → valeur » serait du bruit. */}
                                    {log.action === 'created' ? (
                                        <FieldValue value={c.new} tone="text-sm text-gray-700" />
                                    ) : (
                                        <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-2 text-sm">
                                            <FieldValue value={c.old} tone="text-[var(--color-gray)] line-through decoration-red-300" />
                                            <ArrowRight size={14} className="shrink-0 mt-1 text-[var(--color-gray)] hidden sm:block" />
                                            <FieldValue value={c.new} tone="text-green-700 font-medium" />
                                        </div>
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* Pied — fixe */}
                <div className="px-6 py-3 border-t border-[var(--color-gray-light)] flex items-center justify-between">
                    <p className="text-sm text-[var(--color-gray)]">
                        {query ? `${changes.length} sur ${total}` : `${total}`} champ{total > 1 ? 's' : ''}
                    </p>
                    <button onClick={onClose} className="btn-secondary px-4 py-2">
                        Fermer
                    </button>
                </div>
            </div>
        </div>
    );
}

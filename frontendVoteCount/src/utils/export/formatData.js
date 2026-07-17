export const formatAuditLogs = (data) => {
    return data.map((row) => ({
        'Date & Heure': row.created_at,
        'Entité': row.entity_label,
        'Action': row.action_label,
        'Utilisateur': row.user?.name ?? '—',
        'Adresse IP': row.ip_address ?? '—',
        'Anciennes valeurs': row.old_values ? JSON.stringify(row.old_values) : '',
        'Nouvelles valeurs': row.new_values ? JSON.stringify(row.new_values) : '',
    }));
};

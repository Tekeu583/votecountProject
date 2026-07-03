export const formatAuditLogs = (data) => {
    return data.map((row) => {
        let metadataStr = '';
        if (row.metadata) {
            try {
                metadataStr = JSON.stringify(row.metadata);
            } catch {
                metadataStr = 'Erreur JSON';
            }
        }

        return {
            'Date & Heure': row.created_at,
            'Type': row.type,
            'Action': row.action,
            'Organisation': row.organization,
            'Utilisateur': row.user,
            'Statut': row.status,
            'Adresse IP': row.ip_address,
            'Metadata': metadataStr,
        };
    });
};

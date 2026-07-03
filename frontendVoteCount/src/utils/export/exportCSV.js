const escapeCsvField = (field) => {
    if (field == null) return '';
    const str = String(field);
    if (/[",\n\r]/.test(str)) {
        return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
};

export const exportCSV = (rows, filename) => {
    const headers = Object.keys(rows[0]);
    const now = new Date().toLocaleString();
    const csv = [
        'Audit Logs Report',
        `Généré le : ${now}`,
        '',
        headers.join(','),
        ...rows.map(row =>
            headers.map(h => escapeCsvField(row[h])).join(',')
        ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = filename + '.csv';
    link.click();

    URL.revokeObjectURL(url);
};

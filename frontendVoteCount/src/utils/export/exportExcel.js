
import { utils, writeFile } from 'xlsx';

export const exportExcel = (rows, filename) => {
    const headers = Object.keys(rows[0]);

    const now = new Date().toLocaleString();

    //Construction manuelle feuille
    const sheetData = [
        ['Audit Logs Report'],
        [`Généré le : ${now}`],
        [],
        headers,
        ...rows.map(row => headers.map(h => row[h])),
    ];

    const ws = utils.aoa_to_sheet(sheetData);

    //Fusion cellule pour titre
    ws['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: headers.length - 1 } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: headers.length - 1 } },
    ];

    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, 'AuditLogs');

    writeFile(wb, filename + '.xlsx');
};
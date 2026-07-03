
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const exportPDF = (rows, filename) => {
    if (!rows || rows.length === 0) return;

    const doc = new jsPDF({
        orientation: 'landscape',
    });

    const headers = Object.keys(rows[0]);

    const body = rows.map(row => headers.map(h => row[h]));

    //Titre du document (header visuel)
    doc.setFontSize(14);
    doc.text('Audit Logs Report', 14, 15);

    //Tableau avec entête visible
    autoTable(doc, {
        head: [headers],
        body: body,

        startY: 20,

        styles: {
            fontSize: 8,
        },

        headStyles: {
            fillColor: [41, 128, 185],
            textColor: 255,
            halign: 'center',
        },

        bodyStyles: {
            halign: 'left',
        },

        didDrawPage: (data) => {
            // numéro de page
            const pageCount = doc.getNumberOfPages();
            doc.setFontSize(10);
            doc.text(
                `Page ${doc.internal.getCurrentPageInfo().pageNumber} / ${pageCount}`,
                data.settings.margin.left,
                doc.internal.pageSize.height - 10
            );
        },
    });

    doc.save(filename + '.pdf');
};


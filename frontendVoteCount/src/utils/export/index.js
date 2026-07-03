import { exportCSV } from './exportCSV';
import { exportExcel } from './exportExcel';
import { exportPDF } from './exportPDF';

export const exportMap = {
    csv: exportCSV,
    excel: exportExcel,
    pdf: exportPDF,
};

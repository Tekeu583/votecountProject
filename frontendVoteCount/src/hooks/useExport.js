import { exportMap } from '@/utils/export';
import toast from 'react-hot-toast';

export const useExport = () => {

    const handleExport = ({ type, datas, formatter, filename }) => {
        if (!datas || datas.length === 0) {
            toast.error('Aucune donnée à exporter');
            return;
        }

        const rows = formatter ? formatter(datas) : datas;

        const exporter = exportMap[type];

        if (!exporter) {
            toast.error('Format non supporté');
            return;
        }

        exporter(rows, filename);

        toast.success(`Export ${type.toUpperCase()} réussi `);
    };

    return { handleExport };
};
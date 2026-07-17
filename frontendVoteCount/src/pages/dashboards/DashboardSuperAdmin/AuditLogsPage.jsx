import { useState, useEffect, useCallback } from 'react';
import {
  Download,
  Info,
  Eye,
  X,
  Search,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import TextInput from '@components/ui/TextInput';

import { useExport } from '@/hooks/useExport';
import { formatAuditLogs } from '@/utils/export/formatData';
import { auditApi, organizationsApi } from '@services/api';

const ACTION_OPTIONS = [
  { value: 'created', label: 'Créé' },
  { value: 'updated', label: 'Modifié' },
  { value: 'deleted', label: 'Supprimé' },
  { value: 'restored', label: 'Restauré' },
  { value: 'forceDeleted', label: 'Supprimé définitivement' },
];

const MetadataCell = ({ log }) => (
  <button
    onClick={() =>
      toast(
        <pre className="bg-black text-white p-3 rounded text-xs max-w-xs overflow-auto">
          {JSON.stringify({ avant: log.old_values, après: log.new_values }, null, 2)}
        </pre>
      )
    }
  >
    <Info size={16} />
  </button>
);

// Empêche un appel API à chaque frappe : attend 400ms d'inactivité.
function useDebounce(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

const EMPTY_PAGE = {
  data: [],
  meta: { current_page: 1, last_page: 1, per_page: 15, total: 0, from: 0, to: 0 },
};

const AuditLogsPage = () => {
  const { handleExport } = useExport();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [actionFilter, setActionFilter] = useState('');
  const [orgFilter, setOrgFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm);
  const [page, setPage] = useState(1);
  const itemsPerPage = 15;

  const [logs, setLogs] = useState(EMPTY_PAGE);
  const [loading, setLoading] = useState(false);
  const [organizations, setOrganizations] = useState([]);

  useEffect(() => {
    organizationsApi.getAll({ per_page: 100 })
      .then(res => setOrganizations(res.data?.data ?? []))
      .catch(() => setOrganizations([]));
  }, []);

  const fetchAudits = useCallback(async () => {
    setLoading(true);
    try {
      const response = await auditApi.getAll({
        page,
        per_page: itemsPerPage,
        ...(actionFilter ? { action: actionFilter } : {}),
        ...(orgFilter ? { organization_uuid: orgFilter } : {}),
        ...(debouncedSearch ? { search: debouncedSearch } : {}),
      });
      setLogs({
        data: response.data?.data ?? [],
        meta: response.data?.meta ?? EMPTY_PAGE.meta,
      });
    } catch (error) {
      toast.error(error.response?.data?.message ?? "Impossible de charger les journaux d'audit");
      setLogs(EMPTY_PAGE);
    } finally {
      setLoading(false);
    }
  }, [page, actionFilter, orgFilter, debouncedSearch]);

  useEffect(() => { fetchAudits(); }, [fetchAudits]);
  useEffect(() => { setPage(1); }, [actionFilter, orgFilter, debouncedSearch]);

  const handleResetFilters = () => {
    setSearchTerm('');
    setOrgFilter('');
    setActionFilter('');
    setPage(1);
  };

  //Fonction unique d’export — exporte la page actuellement chargée.
  const handleExportClick = (type) => {
    handleExport({
      type,
      datas: logs.data,
      formatter: formatAuditLogs,
      filename: `audit_logs_${new Date().toISOString().slice(0, 10)}`
    });
  };

  const { data: items, meta } = logs;

  return (
    <div className="flex-1 flex flex-col bg-[var(--color-background-white)]">
      <div className="flex-1 p-2">

        {/* HEADER */}
        <div className="flex  justify-between mb-6">
          <div className='p-2'>
            <h1 className="text-2xl font-bold">Journaux d'Audit</h1>
            <p className="text-sm text-gray-500">Traçabilité complète</p>
          </div>
          <div className="relative p-2">
            <button
              onClick={() => setDropdownOpen(true)}
              className="btn-primary flex items-center gap-2"
            >
              <Download size={16} />
              Exporter
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-[var(--color-gray-light)] rounded shadow-md z-10">
                <button
                  className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                  onClick={() => setDropdownOpen(false)}
                  aria-label="Fermer le menu"
                >
                  <X size={20} />
                </button>
                <label htmlFor="exportSelect" className="sr-only">Télécharger</label>
                <select
                  id="exportSelect"
                  className="w-full px-4 py-2 mt-6 rounded cursor-pointer text-gray-700"
                  defaultValue=""
                  onChange={(e) => {
                    const format = e.target.value;
                    if (format) {
                      handleExportClick(format);
                      e.target.value = "";
                      setDropdownOpen(false);
                    }
                  }}
                >
                  <option value="" disabled>Télécharger</option>
                  <option value="csv">CSV</option>
                  <option value="excel">Excel</option>
                  <option value="pdf">PDF</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* FILTER */}

        <div className="p-4 bg-[var(--color-background-white)] rounded-[--radius-md] flex flex-col gap-3 md:flex-row lg:items-center">
          <div className="relative w-full lg:w-2/3">
            <TextInput
              iconLeft={Search}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 w-full"
              placeholder="Rechercher (action, entité)..." />
          </div>

          <div className="flex gap-2 w-full min-w-[200px] lg:w-auto">
            <select
              value={orgFilter}
              onChange={(e) => setOrgFilter(e.target.value)}
              className="input w-full">
              <option value=''>Toutes les organisations</option>
              {organizations.map(org => (
                <option key={org.uuid} value={org.uuid}>{org.name}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2 w-full min-w-[200px] lg:w-auto">
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="input w-full">
              <option value=''>Toutes les actions</option>
              {ACTION_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <button
            onClick={handleResetFilters}
            className="flex items-center gap-2 btn-secondary whitespace-nowrap group"
          >
            <RefreshCw
              size={16}
              className="transition-transform duration-300 group-hover:rotate-180"
            />
            Réinitialiser
          </button>
        </div>

        {/* TABLE DESKTOP */}
        <div className="bg-[var(--color-white)] rounded-[var(--radius-md)] shadow-[var(--shadow-md)] overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead className="bg-[var(--color-gray-light)] text-xs uppercase">
              <tr>
                <th className="px-4 py-2 text-left">Date & Heure</th>
                <th className='px-4 py-2 text-left'>Entité</th>
                <th className='px-4 py-2 text-left'>Action</th>
                <th className='px-4 py-2 text-left'>Utilisateur</th>
                <th className='px-4 py-2 text-left'>Address IP</th>
                <th className='px-4 py-2 text-left'>Détails</th>
              </tr>
            </thead>

            <tbody>
              {loading && (
                <tr><td colSpan={6} className="p-6 text-center text-[var(--color-gray)]">Chargement...</td></tr>
              )}
              {!loading && items.map((log) => (
                <tr key={log.uuid} className="border-t border-t-[var(--color-gray-light)] hover:bg-[var(--color-gray-light)] items-center">
                  <td className="px-4 py-2 whitespace-nowrap">
                    {log.created_at ? new Date(log.created_at).toLocaleString('fr-FR') : '—'}
                  </td>
                  <td className='px-4 py-2'>{log.entity_label}</td>
                  <td className='px-4 py-2'>{log.action_label}</td>
                  <td className='px-4 py-2'>{log.user?.name ?? '—'}</td>
                  <td className='px-4 py-2'>{log.ip_address ?? '—'}</td>
                  <td className='text-center' >
                    <MetadataCell log={log} />
                  </td>
                </tr>
              ))}
              {!loading && items.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-[var(--color-gray)]">
                    Aucun journal d'audit trouvé
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        {!loading && meta.total > 0 && (
          <div className="flex flex-col lg:flex-row justify-between items-center p-4 text-sm gap-3">
            <span className="text-[var(--color-gray)]">
              Affichage de {meta.from} à {meta.to} sur {meta.total}
            </span>

            <div className="flex gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1 border rounded disabled:opacity-50"><ChevronLeft size={16} /></button>
              <span className="px-3 py-1 bg-[var(--color-primary)] text-white rounded">
                {meta.current_page} / {meta.last_page}
              </span>
              <button
                disabled={page === meta.last_page}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1 border rounded disabled:opacity-50"><ChevronRight size={16} /></button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditLogsPage;

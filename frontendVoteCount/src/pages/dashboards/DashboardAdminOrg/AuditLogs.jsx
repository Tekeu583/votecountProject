import React, { useState, useEffect, useCallback } from 'react';
import {
  Download,
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import TextInput from '@components/ui/TextInput';
import toast from 'react-hot-toast';
import { FadeLoader } from 'react-spinners';
import { useDebounce } from '@hooks/useDebounce';
import { useOrg } from '@hooks/useOrg';
import { auditApi } from '@services/api';

const ACTION_OPTIONS = [
  { value: '', label: 'Tous les types' },
  { value: 'created', label: 'Créé' },
  { value: 'updated', label: 'Modifié' },
  { value: 'deleted', label: 'Supprimé' },
  { value: 'restored', label: 'Restauré' },
];

const ACTION_COLORS = {
  created: 'bg-green-100 text-green-700',
  updated: 'bg-amber-100 text-amber-700',
  deleted: 'bg-red-100 text-red-700',
  restored: 'bg-blue-100 text-[var(--color-primary)]',
};

const AuditLogs = () => {
  const { org } = useOrg();
  const [actionFilter, setActionFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 400);
  const [dateFilter, setDateFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState([]);
  const [meta, setMeta] = useState({ total: 0, last_page: 1 });

  const loadLogs = useCallback(async () => {
    if (!org?.uuid) return;
    setLoading(true);
    try {
      const res = await auditApi.getAll({
        organization_uuid: org.uuid,
        action: actionFilter || undefined,
        search: debouncedSearch || undefined,
        date_from: dateFilter || undefined,
        date_to: dateFilter || undefined,
        page: currentPage,
        per_page: 10,
      });
      setLogs(res.data?.data ?? []);
      setMeta(res.data?.meta ?? { total: 0, last_page: 1 });
    } catch {
      toast.error('Erreur de chargement des journaux d\'audit');
    } finally {
      setLoading(false);
    }
  }, [org?.uuid, actionFilter, debouncedSearch, dateFilter, currentPage]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  // Fonction d'export CSV — exporte la page actuellement affichée.
  const handleExportCSV = () => {
    const headers = ['Date', 'Utilisateur', 'Action', 'Détails', 'Adresse IP'];

    const csvContent = [
      headers.join(','),
      ...logs.map(log => [
        `"${new Date(log.created_at).toLocaleString('fr-FR')}"`,
        `"${log.user?.name ?? '—'}"`,
        `"${log.action_label}"`,
        `"${log.entity_label} #${log.entity_id}"`,
        `"${log.ip_address ?? ''}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = `Audit_Log_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Export téléchargé avec succès');
  };

  const resetFilters = () => {
    setActionFilter('');
    setSearchTerm('');
    setDateFilter('');
    setCurrentPage(1);
  };

  return (
    <div className="flex-1 bg-[var(--color-background-white)] p-2">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex-1">
          <h1 className="text-2xl md:text-3xl font-semibold text-[var(--color-dark)]">
            Journaux d'audit de l'organisation
          </h1>
          <p className="text-[var(--color-gray)] mt-1 text-sm md:text-base">
            Suivi complet des activités et actions des utilisateurs
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          disabled={logs.length === 0}
          className="flex items-center justify-center gap-2 bg-[var(--color-white)] border border-[var(--color-gray-light)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] px-4 py-2 rounded-[var(--radius-md)] font-medium transition-colors w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download size={16} />
          Exporter CSV
        </button>
      </div>

      {/* Filtres */}
      <div className="bg-[var(--color-white)] rounded-[var(--radius-md)] shadow-[var(--shadow-md)] p-6 mb-8">
        <div className="grid grid-cols-1 gap-4  md:grid-cols-2 lg:grid-cols-4">
          {/* Type d'activité */}
          <div >
            <label htmlFor='type' className="block text-sm font-medium text-[var(--color-gray)] mb-2">TYPE D'ACTIVITÉ</label>
            <select
              id='type'
              value={actionFilter}
              onChange={(e) => { setActionFilter(e.target.value); setCurrentPage(1); }}
              className="w-full border border-[var(--color-gray-light)] rounded-[var(--radius-md)] px-4 py-3 focus:outline-none focus:border-[var(--color-primary)]"
            >
              {ACTION_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          {/* Recherche */}
          <div>
            <label htmlFor='name' className="block text-sm font-medium text-[var(--color-gray)] mb-2">RECHERCHE</label>
            <div className="relative">
              <TextInput
                id='name'
                type="text"
                placeholder="Action ou type de ressource..."
                iconLeft={Search}
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className="w-full pl-11 pr-4 py-3 border border-[var(--color-gray-light)] rounded-[var(--radius-md)] focus:outline-none focus:border-[var(--color-primary)]"
              />
            </div>
          </div>

          {/* Période */}
          <div>
            <label htmlFor='date' className="block text-sm font-medium text-[var(--color-gray)] mb-2">DATE</label>
            <TextInput
              id='date'
              type="date"
              value={dateFilter}
              onChange={(e) => { setDateFilter(e.target.value); setCurrentPage(1); }}
              className="w-full border border-[var(--color-gray-light)] rounded-[var(--radius-md)] px-4 py-3 focus:outline-none focus:border-[var(--color-primary)]"
            />
          </div>

          {/* Boutons d'action */}
          <div className="flex items-end P-1">
            <button
              onClick={resetFilters}
              className="flex items-center btn-secondary gap-2 font-medium h-12"
            >
              <RefreshCw size={16} />
              Réinitialiser
            </button>
          </div>
        </div>
      </div>

      {/* Tableau des logs */}
      <div className="bg-[var(--color-white)] rounded-[var(--radius-md)] shadow-[var(--shadow-md)] overflow-x-auto  min-w-[300px]">
        <table className="w-full overflow-x-auto">
          <thead>
            <tr className="bg-[var(--color-gray-light)]  border-b border-b-[var(--color-gray-light)]">
              <th className="text-left py-2 px-2 font-medium text-[var(--color-dark)]">DATE & HEURE</th>
              <th className="text-left py-2 px-2 font-medium text-[var(--color-dark)]">UTILISATEUR</th>
              <th className="text-left py-2 px-2 font-medium text-[var(--color-dark)]">ACTION / TYPE</th>
              <th className="text-left py-2 px-2 font-medium text-[var(--color-dark)]">RESSOURCE</th>
              <th className="text-left py-2 px-2 font-medium text-[var(--color-dark)]">ADRESSE IP</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-gray-light)]">
            {loading ? (
              <tr><td colSpan={5} className="text-center py-10"><FadeLoader color="#1e40af" cssOverride={{ display: 'inline-block' }} /></td></tr>
            ) : logs.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-10 text-[var(--color-gray)]">Aucun journal trouvé</td></tr>
            ) : logs.map((log) => (
              <tr key={log.uuid} className="hover:bg-[var(--color-gray-light)] transition-colors">
                <td className="px-4 py-2">
                  <p className="font-medium whitespace-nowrap">{new Date(log.created_at).toLocaleString('fr-FR')}</p>
                </td>

                <td className="px-4 py-2">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 flex items-center justify-center rounded-full text-sm font-semibold bg-blue-100 text-[var(--color-primary)]">
                      {log.user?.initials ?? '—'}
                    </div>
                    <p className="font-medium text-gray-900">{log.user?.name ?? 'Système'}</p>
                  </div>
                </td>

                <td className="px-4 py-2">
                  <span className={`inline-flex px-4 py-1.5 text-xs font-medium rounded-full whitespace-nowrap ${ACTION_COLORS[log.action] ?? 'bg-gray-100 text-gray-700'}`}>
                    {log.action_label}
                  </span>
                </td>

                <td className="px-4 py-2 text-[var(--color-gray)] text-sm">{log.entity_label} #{log.entity_id}</td>

                <td className="px-4 py-2 font-mono text-sm text-[var(--color-gray)] whitespace-nowrap">{log.ip_address ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>

      </div>
      {/* Pagination */}
      <div className="px-8 py-5 border-t border-t-[var(--color-gray-light)] bg-[var(--color-white)] flex items-center justify-between overflow-hidden w-full">
        <p className="text-sm text-[var(--color-gray)] whitespace-nowrapl">
          {meta.total} résultat{meta.total > 1 ? 's' : ''}
        </p>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 border border-[var(--color-gray-light)] rounded-[var(--radius-md)] hover:bg-[var(--color-gray-light)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="px-4 py-2 rounded-[var(--radius-md)] font-medium bg-[var(--color-primary)] text-[var(--color-white)]">
            {currentPage} / {meta.last_page || 1}
          </span>

          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, meta.last_page || 1))}
            disabled={currentPage >= (meta.last_page || 1)}
            className="px-4 py-2 border border-[var(--color-gray-light)] rounded-[var(--radius-md)] hover:bg-[var(--color-gray-light)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuditLogs;

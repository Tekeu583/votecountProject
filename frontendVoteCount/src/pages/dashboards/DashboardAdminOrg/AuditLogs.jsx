import React, { useState, useMemo } from 'react';
import {
  Download,
  Search,
  Filter,
  RefreshCw,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import TextInput from '@components/ui/TextInput';
import toast, { ToastBar } from 'react-hot-toast';
import { useDebounce } from '@hooks/useDebounce';

const AuditLogs = () => {
  const [typeFilter, setTypeFilter] = useState('Tous');
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 400);
  const [dateFilter, setDateFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Données d'exemple (tu pourras les remplacer par des données venant de ton API)
  const logs = useMemo(() => [
    {
      id: 1,
      date: '24/03/2026',
      time: '14:32:05',
      user: 'Muriel',
      initials: 'ML',
      color: 'bg-blue-100 text-[var(--color-primary)]',
      action: 'Vote exprimé',
      actionColor: 'bg-green-100 text-green-700',
      details: 'Sondage ID: #3421 - "Budget 2026"',
      ip: '192.168.1.45',
    },
    {
      id: 2,
      date: '24/03/2026',
      time: '14:31:58',
      user: 'Thomas Bernard',
      initials: 'TB',
      color: 'bg-orange-100 text-orange-700',
      action: 'OTP envoyé',
      actionColor: 'bg-amber-100 text-amber-700',
      details: 'Authentification par SMS réussie',
      ip: '82.124.56.12',
    },
    {
      id: 3,
      date: '24/03/2026',
      time: '14:28:10',
      user: 'tonny fokam',
      initials: 'JD',
      color: 'bg-cyan-100 text-cyan-700',
      action: 'Connexion',
      actionColor: 'bg-blue-100 text-[var(--color-primary)]',
      details: 'Accès au tableau de bord admin',
      ip: '176.12.89.201',
    },
    {
      id: 4,
      date: '24/03/2026',
      time: '14:15:22',
      user: 'Alice Morel',
      initials: 'AM',
      color: 'bg-red-100 text-red-700',
      action: 'Export de données',
      actionColor: 'bg-red-100 text-red-700',
      details: 'Export liste des émargements (Excel)',
      ip: '10.0.0.12',
    },
    {
      id: 5,
      date: '24/03/2026',
      time: '13:55:00',
      user: 'Paul Valery',
      initials: 'PV',
      color: 'bg-green-100 text-green-700',
      action: 'Vote exprimé',
      actionColor: 'bg-green-100 text-green-700',
      details: 'Sondage ID: #3421 - "Budget 2026"',
      ip: '194.5.12.33',
    },
  ], []);

  // Filtrage des logs
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const matchesType = typeFilter === 'Tous' || log.action.toLowerCase().includes(typeFilter.toLowerCase());
      const matchesSearch =
        log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.details.toLowerCase().includes(searchTerm.toLowerCase());
      let matchesDate = true;

      if (dateFilter) {
        try {
          const selectedDate = new Date(dateFilter);
          const [day, month, year] = log.date.split('/').map(Number);
          const logDate = new Date(year, month - 1, day);
          matchesDate =
            selectedDate.getFullYear() === logDate.getFullYear() &&
            selectedDate.getMonth() === logDate.getMonth() &&
            selectedDate.getDate() === logDate.getDate();
        } catch {
          matchesDate = false;
        }
      }

      return matchesType && matchesSearch && matchesDate;
    });
  }, [typeFilter, searchTerm, dateFilter, logs]);

  // Pagination
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Fonction d'export CSV réel
  const handleExportCSV = () => {
    const headers = ['Date', 'Heure', 'Utilisateur', 'Action', 'Détails', 'Adresse IP'];

    const csvContent = [
      headers.join(','),
      ...filteredLogs.map(log => [
        `"${log.date}"`,
        `"${log.time}"`,
        `"${log.user}"`,
        `"${log.action}"`,
        `"${log.details}"`,
        `"${log.ip}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = `Audit_Log_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('telecharger avec success')
  };

  // Réinitialiser les filtres
  const resetFilters = () => {
    setTypeFilter('Tous');
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
          className="flex items-center justify-center gap-2 bg-[var(--color-white)] border border-[var(--color-gray-light)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] px-4 py-2 rounded-[var(--radius-md)] font-medium transition-colors w-full sm:w-auto"
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
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full border border-[var(--color-gray-light)] rounded-[var(--radius-md)] px-4 py-3 focus:outline-none focus:border-[var(--color-primary)]"
            >
              <option value="Tous">Tous les types</option>
              <option value="Vote">Vote exprimé</option>
              <option value="Connexion">Connexion</option>
              <option value="OTP">OTP envoyé</option>
              <option value="Export">Export de données</option>
            </select>
          </div>

          {/* Recherche Utilisateur */}
          <div>
            <label htmlFor='name' className="block text-sm font-medium text-[var(--color-gray)] mb-2">UTILISATEUR</label>
            <div className="relative">
              <TextInput
                id='name'
                type="text"
                placeholder="Nom ou Email"
                iconLeft={Search}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-3 border border-[var(--color-gray-light)] rounded-[var(--radius-md)] focus:outline-none focus:border-[var(--color-primary)]"
              />
            </div>
          </div>

          {/* Période */}
          <div>
            <label htmlFor='date' className="block text-sm font-medium text-[var(--color-gray)] mb-2">PÉRIODE</label>
            <TextInput
              id='date'
              type="date"
              placeholder="dd/mm/yyyy"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
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
              <th className="text-left py-2 px-2 font-medium text-[var(--color-dark)]">DÉTAILS DE L'ACTIVITÉ</th>
              <th className="text-left py-2 px-2 font-medium text-[var(--color-dark)]">ADRESSE IP</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-gray-light)]">
            {paginatedLogs.map((log) => (
              <tr key={log.id} className="hover:bg-[var(--color-gray-light)] transition-colors">
                <td className="px-4 py-2">
                  <div>
                    <p className="font-medium whitespace-nowrap">{log.date}</p>
                    <p className="text-sm text-[var(--color-gray)]">{log.time}</p>
                  </div>
                </td>

                <td className="px-4 py-2">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 flex items-center justify-center rounded-full text-sm font-semibold ${log.color}`}>
                      {log.initials}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{log.user}</p>
                    </div>
                  </div>
                </td>

                <td className="px-4 py-2">
                  <span className={`inline-flex px-4 py-1.5 text-xs font-medium rounded-full whitespace-nowrap ${log.actionColor}`}>
                    {log.action}
                  </span>
                </td>

                <td className="px-4 py-2 text-[var(--color-gray)] text-sm">{log.details}</td>

                <td className="px-4 py-2 font-mono text-sm text-[var(--color-gray)] whitespace-nowrap">{log.ip}</td>
              </tr>
            ))}
          </tbody>
        </table>

      </div>
      {/* Pagination */}
      <div className="px-8 py-5 border-t border-t-[var(--color-gray-light)] bg-[var(--color-white)] flex items-center justify-between overflow-hidden w-full">
        <p className="text-sm text-[var(--color-gray)] whitespace-nowrapl">
          Affichage de 1 à {paginatedLogs.length} sur {filteredLogs.length} résultats
        </p>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 border border-[var(--color-gray-light)] rounded-[var(--radius-md)] hover:bg-[var(--color-gray-light)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => (
            <button
              key={i}
              onClick={() => setCurrentPage(i + 1)}
              className={`px-4 py-2 rounded-[var(--radius-md)] font-medium ${currentPage === i + 1
                ? 'bg-[var(--color-primary)] text-[var(--color-white)]'
                : 'border border-[var(--color-gray-light)] hover:bg-[var(--color-gray-light)]'
                }`}
            >
              {i + 1}
            </button>
          ))}

          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
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

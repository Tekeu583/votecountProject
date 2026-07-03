import React, { useState, useMemo, useEffect } from 'react';
import {
  Download,
  CheckCircle,
  XCircle,
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
import { auditApi } from '@services/api';

const MetadataCell = ({ metadata }) => (
  <button
    onClick={() =>
      toast(
        <pre className="bg-black text-white p-3 rounded text-xs">
          {JSON.stringify(metadata, null, 2)}
        </pre>
      )
    }
  >
    <Info size={16} />
  </button>
);

const ActionsCell = ({ onView }) => (
  <button
    className="text-slate-400 hover:text-blue-600 p-2.5 rounded-lg hover:bg-blue-50"
    onClick={onView}
  >
    <Eye size={16} />
  </button>
);

const AuditLogsPage = () => {

  const { handleExport } = useExport();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('Tous');
  const [searchTerm, setSearchTerm] = useState('');
  const [orgFilter, setOrgFilter] = useState('Tous');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 3;
  const [audits, setAudits]=useState([]);

  // recupération des données d'audits depuis l'api

  useEffect(() => {
    const fetchAudits = async () => {
      try {
        const response = await auditApi.getAll();
        setAudits(response.data);
        console.log('audits',response.data);
      } catch (error) {
        console.error('Error fetching audits:', error);
      }
    };
    fetchAudits();
  }, []);

  const [datas] = useState([
    {
      id: 1,
      created_at: "25 Dec 2025 14:32:01",
      type: "Auth",
      action: "user_login",
      status: "success",
      organization: "Mairie de Douala",
      user: "user_8293@Douala.fr",
      ip_address: "196.168.1.45",
      metadata: { method: "email", ip_country: "CM", referer: "/" },
    },
    {
      id: 2,
      created_at: "25 Dec 2025 14:30:45",
      type: "OTP",
      action: "otp_verified",
      status: "success",
      organization: "Assoc. Syndicale",
      user: "m.garcia@gmail.com",
      ip_address: "154.73.22.10",
      metadata: { code_valid: true, attempts: 1, phone: "+237 6XX XXX XXX" },
    },
    {
      id: 3,
      created_at: "25 Dec 2025 14:28:12",
      type: "Paiement",
      action: "subscription_renewed",
      status: "echec",
      organization: "Club des Aînés",
      user: "admin@club-aines.fr",
      ip_address: "102.45.67.89",
      metadata: { error: "Carte expirée", amount: 15000, currency: "XAF" },
    },
    {
      id: 4,
      created_at: "25 Dec 2025 14:15:33",
      type: "Vote",
      action: "vote_submitted",
      status: "success",
      organization: "Mairie de Douala",
      user: "user_3310@Douala.fr",
      ip_address: "196.168.2.78",
      metadata: { scrutin_id: 45, bulletin_hash: "0xabc123..." },
    },
  ]);

  const filteredData = useMemo(() => {
    return datas.filter(item => {
      const matchSearch =
        item.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.organization.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.ip_address.includes(searchTerm);

      const matchStatus = statusFilter === 'Tous' || item.status === statusFilter;
      const matchOrg = orgFilter === 'Tous' || item.organization === orgFilter;


      return matchSearch && matchStatus && matchOrg;
    });
  }, [datas, searchTerm, statusFilter, orgFilter]);

  const paginatedLogsAudits = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(start, start + itemsPerPage);
  }, [filteredData, currentPage]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  const handleResetFilters = () => {
    setSearchTerm('');
    setOrgFilter('Tous');
    setStatusFilter('Tous');
    setCurrentPage(1);
  };


  //Fonction unique d’export
  const handleExportClick = (type) => {
    handleExport({
      type,
      datas,
      formatter: formatAuditLogs,
      filename: `audit_logs_${new Date().toISOString().slice(0, 10)}`
    });
  };

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
              placeholder="Rechercher..." />
          </div>

          <div className="flex gap-2 w-full min-w-[200px] lg:w-auto">
            <select
              value={orgFilter}
              onChange={(e) => setOrgFilter(e.target.value)}
              className="input w-full">
              <option value='Tous'>Toutes les organisations</option>
              <option value="Mairie de Douala">Mairie de Douala</option>
              <option value="Assoc. Syndicale">Assoc. Syndicale</option>
              <option value="Club des Aînés">Club des Aînés</option>
            </select>
          </div>
          <div className="flex gap-2 w-full min-w-[200px] lg:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input w-full">
              <option value='Tous'>Tous les statuts</option>
              <option value="success">Success</option>
              <option value="echec">Echec</option>
              <option value="en attente">En attente</option>
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
                <th className='px-4 py-2 text-left'>Type</th>
                <th className='px-4 py-2 text-left'>Action</th>
                <th className='px-4 py-2 text-left'>Organisation</th>
                <th className='px-4 py-2 text-left'>Utilisateur</th>
                <th className='px-4 py-2 text-left'>Statut</th>
                <th className='px-4 py-2 text-left'>Address IP</th>
                <th className='px-4 py-2 text-left'>Metadata</th>
                <th className='px-4 py-2 text-left'>Actions</th>
              </tr>
            </thead>

            <tbody>
              {paginatedLogsAudits.map((data) => (
                <tr key={data.id} className="border-t border-t-[var(--color-gray-light)] hover:bg-[var(--color-gray-light)] items-center">
                  <td className="px-4 py-2 flex items-center whitespace-nowrap gap-2">
                    {data.created_at}
                  </td>
                  <td>
                    {data.type}
                  </td>
                  <td className='px-4 py-2'>{data.action}</td>
                  <td className='px-4 py-2'>{data.organization}</td>
                  <td className='px-4 py-2'>{data.user}</td>
                  <td className='px-4 py-2'>
                    <span
                      className={`text-xs whitespace-nowrap px-4 py-2 ${data.status === 'success' ? 'text-green-600' : 'text-red-500'
                        }`}
                    >
                      ● {data.status}
                    </span>
                  </td>
                  <td className='px-4 py-2'>{data.ip_address}</td>
                  <td className='text-center' >
                    <MetadataCell metadata={data.metadata} />
                  </td>
                  <td className='px-4 py-2'>
                    <ActionsCell onView={() => console.log('view', data)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        <div className="flex flex-col lg:flex-row justify-between items-center p-4 text-sm gap-3">
          <span className="text-[var(--color-gray)]">
            Affichage de {(currentPage - 1) * itemsPerPage + 1} à{" "}
            {Math.min(currentPage * itemsPerPage, filteredData.length)} sur{" "}
            {filteredData.length}
          </span>

          <div className="flex gap-2">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
              className="px-3 py-1 border rounded"><ChevronLeft size={16} /></button>
            <span className="px-3 py-1 bg-[var(--color-primary)] text-white rounded">
              {currentPage} / {totalPages}
            </span>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
              className="px-3 py-1 border rounded"><ChevronRight size={16} /></button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuditLogsPage;
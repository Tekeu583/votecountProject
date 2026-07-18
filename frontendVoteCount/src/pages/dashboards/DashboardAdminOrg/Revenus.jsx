import React, { useState, useEffect, useCallback } from 'react';
import {
  Download,
  FileText,
  FileSpreadsheet,
  Calendar,
  ChevronLeft,
  ChevronRight,
  BadgeDollarSign,
  Vote,
  Wallet,
  ShieldCheck,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import toast from 'react-hot-toast';
import { FadeLoader } from 'react-spinners';
import RevenusModal from './RevenusModal';
import WithdrawalRequestModal from './WithdrawalRequestModal';
import OrganizationKycModal from './OrganizationKycModal';
import StatCard from '@components/dashboard/StatCard';
import { useOrg } from '@hooks/useOrg';
import { paymentsApi, withdrawalsApi } from '@services/api';

const STATUS_STYLES = {
  completed: 'bg-green-100 text-green-700',
  pending: 'bg-yellow-100 text-yellow-700',
  processing: 'bg-blue-100 text-blue-700',
  failed: 'bg-red-100 text-red-700',
  refunded: 'bg-gray-100 text-gray-700',
  cancelled: 'bg-gray-100 text-gray-700',
  approved: 'bg-blue-100 text-blue-700',
  paid: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
};

const Revenus = () => {
  const { org } = useOrg();
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  const [showKycModal, setShowKycModal] = useState(false);

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [meta, setMeta] = useState({ total: 0, last_page: 1 });
  const [currentPage, setCurrentPage] = useState(1);
  const [transactionStatusFilter, setTransactionStatusFilter] = useState('all');
  const [chartData, setChartData] = useState([]);

  const [balance, setBalance] = useState(null);
  const [withdrawals, setWithdrawals] = useState([]);
  const [withdrawalsMeta, setWithdrawalsMeta] = useState({ total: 0, last_page: 1 });
  const [withdrawalsPage, setWithdrawalsPage] = useState(1);

  const loadStatsAndChart = useCallback(async () => {
    if (!org?.uuid) return;
    try {
      const [statsRes, chartRes] = await Promise.all([
        paymentsApi.getTransactionStats({ organization_uuid: org.uuid }),
        paymentsApi.getTransactions({
          organization_uuid: org.uuid,
          status: 'completed',
          date_from: new Date(new Date().setMonth(new Date().getMonth() - 5, 1)).toISOString().slice(0, 10),
          per_page: 500,
        }),
      ]);
      setStats(statsRes.data?.data ?? null);

      // Agrégation par mois côté client — pas d'endpoint dédié pour ça.
      const byMonth = {};
      (chartRes.data?.data ?? []).forEach((tx) => {
        const d = new Date(tx.created_at);
        const key = d.toLocaleDateString('fr-FR', { month: 'short' });
        byMonth[key] = (byMonth[key] ?? 0) + Number(tx.net_amount ?? 0);
      });
      setChartData(Object.entries(byMonth).map(([month, revenue]) => ({ month, revenue })));
    } catch {
      toast.error('Erreur de chargement des statistiques de revenus.');
    }
  }, [org?.uuid]);

  const loadTransactions = useCallback(async () => {
    if (!org?.uuid) return;
    setLoading(true);
    try {
      const res = await paymentsApi.getTransactions({
        organization_uuid: org.uuid,
        page: currentPage,
        per_page: 10,
        status: transactionStatusFilter !== 'all' ? transactionStatusFilter : undefined,
      });
      setTransactions(res.data?.data ?? []);
      setMeta(res.data?.meta ?? { total: 0, last_page: 1 });
    } catch {
      toast.error('Erreur de chargement des transactions.');
    } finally {
      setLoading(false);
    }
  }, [org?.uuid, currentPage, transactionStatusFilter]);

  const loadBalance = useCallback(async () => {
    if (!org?.uuid) return;
    try {
      const res = await withdrawalsApi.getBalance(org.uuid);
      setBalance(res.data?.data ?? null);
    } catch {
      // non bloquant — le reste de la page (revenus, transactions) reste utilisable
    }
  }, [org?.uuid]);

  const loadWithdrawals = useCallback(async () => {
    if (!org?.uuid) return;
    try {
      const res = await withdrawalsApi.getAll({
        organization_uuid: org.uuid,
        page: withdrawalsPage,
        per_page: 10,
      });
      setWithdrawals(res.data?.data ?? []);
      setWithdrawalsMeta(res.data?.meta ?? { total: 0, last_page: 1 });
    } catch {
      // non bloquant
    }
  }, [org?.uuid, withdrawalsPage]);

  useEffect(() => { loadStatsAndChart(); }, [loadStatsAndChart]);
  useEffect(() => { loadTransactions(); }, [loadTransactions]);
  useEffect(() => { setCurrentPage(1); }, [transactionStatusFilter]);
  useEffect(() => { loadBalance(); }, [loadBalance]);
  useEffect(() => { loadWithdrawals(); }, [loadWithdrawals]);

  // Format attendu par RevenusModal / l'export (mêmes clés que l'ancien mock).
  const exportRows = transactions.map((tx) => ({
    id: tx.uuid,
    poll: tx.election?.title ?? tx.type_label,
    date: new Date(tx.created_at).toLocaleString('fr-FR'),
    statut: tx.status_label,
    montant: Number(tx.net_amount ?? 0),
  }));

  const handleExport = (format) => {
    setShowExportMenu(false);

    const filename = `Revenus_VoteCount_${new Date().toISOString().slice(0, 10)}`;

    if (format === 'csv') {
      const csvContent =
        "Election,Date,Statut,Montant (CFA)\n" +
        exportRows.map(t => `"${t.poll}","${t.date}","${t.statut}",${t.montant}`).join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      saveAs(blob, `${filename}.csv`);
    }
    else if (format === 'excel') {
      const data = exportRows.map(t => ({
        "Election": t.poll,
        "Date": t.date,
        "Statut": t.statut,
        "Montant (CFA)": t.montant,
      }));

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Revenus");
      XLSX.writeFile(wb, `${filename}.xlsx`);
    }
    else if (format === 'pdf') {
      const doc = new jsPDF();
      doc.setFontSize(18);
      doc.text("Gestion des Revenus - VoteCount", 14, 20);
      doc.setFontSize(12);
      doc.text(`Rapport généré le ${new Date().toLocaleDateString('fr-FR')}`, 14, 30);

      autoTable(doc, {
        startY: 45,
        head: [['Election', 'Date', 'Statut', 'Montant (CFA)']],
        body: exportRows.map(t => [t.poll, t.date, t.statut, `${t.montant.toLocaleString('fr-FR')} CFA`]),
        theme: 'grid',
        styles: { fontSize: 10 },
        headStyles: { fillColor: [37, 99, 235] },
      });

      doc.save(`${filename}.pdf`);
    }
  };

  return (
    <div className="flex-1 bg-gray-50 p-2">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 mb-8">

        <div className="flex-1 min-w-0">
          <h1 className="text-2xl md:text-3xl font-semibold text-[var(--color-dark)] tracking-tight">
            Gestion des Revenus
          </h1>
          <p className="text-[var(--color-gray)] mt-1.5 text-sm md:text-base">
            Aperçu financier des sondages payants
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              disabled={transactions.length === 0}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3
                           bg-[var(--color-white)] border border-gray-300 rounded-[var(--radius-md)]
                           hover:bg-gray-50 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-5 h-5" />
              <span>Exporter</span>
            </button>

            {showExportMenu && (
              <div className="absolute right-0 sm:right-auto mt-2 w-full sm:w-56 bg-[var(--color-white)]
                                rounded-[var(--radius-md)] shadow-[var(--shadow-md)] border border-gray-100 py-2 z-50">
                <button
                  onClick={() => handleExport('csv')}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 text-sm"
                >
                  <FileText className="w-5 h-5 text-[var(--color-gray)]" />
                  Exporter en CSV
                </button>
                <button
                  onClick={() => handleExport('excel')}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 text-sm"
                >
                  <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                  Exporter en Excel
                </button>
                <button
                  onClick={() => handleExport('pdf')}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 text-sm"
                >
                  <FileText className="w-5 h-5 text-red-600" />
                  Exporter en PDF
                </button>
              </div>
            )}
          </div>
          <button
            onClick={() => setShowReportModal(true)}
            className="flex-1 sm:flex-none btn-primary font-medium px-6 py-3 whitespace-nowrap"
          >
            Générer Rapport
          </button>

          {balance?.kyc_status !== 'verified' ? (
            <button
              onClick={() => setShowKycModal(true)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3
                           bg-[var(--color-white)] border border-gray-300 rounded-[var(--radius-md)]
                           hover:bg-gray-50 font-medium transition-colors whitespace-nowrap"
            >
              <ShieldCheck className="w-5 h-5" />
              Vérifier mon identité (KYC)
            </button>
          ) : (
            <button
              onClick={() => setShowWithdrawalModal(true)}
              disabled={!balance?.available_balance || balance.available_balance <= 0}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3
                           bg-[var(--color-white)] border border-gray-300 rounded-[var(--radius-md)]
                           hover:bg-gray-50 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            >
              <Wallet className="w-5 h-5" />
              Demander un retrait
            </button>
          )}
        </div>
      </div>

      {/* Statistiques Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Revenu Total"
          value={`${Number(stats?.total_revenue ?? 0).toLocaleString('fr-FR')} CFA`}
          icon={BadgeDollarSign}
          delay={0}
        />

        <StatCard
          title="Moyenne / Votant"
          value={`${Number(stats?.average_per_voter ?? 0).toLocaleString('fr-FR')} CFA`}
          icon={BadgeDollarSign}
          delay={100}
        />

        <StatCard
          title="Sondages Payants Actifs"
          value={stats?.active_paid_polls ?? 0}
          icon={Vote}
          delay={200}
        />

        <StatCard
          title="Solde Disponible"
          value={`${Number(balance?.available_balance ?? 0).toLocaleString('fr-FR')} CFA`}
          icon={Wallet}
          delay={300}
        />
      </div>

      {/* Graphique Évolution des revenus */}
      <div className="bg-[var(--color-white)] rounded-[var(--radius-md)] p-8 shadow-[var(--shadow-md)] border border-gray-100 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-semibold text-gray-800">Évolution des revenus</h3>
          <div className="flex items-center gap-2 text-sm text-[var(--color-gray)]">
            <Calendar className="w-4 h-4" />
            Les 6 derniers mois
          </div>
        </div>

        <div className="h-96">
          {chartData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-gray-500 text-sm">
              Aucune transaction complétée sur cette période.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip
                  formatter={(value) => [`${value.toLocaleString('fr-FR')} CFA`, 'Revenu']}
                />
                <Bar dataKey="revenue" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Transactions Récentes */}
      <div className="bg-[var(--color-white)] rounded-[var(--radius-md)] shadow-[var(--shadow-md)] border border-gray-100 overflow-hidden">
        <div className="px-8 py-5 flex items-center justify-between bg-gray-50">
          <h3 className="font-semibold text-gray-800">Transactions</h3>
          <select
            value={transactionStatusFilter}
            onChange={(e) => setTransactionStatusFilter(e.target.value)}
            className="border border-[var(--color-gray-light)] bg-[var(--color-white)] rounded-[var(--radius-md)] px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] transition-all"
          >
            <option value="all">Tous les statuts</option>
            <option value="pending">En attente</option>
            <option value="processing">En traitement</option>
            <option value="completed">Complété</option>
            <option value="failed">Échoué</option>
            <option value="refunded">Remboursé</option>
            <option value="cancelled">Annulé</option>
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead>
              <tr className="border-b border-b-[var(--color-gray-light)] bg-[var(--color-gray-light)] capitalize">
                <th className="text-left px-4 py-2 font-medium text-[var(--color-dark)]">ELECTIONS</th>
                <th className="text-left px-4 py-2 font-medium text-[var(--color-dark)]">DATE</th>
                <th className="text-left px-4 py-2 font-medium text-[var(--color-dark)]">STATUT</th>
                <th className="text-right px-4 py-2 font-medium text-[var(--color-dark)]">MONTANT</th>
              </tr>
            </thead>
            <tbody className="w-full divide-y divide-[var(--color-gray-light)] overflow-x-auto">
              {loading ? (
                <tr><td colSpan={4} className="text-center py-10"><FadeLoader color="#1e40af" cssOverride={{ display: 'inline-block' }} /></td></tr>
              ) : transactions.map((tx) => (
                <tr key={tx.uuid} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-2 font-medium text-[var(--color-dark)]">{tx.election?.title ?? tx.type_label}</td>
                  <td className="px-4 py-2 text-gray-600">{new Date(tx.created_at).toLocaleString('fr-FR')}</td>
                  <td className="px-4 py-2">
                    <span className={`inline-flex px-4 py-1.5 text-xs font-medium rounded-full ${STATUS_STYLES[tx.status] ?? 'bg-gray-100 text-gray-700'}`}>
                      {tx.status_label}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right font-semibold text-[var(--color-dark)]">
                    {Number(tx.net_amount ?? 0).toLocaleString('fr-FR')} CFA
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!loading && transactions.length === 0 && (
          <div className="py-12 text-center text-gray-500">
            Aucune transaction
          </div>
        )}
        {/* Pagination */}
        <div className="flex flex-col lg:flex-row justify-between items-center p-4 text-sm gap-3 overflow-x-auto">
          <span className="text-[var(--color-gray)]">
            {meta.total} transaction{meta.total > 1 ? 's' : ''}
          </span>

          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={16} />
            </button>
            <button className="px-3 py-1 bg-[var(--color-primary)] text-[var(--color-white)] rounded">{currentPage}</button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, meta.last_page || 1))}
              disabled={currentPage >= (meta.last_page || 1)}
              className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Historique des retraits */}
      <div className="bg-[var(--color-white)] rounded-[var(--radius-md)] shadow-[var(--shadow-md)] border border-gray-100 overflow-hidden mt-8">
        <div className="px-8 py-5 flex items-center justify-between bg-gray-50">
          <h3 className="font-semibold text-gray-800">Historique des retraits</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead>
              <tr className="border-b border-b-[var(--color-gray-light)] bg-[var(--color-gray-light)] capitalize">
                <th className="text-left px-4 py-2 font-medium text-[var(--color-dark)]">DATE</th>
                <th className="text-left px-4 py-2 font-medium text-[var(--color-dark)]">TÉLÉPHONE</th>
                <th className="text-left px-4 py-2 font-medium text-[var(--color-dark)]">STATUT</th>
                <th className="text-right px-4 py-2 font-medium text-[var(--color-dark)]">MONTANT</th>
              </tr>
            </thead>
            <tbody className="w-full divide-y divide-[var(--color-gray-light)] overflow-x-auto">
              {withdrawals.map((w) => (
                <tr key={w.uuid} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-2 text-gray-600">{new Date(w.created_at).toLocaleString('fr-FR')}</td>
                  <td className="px-4 py-2 text-gray-600">{w.phone_number}</td>
                  <td className="px-4 py-2">
                    <span className={`inline-flex px-4 py-1.5 text-xs font-medium rounded-full ${STATUS_STYLES[w.status] ?? 'bg-gray-100 text-gray-700'}`}>
                      {w.status_label ?? w.status}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right font-semibold text-[var(--color-dark)]">
                    {Number(w.amount ?? 0).toLocaleString('fr-FR')} CFA
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {withdrawals.length === 0 && (
          <div className="py-12 text-center text-gray-500">
            Aucune demande de retrait
          </div>
        )}
        {withdrawalsMeta.total > 0 && (
          <div className="flex flex-col lg:flex-row justify-between items-center p-4 text-sm gap-3 overflow-x-auto">
            <span className="text-[var(--color-gray)]">
              {withdrawalsMeta.total} demande{withdrawalsMeta.total > 1 ? 's' : ''}
            </span>

            <div className="flex gap-2">
              <button
                onClick={() => setWithdrawalsPage((p) => Math.max(p - 1, 1))}
                disabled={withdrawalsPage === 1}
                className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={16} />
              </button>
              <button className="px-3 py-1 bg-[var(--color-primary)] text-[var(--color-white)] rounded">{withdrawalsPage}</button>
              <button
                onClick={() => setWithdrawalsPage((p) => Math.min(p + 1, withdrawalsMeta.last_page || 1))}
                disabled={withdrawalsPage >= (withdrawalsMeta.last_page || 1)}
                className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL DE GÉNÉRATION DE RAPPORT */}
      {showReportModal && (
        <RevenusModal
          data={exportRows}
          stats={stats}
          onClose={() => setShowReportModal(false)}
          onSuccess={(message) => {
            toast.success(message);
          }}
          onError={(message) => {
            toast.error(message);
          }}
        />
      )}

      {showWithdrawalModal && (
        <WithdrawalRequestModal
          organizationUuid={org.uuid}
          availableBalance={Number(balance?.available_balance ?? 0)}
          onClose={() => setShowWithdrawalModal(false)}
          onSuccess={(message) => {
            toast.success(message);
            loadBalance();
            loadWithdrawals();
          }}
        />
      )}

      {showKycModal && (
        <OrganizationKycModal
          organizationUuid={org.uuid}
          onClose={() => setShowKycModal(false)}
          onSuccess={(message) => {
            toast.success(message);
            loadBalance();
          }}
        />
      )}
    </div>
  );
};

export default Revenus;

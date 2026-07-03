import React, { useState } from 'react';
import {
  Download,
  FileText,
  FileSpreadsheet,
  TrendingUp,
  Calendar,
  X,
  ChevronLeft,
  ChevronRight,
  Euro,
  Vote,
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
import RevenusModal from './RevenusModal';
import StatCard from '@components/dashboard/StatCard';

const Revenus = () => {
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  // const [reportPeriod, setReportPeriod] = useState('6months');
  // const [isGenerating, setIsGenerating] = useState(false);

  // Données du graphique
  const revenueData = [
    { month: 'Mai', revenue: 7500 },
    { month: 'Juin', revenue: 9200 },
    { month: 'Juil', revenue: 8100 },
    { month: 'Août', revenue: 10800 },
    { month: 'Sept', revenue: 10200 },
    { month: 'Oct', revenue: 12400 },
  ];

  // Transactions récentes
  const transactions = [
    {
      id: 1,
      poll: 'Orientation Stratégique 2025',
      date: '24 Oct 2024, 14:30',
      statut: 'Complété',
      statutColor: 'bg-green-100 text-green-700',
      montant: 5500,
    },
    {
      id: 2,
      poll: 'Vote Budget Participatif',
      date: '23 Oct 2024, 09:15',
      statut: 'Complété',
      statutColor: 'bg-green-100 text-green-700',
      montant: 12000,
    },
    {
      id: 3,
      poll: 'Choix nouveau Siège Social',
      date: '22 Oct 2024, 18:00',
      statut: 'Complété',
      statutColor: 'bg-green-100 text-green-700',
      montant: 4500,
    },
    {
      id: 4,
      poll: 'Enquête Satisfaction Clients',
      date: '21 Oct 2024, 11:45',
      statut: 'En cours',
      statutColor: 'bg-yellow-100 text-yellow-700',
      montant: 23400,
    },
    {
      id: 5,
      poll: 'Commission Sécurité',
      date: '20 Oct 2024, 15:20',
      statut: 'Complété',
      statutColor: 'bg-green-100 text-green-700',
      montant: 3100,
    },
  ];
  // // Fonction pour générer le rapport complet
  // const generateReport = async () => {
  //   setIsGenerating(true);

  //   // Simulation de chargement
  //   await new Promise(resolve => setTimeout(resolve, 1200));

  //   const doc = new jsPDF();
  //   const today = new Date().toLocaleDateString('fr-FR');

  //   doc.setFontSize(20);
  //   doc.text("RAPPORT FINANCIER - VOTECOUNT", 14, 20);

  //   doc.setFontSize(12);
  //   doc.text(`Période : ${reportPeriod === '6months' ? '6 derniers mois' : 'Dernier mois'}`, 14, 30);
  //   doc.text(`Généré le : ${today}`, 14, 38);

  //   // Statistiques
  //   doc.setFontSize(14);
  //   doc.text("Résumé Financier", 14, 55);

  //   autoTable(doc, {
  //     startY: 65,
  //     head: [['Indicateur', 'Valeur']],
  //     body: [
  //       ['Revenu Total', '12 450,00 CFA'],
  //       ['Moyenne par Votant', '4,85 CFA'],
  //       ['Sondages Payants Actifs', '8'],
  //       ['Montant prêt pour virement', '3 120,50 CFA'],
  //     ],
  //     theme: 'striped',
  //   });

  //   // Tableau des transactions
  //   doc.setFontSize(14);
  //   doc.text("Transactions Récentes", 14, doc.lastAutoTable.finalY + 20);

  //   autoTable(doc, {
  //     startY: doc.lastAutoTable.finalY + 30,
  //     head: [['Sondage', 'Date', 'Statut', 'Montant']],
  //     body: transactions.map(t => [
  //       t.poll,
  //       t.date,
  //       t.statut,
  //       `${t.montant.toLocaleString('fr-FR')} CFA`
  //     ]),
  //     theme: 'grid',
  //   });

  //   doc.save(`Rapport_Revenus_VoteCount_${today.replace(/\//g, '-')}.pdf`);

  //   setIsGenerating(false);
  //   setShowReportModal(false);

  //   // Notification de succès
  //   toast.success("Rapport généré avec succès et téléchargé !");
  // };
  // Fonction d'export
  const handleExport = (format) => {
    setShowExportMenu(false);

    const filename = `Revenus_VoteCount_${new Date().toISOString().slice(0, 10)}`;

    if (format === 'csv') {
      const csvContent =
        "Poll Name,Date,Statut,Montant (CFA)\n" +
        transactions.map(t =>
          `"${t.poll}","${t.date}","${t.statut}",${t.montant}`
        ).join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      saveAs(blob, `${filename}.csv`);
    }
    else if (format === 'excel') {
      const data = transactions.map(t => ({
        "Poll / Sondage": t.poll,
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
        head: [['Poll / Sondage', 'Date', 'Statut', 'Montant (CFA)']],
        body: transactions.map(t => [
          t.poll,
          t.date,
          t.statut,
          `${t.montant.toLocaleString('fr-FR')} CFA`
        ]),
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
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 
                           bg-[var(--color-white)] border border-gray-300 rounded-[var(--radius-md)] 
                           hover:bg-gray-50 font-medium transition-colors"
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
        </div>
      </div>

      {/* Statistiques Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Revenu Total"
          value="12 450,00 CFA"
          icon={Euro}
          trend="+1.12% vs mois dernier"
          delay={0}
        />

        <StatCard
          title="Moyenne / Votant"
          value="4,85 CFA"
          icon={Euro}
          trend="Basé sur 2 567 votes"
          delay={100}
        />

        <StatCard
          title="Sondages Payants Actifs"
          value="8"
          icon={Vote}
          trend="3 programmés"
          delay={200}
        />

        <StatCard
          title="Prêt pour virement"
          value="3 120,50 CFA"
          icon={Euro}
          trend="Prochain virement le 01/11"
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
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip
                formatter={(value) => [`${value.toLocaleString('fr-FR')} CFA`, 'Revenu']}
              />
              <Bar dataKey="revenue" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Transactions Récentes */}
      <div className="bg-[var(--color-white)] rounded-[var(--radius-md)] shadow-[var(--shadow-md)] border border-gray-100 overflow-hidden">
        <div className="px-8 py-5 flex items-center justify-between bg-gray-50">
          <h3 className="font-semibold text-gray-800">Transactions Récentes</h3>
          <button className="text-[var(--color-primary)] hover:text-[var(--color-primary)] text-sm font-medium">
            Voir tout
          </button>
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
              {transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-2 font-medium text-[var(--color-dark)]">{tx.poll}</td>
                  <td className="px-4 py-2 text-gray-600">{tx.date}</td>
                  <td className="px-4 py-2">
                    <span className={`inline-flex px-4 py-1.5 text-xs font-medium rounded-full ${tx.statutColor}`}>
                      {tx.statut}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right font-semibold text-[var(--color-dark)]">
                    {tx.montant.toLocaleString('fr-FR')} CFA
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {transactions.length === 0 && (
          <div className="py-12 text-center text-gray-500">
            Aucune transaction récente
          </div>
        )}
        {/* Pagination */}
        <div className="flex flex-col lg:flex-row justify-between items-center p-4 text-sm gap-3 overflow-x-auto">
          <span className="text-[var(--color-gray)]">
            Affichage de 1 à 4 sur 24 revenus
          </span>

          <div className="flex gap-2">
            <button className="px-3 py-1 border rounded"><ChevronLeft size={16} /></button>
            <button className="px-3 py-1 bg-[var(--color-primary)] text-[var(--color-white)] rounded">1</button>
            <button className="px-3 py-1 border rounded"><ChevronRight size={16} /></button>
          </div>
        </div>
      </div>
      {/* MODAL DE GÉNÉRATION DE RAPPORT */}
      {showReportModal && (
        <RevenusModal
          data={transactions}
          onClose={() => setShowReportModal(false)}
          onSuccess={(message) => {
            toast.success(message);
          }}
          onError={(message) => {
            toast.error(message);
          }}
        />
      )}
    </div>
  );
};

export default Revenus;

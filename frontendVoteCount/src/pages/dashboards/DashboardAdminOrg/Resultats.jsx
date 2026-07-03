import React, { useState } from 'react';
import { Download, FileText, FileSpreadsheet, File } from 'lucide-react';
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const Resultats = () => {
  // Liste des élections disponibles
  const elections = [
    { id: 1, title: "Élection Bureau 2024", status: "Clôturé" },
    { id: 2, title: "Élection Comité d'Entreprise 2025", status: "Clôturé" },
    { id: 3, title: "Vote sur le Télétravail Q4", status: "En cours" },
    { id: 4, title: "Assemblée Générale Extraordinaire", status: "Clôturé" },
  ];

  const [selectedElectionId, setSelectedElectionId] = useState(1);
  const [showExportMenu, setShowExportMenu] = useState(false);

  // Données par élection (tu pourras plus tard venir de ton backend)
  const electionData = {
    1: { // Élection Bureau 2024
      title: "Élection Bureau 2024",
      status: "Clôturé",
      totalInscrits: "1,250",
      suffragesExprimes: "1,056",
      blancsNuls: "24",
      tauxParticipation: "86.4%",

      pieData: [
        { name: 'BLANC', value: 24, color: '#D1D5DB' },
        { name: 'MURIEL', value: 452, color: '#3B82F6' },
        { name: 'ARSENE', value: 380, color: '#1F2937' },
        { name: 'NGUIMBOUS', value: 224, color: '#9CA3AF' },
      ],

      barData: [
        { name: 'Siège', participation: 94 },
        { name: 'R&D', participation: 88 },
        { name: 'Ventes', participation: 72 },
        { name: 'Logistique', participation: 81 },
        { name: 'Marketing', participation: 79 },
      ],

      resultats: [
        { rang: 1, code: 'MC', candidat: 'Mjuriel', groupe: 'Innovation & Science', voix: 452, pourcentage: 42.8, statut: 'ÉLU(E)' },
        { rang: 2, code: 'AE', candidat: 'Arsene', groupe: 'Relativité Durable', voix: 380, pourcentage: 36.0, statut: '' },
        { rang: 3, code: 'NT', candidat: 'Nguimbous', groupe: 'Énergie Libre', voix: 224, pourcentage: 21.2, statut: '' },
      ]
    },
    2: { // Comité d'Entreprise 2025
      title: "Élection Comité d'Entreprise 2025",
      status: "Clôturé",
      totalInscrits: "890",
      suffragesExprimes: "765",
      blancsNuls: "12",
      tauxParticipation: "85.9%",

      pieData: [
        { name: 'BLANC', value: 12, color: '#D1D5DB' },
        { name: 'FOKAM', value: 320, color: '#3B82F6' },
        { name: 'MURIEL', value: 280, color: '#1F2937' },
        { name: 'THOMAS', value: 153, color: '#9CA3AF' },
      ],

      barData: [
        { name: 'Siège', participation: 92 },
        { name: 'R&D', participation: 89 },
        { name: 'Ventes', participation: 78 },
      ],

      resultats: [
        { rang: 1, code: 'FK', candidat: 'Fokam', groupe: 'Innovation', voix: 320, pourcentage: 41.8, statut: 'ÉLU(E)' },
        { rang: 2, code: 'ML', candidat: 'Muriel', groupe: 'Social', voix: 280, pourcentage: 36.6, statut: '' },
        { rang: 3, code: 'TH', candidat: 'Thomas', groupe: 'Technique', voix: 153, pourcentage: 20.0, statut: '' },
      ]
    },
    // Tu peux ajouter d'autres élections ici...
  };

  const currentElection = electionData[selectedElectionId] || electionData[1];

  // Fonction d'export mise à jour
  const handleExport = (format) => {
    setShowExportMenu(false);
    const filename = `Resultats_${currentElection.title.replace(/\s+/g, '_')}`;

    if (format === 'csv') {
      const csvContent =
        "Rang,Candidat,Groupe,Voix,Pourcentage,Statut\n" +
        currentElection.resultats.map(r =>
          `${r.rang},"${r.candidat}","${r.groupe}",${r.voix},${r.pourcentage}%,${r.statut || '-'}`
        ).join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      saveAs(blob, `${filename}.csv`);
    }
    else if (format === 'excel') {
      const ws = XLSX.utils.json_to_sheet(currentElection.resultats.map(r => ({
        Rang: r.rang,
        Candidat: r.candidat,
        "Parti / Groupe": r.groupe,
        Voix: r.voix,
        Pourcentage: `${r.pourcentage}%`,
        Statut: r.statut || '-'
      })));

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Résultats");
      XLSX.writeFile(wb, `${filename}.xlsx`);
    }
    else if (format === 'pdf') {
      const doc = new jsPDF();
      doc.setFontSize(16);
      doc.text(`Résultats du Scrutin : ${currentElection.title}`, 14, 20);

      autoTable(doc, {
        startY: 30,
        head: [['Rang', 'Candidat', 'Parti / Groupe', 'Voix', 'Pourcentage', 'Statut']],
        body: currentElection.resultats.map(r => [
          r.rang,
          r.candidat,
          r.groupe,
          r.voix,
          `${r.pourcentage}%`,
          r.statut || '-'
        ]),
        theme: 'grid',
      });

      doc.save(`${filename}.pdf`);
    }
  };

  return (
    <div className="flex-1 bg-[var(--color-background-white)] p-2 md:p-2 overflow-auto">
      {/* Header avec Sélecteur d'élection */}
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
              <h1 className="text-2xl md:text-3xl font-semibold text-[var(--color-dark)] flex-1">
                Résultats du Scrutin
              </h1>

              <select
                value={selectedElectionId}
                onChange={(e) => setSelectedElectionId(Number(e.target.value))}
                className="bg-[var(--color-white)] border border-[var(--color-gray-light)]
                 rounded-[var(--radius-md)] px-4 py-2.5 text-sm font-medium
                 focus:outline-none focus:border-[var(--color-primary)]
                 w-full sm:w-auto min-w-[240px]"
              >
                {elections.map((election) => (
                  <option key={election.id} value={election.id}>
                    {election.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Statut */}
            <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full w-fit">
              {currentElection.status}
            </span>
          </div>

          {/* Bouton Export */}
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="btn-primary flex items-center gap-2 font-medium px-6 py-3"
            >
              <Download size={18} />
              Exporter le rapport
            </button>

            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-[var(--color-white)] rounded-xl shadow-xl border border-[var(--color-gray-light)] py-2 z-50">
                <button onClick={() => handleExport('csv')} className="w-full px-4 py-3 hover:bg-gray-50 flex items-center gap-3">
                  <FileText size={18} /> Exporter en CSV
                </button>
                <button onClick={() => handleExport('excel')} className="w-full px-4 py-3 hover:bg-gray-50 flex items-center gap-3">
                  <FileSpreadsheet size={18} className="text-emerald-600" /> Exporter en Excel
                </button>
                <button onClick={() => handleExport('pdf')} className="w-full px-4 py-3 hover:bg-gray-50 flex items-center gap-3">
                  <File size={18} className="text-red-600" /> Exporter en PDF
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Statistiques Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {[
          { label: 'Total Inscrits', value: currentElection.totalInscrits },
          { label: 'Suffrages Exprimés', value: currentElection.suffragesExprimes },
          { label: 'Blancs / Nuls', value: currentElection.blancsNuls },
          { label: 'Taux de Participation', value: currentElection.tauxParticipation, highlight: true },
        ].map((stat, i) => (
          <div key={i} className="bg-[var(--color-white)] rounded-2xl p-6 shadow-sm border border-[var(--color-gray-light)]">
            <p className="text-sm text-gray-500">{stat.label}</p>
            <p className={`text-4xl font-semibold mt-3 ${stat.highlight ? 'text-blue-600' : 'text-gray-900'}`}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-[var(--color-white)] rounded-2xl p-8 shadow-sm border border-[var(--color-gray-light)]">
          <h3 className="font-medium text-gray-700 mb-6">DISTRIBUTION DES VOIX PAR CANDIDAT</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={currentElection.pieData} cx="50%" cy="50%" innerRadius={90} outerRadius={130} dataKey="value">
                  {currentElection.pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-[var(--color-white)] rounded-2xl p-8 shadow-sm border border-[var(--color-gray-light)]">
          <h3 className="font-medium text-gray-700 mb-6">PARTICIPATION PAR DÉPARTEMENT (%)</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={currentElection.barData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Bar dataKey="participation" fill="#1E40AF" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Tableau Décompte Final */}
      <div className="bg-[var(--color-white)] rounded-2xl shadow-sm border border-[var(--color-gray-light)] overflow-hidden">
        <div className="px-8 py-5 border-b border-b-[var(--color-gray-light)] bg-gray-50">
          <h3 className="font-medium text-gray-700">Décompte Final des voix</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="bg-gray-50 border-b border-b-[var(--color-gray-light)]">
                <th className="text-left py-2 px-2 font-medium text-gray-600 w-16">RANG</th>
                <th className="text-left py-2 px-2 font-medium text-gray-600">CANDIDAT / OPTION</th>
                <th className="text-left py-2 px-2 font-medium text-gray-600">PARTI / GROUPE</th>
                <th className="text-left py-2 px-2 font-medium text-gray-600">VOIX</th>
                <th className="text-left py-2 px-2 font-medium text-gray-600">POURCENTAGE</th>
                <th className="text-left py-2 px-2 font-medium text-gray-600">STATUT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-gray-light)]">
              {currentElection.resultats.map((item) => (
                <tr key={item.rang} className="hover:bg-gray-50">
                  <td className="px-2 py-2">
                    <div className="flex items-center justify-center w-9 h-9 rounded-full bg-[var(--color-gray-light)] text-gray-700 font-semibold text-lg">
                      {item.rang}
                    </div>
                  </td>
                  <td className="px-2 py-2">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[var(--color-gray-light)] flex items-center justify-center text-sm font-semibold">
                        {item.code}
                      </div>
                      <span className="font-medium">{item.candidat}</span>
                    </div>
                  </td>
                  <td className="px-2 py-2 text-gray-600">{item.groupe}</td>
                  <td className="px-2 py-2 font-semibold">{item.voix}</td>
                  <td className="px-2 py-2">
                    <div className="flex items-center gap-3">
                      <span>{item.pourcentage}%</span>
                      <div className="flex-1 h-2 bg-[var(--color-gray-light)] rounded-full">
                        <div
                          className="h-2 bg-blue-600 rounded-full"
                          style={{ width: `${item.pourcentage}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-2 py-2">
                    {item.statut ? (
                      <span className="px-4 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                        {item.statut}
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Resultats;
import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Download, FileText, FileSpreadsheet, File, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import toast from 'react-hot-toast';
import { FadeLoader } from 'react-spinners';
import { useOrg } from '@hooks/useOrg';
import { electionsApi, resultsApi } from '@services/api';

const COLORS = ['#3B82F6', '#1F2937', '#9CA3AF', '#059669', '#DC2626', '#F59E0B'];
const TOP_LIMIT = 5;
const PAGE_SIZE = 20;

// Regroupe les candidats au-delà de TOP_LIMIT dans une tranche "Autres",
// pour que le camembert reste lisible même avec beaucoup de candidats
// (même pattern que ElectionResultats.jsx côté vote public).
const buildPieData = (rows) => {
  const sorted = [...rows].sort((a, b) => b.voix - a.voix);
  const top = sorted.slice(0, TOP_LIMIT);
  const rest = sorted.slice(TOP_LIMIT);
  const restTotal = rest.reduce((sum, r) => sum + r.voix, 0);

  const pie = top.map((r, i) => ({ name: r.candidat, value: r.voix, color: COLORS[i % COLORS.length] }));
  if (restTotal > 0) {
    pie.push({ name: `Autres (${rest.length})`, value: restTotal, color: COLORS[COLORS.length - 1] });
  }
  return pie;
};

const Resultats = () => {
  const { org } = useOrg();
  const [searchParams, setSearchParams] = useSearchParams();
  const [elections, setElections] = useState([]);
  const [loadingElections, setLoadingElections] = useState(true);
  const [selectedElectionUuid, setSelectedElectionUuid] = useState('');
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [page, setPage] = useState(1);

  const [loadingResults, setLoadingResults] = useState(false);
  const [notReady, setNotReady] = useState(false);
  const [electionDetail, setElectionDetail] = useState(null);
  const [rows, setRows] = useState([]); // [{rang, code, candidat, voix, pourcentage}]
  const [recalculating, setRecalculating] = useState(false);

  useEffect(() => {
    if (!org?.uuid) return;
    const fetchElections = async () => {
      setLoadingElections(true);
      try {
        const res = await electionsApi.getAll({ organization_uuid: org.uuid, per_page: 100 });
        const list = res.data?.data ?? [];
        setElections(list);
        // Reprend l'élection passée depuis Scrutins.jsx (?election=uuid) si
        // elle existe bien dans cette organisation, sinon la première.
        const fromQuery = searchParams.get('election');
        const initial = list.find((e) => e.uuid === fromQuery)?.uuid ?? list[0]?.uuid;
        if (initial) setSelectedElectionUuid(initial);
      } catch {
        toast.error('Impossible de charger les élections.');
      } finally {
        setLoadingElections(false);
      }
    };
    fetchElections();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [org?.uuid]);

  const handleSelectElection = (uuid) => {
    setSelectedElectionUuid(uuid);
    setPage(1);
    setSearchParams(uuid ? { election: uuid } : {});
  };

  const loadResults = useCallback(async () => {
    if (!selectedElectionUuid) return;
    setLoadingResults(true);
    setNotReady(false);
    setRows([]);
    try {
      const detailRes = await electionsApi.get(selectedElectionUuid);
      const election = detailRes.data?.data;
      setElectionDetail(election);

      const isClosed = ['closed', 'completed'].includes(election?.status);
      if (!isClosed) {
        setNotReady(true);
        return;
      }

      const finalRes = await resultsApi.final(selectedElectionUuid);
      const results = finalRes.data?.data?.results ?? [];
      const candidatesByUuid = Object.fromEntries((election.candidates ?? []).map((c) => [c.uuid, c]));
      setRows(
        results
          .slice()
          .sort((a, b) => (b.percentage ?? 0) - (a.percentage ?? 0))
          .map((r, idx) => ({
            rang: idx + 1,
            candidat: candidatesByUuid[r.candidate_uuid]?.full_name ?? '—',
            voix: r.total_votes ?? 0,
            pourcentage: Math.round((r.percentage ?? 0) * 10) / 10,
          }))
      );
    } catch (error) {
      if (error.response?.status === 404) {
        setNotReady(true);
      } else {
        toast.error('Erreur de chargement des résultats.');
      }
    } finally {
      setLoadingResults(false);
    }
  }, [selectedElectionUuid]);

  useEffect(() => {
    loadResults();
  }, [loadResults]);

  // Les résultats sont calculés une fois puis figés dans un snapshot — ils
  // ne se recalculent jamais tout seuls (ex: candidat approuvé après coup,
  // recomptage). Le calcul est asynchrone (job en file d'attente), donc on
  // réactualise après un court délai plutôt que d'attendre un signal exact.
  const handleRecalculate = async () => {
    if (!selectedElectionUuid) return;
    setRecalculating(true);
    try {
      await resultsApi.calculate(selectedElectionUuid);
      toast.success('Calcul des résultats lancé — actualisation dans quelques secondes...');
      setTimeout(() => {
        loadResults();
        setRecalculating(false);
      }, 4000);
    } catch (error) {
      toast.error(error.response?.data?.message ?? 'Erreur lors du lancement du calcul.');
      setRecalculating(false);
    }
  };
  useEffect(() => {
    console.log('rows mis à jour:', rows);
  }, [rows]);
  const pieData = buildPieData(rows);
  const totalVotes = rows.reduce((sum, r) => sum + r.voix, 0);
  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const paginatedRows = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  // Sans liste d'électeurs fixe (élection publique), le taux de
  // participation n'a pas de dénominateur fiable.
  const showParticipation = electionDetail?.election_mode !== 'public';

  const handleExport = (format) => {
    setShowExportMenu(false);
    const filename = `Resultats_${(electionDetail?.title ?? 'election').replace(/\s+/g, '_')}`;

    if (format === 'csv') {
      const csvContent =
        "Rang,Candidat,Voix,Pourcentage\n" +
        rows.map(r => `${r.rang},"${r.candidat}",${r.voix},${r.pourcentage}%`).join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      saveAs(blob, `${filename}.csv`);
    }
    else if (format === 'excel') {
      const ws = XLSX.utils.json_to_sheet(rows.map(r => ({
        Rang: r.rang,
        Candidat: r.candidat,
        Voix: r.voix,
        Pourcentage: `${r.pourcentage}%`,
      })));

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Résultats");
      XLSX.writeFile(wb, `${filename}.xlsx`);
    }
    else if (format === 'pdf') {
      const doc = new jsPDF();
      doc.setFontSize(16);
      doc.text(`Résultats du Scrutin : ${electionDetail?.title ?? ''}`, 14, 20);

      autoTable(doc, {
        startY: 30,
        head: [['Rang', 'Candidat', 'Voix', 'Pourcentage']],
        body: rows.map(r => [r.rang, r.candidat, r.voix, `${r.pourcentage}%`]),
        theme: 'grid',
      });

      doc.save(`${filename}.pdf`);
    }
  };

  if (loadingElections) {
    return (
      <div className="h-[calc(100vh-68px)] flex items-center justify-center">
        <FadeLoader color="#1e40af" cssOverride={{ display: 'block', margin: '0 auto' }} />
      </div>
    );
  }

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
                value={selectedElectionUuid}
                onChange={(e) => handleSelectElection(e.target.value)}
                className="bg-[var(--color-white)] border border-[var(--color-gray-light)]
                 rounded-[var(--radius-md)] px-4 py-2.5 text-sm font-medium
                 focus:outline-none focus:border-[var(--color-primary)]
                 w-full sm:w-auto min-w-[240px]"
              >
                {elections.map((election) => (
                  <option key={election.uuid} value={election.uuid}>
                    {election.title}
                  </option>
                ))}
              </select>
            </div>

            {electionDetail && (
              <span className={`px-3 py-1 text-sm font-medium rounded-full w-fit ${['closed', 'completed'].includes(electionDetail.status) ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                {electionDetail.status_label}
              </span>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            {/* Bouton Recalculer — uniquement pour les élections clôturées
                (contrainte du backend, ResultController::calculate()) */}
            {electionDetail?.status === 'closed' && (
              <button
                onClick={handleRecalculate}
                disabled={recalculating}
                className="btn-secondary flex items-center justify-center gap-2 font-medium px-6 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw size={18} className={recalculating ? 'animate-spin' : ''} />
                {recalculating ? 'Calcul en cours...' : 'Recalculer les résultats'}
              </button>
            )}

            {/* Bouton Export */}
            <div className="relative">
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                disabled={rows.length === 0}
                className="btn-primary flex items-center gap-2 font-medium px-6 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
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
      </div>

      {loadingResults ? (
        <div className="py-20 flex justify-center"><FadeLoader color="#1e40af" /></div>
      ) : elections.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 text-center text-gray-500 border border-[var(--color-gray-light)]">
          Aucune élection dans cette organisation.
        </div>
      ) : notReady ? (
        <div className="bg-white rounded-2xl p-10 text-center text-gray-500 border border-[var(--color-gray-light)]">
          Les résultats définitifs seront disponibles à la clôture de cette élection.
        </div>
      ) : (
        <>
          {/* Statistiques Cards */}
          <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 ${showParticipation ? 'xl:grid-cols-4' : 'xl:grid-cols-3'}`}>
            {[
              { label: 'Total Inscrits', value: electionDetail?.statistics?.total_electors ?? '—' },
              { label: 'Suffrages Exprimés', value: totalVotes },
              { label: 'Candidats', value: electionDetail?.candidates_count ?? rows.length },
              showParticipation && {
                label: 'Taux de Participation',
                value: electionDetail?.statistics?.participation_rate != null ? `${Math.round(electionDetail.statistics.participation_rate)}%` : '—',
                highlight: true,
              },
            ].filter(Boolean).map((stat, i) => (
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
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={90} outerRadius={130} dataKey="value">
                      {pieData.map((entry, index) => (
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
              <h3 className="font-medium text-gray-700 mb-6">VOIX PAR CANDIDAT</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={rows.map(r => ({ name: r.candidat, voix: r.voix }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="voix" fill="#1E40AF" radius={[8, 8, 0, 0]} />
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
                    <th className="text-left py-2 px-2 font-medium text-gray-600">CANDIDAT</th>
                    <th className="text-left py-2 px-2 font-medium text-gray-600">VOIX</th>
                    <th className="text-left py-2 px-2 font-medium text-gray-600">POURCENTAGE</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-gray-light)]">
                  {paginatedRows.map((item) => (
                    <tr key={item.rang} className="hover:bg-gray-50">
                      <td className="px-2 py-2">
                        <div className="flex items-center justify-center w-9 h-9 rounded-full bg-[var(--color-gray-light)] text-gray-700 font-semibold text-lg">
                          {item.rang}
                        </div>
                      </td>
                      <td className="px-2 py-2 font-medium">{item.candidat}</td>
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {rows.length > PAGE_SIZE && (
              <div className="flex flex-col lg:flex-row justify-between items-center px-6 py-4 border-t border-t-[var(--color-gray-light)] text-sm gap-3">
                <span className="text-[var(--color-gray)]">
                  {(page - 1) * PAGE_SIZE + 1} à {Math.min(page * PAGE_SIZE, rows.length)} sur {rows.length}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(p - 1, 1))}
                    disabled={page === 1}
                    className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span className="px-3 py-1 bg-[var(--color-primary)] text-white rounded">{page} / {totalPages}</span>
                  <button
                    onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                    disabled={page >= totalPages}
                    className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Resultats;

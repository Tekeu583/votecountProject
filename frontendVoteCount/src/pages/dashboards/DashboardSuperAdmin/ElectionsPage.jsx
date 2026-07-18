import {
  Plus, Search, Eye, Pencil, Trash2,
  Calendar, BarChart3, Vote,
  ChevronLeft, ChevronRight, Building2, RefreshCw,
} from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import ElectionModal from './ElectionModal';
import toast from 'react-hot-toast';
import TextInput from '@components/ui/TextInput';
import StatCard from '@components/dashboard/StatCard';
import { electionsApi, analyticsApi } from '@services/api';
import { FadeLoader } from 'react-spinners';
import { useDebounce } from '@hooks/useDebounce';

// -- Shape initiale ------------------------------------------------
const EMPTY_PAGE = {
  data: [],
  meta: { current_page: 1, last_page: 1, per_page: 15, total: 0, from: 0, to: 0 },
};

// -- Mapping status → libellé + couleur --------------------------─
const STATUS_CONFIG = {
  draft: { label: 'Brouillon', color: 'text-gray-400' },
  pending: { label: 'En attente', color: 'text-yellow-500' },
  published: { label: 'Publiée', color: 'text-blue-500' },
  ongoing: { label: 'En cours', color: 'text-green-500' },
  paused: { label: 'En pause', color: 'text-orange-400' },
  closed: { label: 'Clôturée', color: 'text-red-500' },
  cancelled: { label: 'Annulée', color: 'text-red-700' },
  archived: { label: 'Archivée', color: 'text-gray-500' },
};

const formatDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export default function ElectionsPage() {
  const [openModal, setOpenModal] = useState(false);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  // -- State paginé --------------------------------------------
  const [elections, setElections] = useState(EMPTY_PAGE);

  // -- Filtres séparés ------------------------------------------
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [page, setPage] = useState(1);

  // -- Stats séparées ------------------------------------------─
  const [stats, setStats] = useState({
    total: '—', ongoing: '—', published: '—',
    closed: '—', total_votes: '—', new_this_month: '—',draft: '-',
  });

  // -- Debounce recherche --------------------------------------─
  const debouncedSearch = useDebounce(search, 500);

  // -- Fetch liste ----------------------------------------------
  const fetchElections = useCallback(async () => {
    setLoading(true);
    try {
      const response = await electionsApi.getAll({
        page,
        search: debouncedSearch || undefined,
        status: statusFilter || undefined,
        date: dateFilter || undefined,
        per_page: 15,
      });

      const data = response.data?.data ?? [];
      const meta = response.data?.meta ?? EMPTY_PAGE.meta;
      setElections({ data, meta });
    } catch (error) {
      console.log("error", error);
      toast.error('Impossible de charger les élections');
      setElections(EMPTY_PAGE);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, statusFilter, dateFilter]);

  useEffect(() => {
    electionsApi.getStats()
      .then(res => {
        const d = res.data?.data ?? {};
        setStats({
          total: d.total ?? '—',
          ongoing: d.ongoing ?? '—',
          published: d.published ?? '—',
          draft: d.draft ?? '-',
          closed: d.closed ?? '—',
          total_votes: d.total_votes ?? '—',
          new_this_month: d.new_this_month ?? '—',
        });
        console.log("stat elections", d);
      })
      .catch(() => { }); // silencieux — bonus
  }, []);


  // -- Re-fetch liste quand filtres / page changent ------------─
  useEffect(() => {
    fetchElections();
  }, [fetchElections]);

  // -- Remettre à la page 1 quand filtres changent --------------
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter, dateFilter]);

  const handleReset = () => {
    setSearch('');
    setStatusFilter('');
    setDateFilter('');
    setPage(1);
  };

  // FIX 3 : delete par uuid, await + re-fetch
  const handleDelete = async (uuid) => {
    if (!window.confirm('Supprimer cette élection ?')) return;
    try {
      await electionsApi.delete(uuid);
      toast.success('Élection supprimée');
      fetchElections();
    } catch {
      toast.error('Impossible de supprimer cette élection');
    }
  };

  const { data: electionList, meta } = elections;

  return (
    <div className="p-2 space-y-6">

      {/* HEADER */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold">Gestion des Élections</h1>
          <p className="text-sm text-[var(--color-gray)]">Supervision des scrutins</p>
        </div>
        <button
          onClick={() => { setSelected(null); setOpenModal(true); }}
          className="btn-primary flex items-center justify-center gap-2 w-full lg:w-auto"
        >
          <Plus size={16} /> Nouvelle Élection
        </button>
      </div>

      {/* STATS DYNAMIQUES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          title="Élections en cours"
          value={stats.ongoing}
          icon={Vote}
          trend={stats.total !== '—' ? `${stats.total} au total` : undefined}
          delay={100}
        />
        <StatCard
          title="Total votes"
          value={stats.total_votes}
          icon={BarChart3}
          delay={200}
        />
        <StatCard
          title="Planifiées"
          value={stats.published}
          icon={Calendar}
          trend={stats.new_this_month !== '—' ? `+${stats.new_this_month} ce mois` : undefined}
          delay={300}
        />
        <StatCard
          title="Broullons"
          value={stats.draft}
          icon={Calendar}
          delay={400}
        />
      </div>

      {/* FILTRES */}
      <div className="p-4 bg-[var(--color-background-white)] rounded-[--radius-md] shadow flex flex-col gap-3 md:flex-row lg:items-center">
        <div className="relative w-full lg:w-2/3">
          <TextInput
            iconLeft={Search}
            placeholder="Rechercher une élection..."
            value={search}
            // FIX 4 : debounce — pas de re-fetch à chaque frappe
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="input w-full lg:w-auto"
        >
          <option value="">Tous les statuts</option>
          <option value="draft">Brouillon</option>
          <option value="pending">En attente</option>
          <option value="published">Publiée</option>
          <option value="ongoing">En cours</option>
          <option value="paused">En pause</option>
          <option value="closed">Clôturée</option>
          <option value="cancelled">Annulée</option>
          <option value="archived">Archivée</option>
        </select>

        <TextInput
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
        />

        <button
          onClick={handleReset}
          className="flex items-center gap-2 btn-secondary transition-colors whitespace-nowrap"
        >
          <RefreshCw size={16} /> Réinitialiser
        </button>
      </div>

      {/* TABLE */}
      <div className="bg-[var(--color-background-white)] rounded shadow overflow-x-auto">
        {(() => {

          if (loading) {
            return (
              <div className="flex items-center justify-center">
                <div className="text-center">
                  <FadeLoader color="#1e40af" size={48} cssOverride={{ display: "block", margin: "0 auto", }} />
                  <p className="mt-4 text-gray-600">
                    Chargement...
                  </p>
                </div>
              </div>
            );
          }
          if (electionList.length === 0) {
            return (
              <div className="flex flex-col items-center justify-center p-12 text-center">
                <Building2 size={48} className="text-gray-300 mb-4" />
                <h3 className="text-lg font-semibold text-gray-600">Aucune élection trouvée</h3>
                <p className="text-sm text-gray-500">Modifiez vos filtres ou créez une nouvelle élection</p>
              </div>
            );
          }

          return (
            <table className="w-full text-sm">
              <thead className="bg-[var(--color-gray-light)] text-md">
                <tr className="capitalize">
                  <th className="px-4 py-2 text-left">Élection</th>
                  <th className="px-4 py-2 text-left">Créateur</th>
                  <th className="px-4 py-2 text-left">Organisation</th>
                  <th className="px-4 py-2 text-left">Statut</th>
                  <th className="px-4 py-2 text-left">Période</th>
                  <th className="px-4 py-2 text-left">Votes</th>
                  <th className="px-4 py-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {electionList.map((e) => {
                  const statusCfg = STATUS_CONFIG[e.status] ?? { label: e.status, color: 'text-gray-500' };
                  return (
                    <tr key={e.uuid} className="border-t border-t-[var(--color-gray-light)] hover:bg-[var(--color-gray-light)]/40">
                      <td className="px-4 py-2 font-medium max-w-[200px] truncate" title={e.title}>
                        {e.title}
                      </td>
                      <td className="px-4 py-2">
                        {/* FIX 5 : optionnel chaining — creator peut être null */}
                        {e.creator?.last_name} {e.creator?.first_name}
                      </td>
                      <td className="px-4 py-2">
                        {e.organization?.name ?? '—'}
                      </td>
                      <td className="px-4 py-2">
                        {/* FIX 6 : libellé français depuis STATUS_CONFIG */}
                        <span className={`flex items-center gap-1 whitespace-nowrap ${statusCfg.color}`}>
                          ● {statusCfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-xs">
                        {/* FIX 7 : formatDate — pas d'ISO brut */}
                        {formatDate(e.start_at)} → {formatDate(e.end_at)}
                      </td>
                      <td className="px-4 py-2">
                        {e.statistics?.total_votes ?? 0}
                      </td>
                      <td className="px-4 py-2 flex gap-3 items-center">
                        <button title="Voir" className="text-[var(--color-gray)] hover:text-[var(--color-primary)]">
                          <Eye size={16} />
                        </button>
                        <button
                          title="Modifier"
                          onClick={() => { setSelected(e); setOpenModal(true); }}
                          className="text-[var(--color-gray)] hover:text-[var(--color-primary)]"
                        >
                          <Pencil size={16} />
                        </button>
                        {/* FIX 3 : uuid au lieu de id */}
                        <button
                          title="Supprimer"
                          onClick={() => handleDelete(e.uuid)}
                          className="text-[var(--color-gray)] hover:text-[var(--color-danger)]"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )
        })()}

        {/* PAGINATION */}
        {!loading && meta.total > 0 && (
          <div className="flex flex-col lg:flex-row justify-between items-center p-4 text-sm gap-3">
            {/* FIX 8 : meta.from/to/total directs — pas de calcul manuel */}
            <span className="text-[var(--color-gray)]">
              {meta.from}–{meta.to} sur {meta.total} élections
            </span>

            <div className="flex gap-2 items-center">
              <button
                disabled={meta.current_page === 1}
                onClick={() => setPage(p => p - 1)}
                className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="px-3 py-1 bg-[var(--color-primary)] text-white rounded">
                {meta.current_page} / {meta.last_page}
              </span>
              <button
                disabled={meta.current_page === meta.last_page}
                onClick={() => setPage(p => p + 1)}
                className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL */}
      {openModal && (
        <ElectionModal
          data={selected}
          onClose={() => setOpenModal(false)}
          onSuccess={(message) => {
            setOpenModal(false);
            toast.success(message);
            fetchElections();
          }}
          onError={(message) => toast.error(message)}
        />
      )}
    </div>
  );
}
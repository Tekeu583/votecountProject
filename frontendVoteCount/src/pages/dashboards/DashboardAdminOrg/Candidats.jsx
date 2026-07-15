// pages/dashboards/DashboardAdminOrg/Candidats.jsx
import {
  Search, Plus, Trash2, User, ChevronLeft, ChevronRight,
  Upload, X, CheckCircle, XCircle, Clock, Loader2, RefreshCw,
} from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { useDebounce } from '@hooks/useDebounce';
import toast from 'react-hot-toast';
import CandidatModal from './CandidatModal';
import TextInput from '@components/ui/TextInput';
import { candidatesApi, electionsApi, organizationsApi } from '@services/api';
import { useOrg } from '@hooks/useOrg';
import { FadeLoader } from 'react-spinners';

// Badge statut candidat
const StatusBadge = ({ status }) => {
  const map = {
    approved: { label: 'Approuvé', cls: 'bg-green-100 text-green-700', icon: <CheckCircle size={11} /> },
    pending: { label: 'En attente', cls: 'bg-amber-100 text-amber-700', icon: <Clock size={11} /> },
    rejected: { label: 'Rejeté', cls: 'bg-red-100 text-red-700', icon: <XCircle size={11} /> },
  };
  const s = map[status] ?? { label: status, cls: 'bg-gray-100 text-gray-600', icon: null };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${s.cls}`}>
      {s.icon}{s.label}
    </span>
  );
};

const PER_PAGE = 15;

export default function Candidats() {
  const { org } = useOrg();

  // ── États ────────────────────────────────────────────────────
  const [candidates, setCandidates] = useState([]);
  const [elections, setElections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingElec, setLoadingElec] = useState(true);

  // Filtres
  const [searchTerm, setSearchTerm] = useState('');

  const debouncedSearch = useDebounce(searchTerm, 400);
  const [statusFilter, setStatusFilter] = useState('all');
  const [electionFilter, setElectionFilter] = useState('all');

  // Pagination
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);

  // Modal
  const [openModal, setOpenModal] = useState(false);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    if (!org?.uuid) return;
    const fetch = async () => {
      setLoadingElec(true);
      try {
        const res = await electionsApi.getAll({ organization_uuid: org.uuid, per_page: 100 });
        setElections(res.data?.data ?? []);

      } catch {
        toast.error('Impossible de charger les élections.');
      } finally {
        setLoadingElec(false);
      }
    };
    fetch();
  }, [org?.uuid]);

  // Un seul appel serveur, paginé et filtré côté backend (organizationsApi.
  // getCandidates) — plutôt qu'un fan-out d'une requête par élection (jusqu'à
  // 20 requêtes HTTP en parallèle rien que pour afficher 15 lignes), qui
  // rendait la page lente à charger dès que l'organisation avait plusieurs
  // élections.
  const loadCandidates = useCallback(async (p = 1) => {
    if (!org?.uuid) return;

    setLoading(true);
    try {
      const res = await organizationsApi.getCandidates(org.uuid, {
        status: statusFilter !== 'all' ? statusFilter : undefined,
        election_uuid: electionFilter !== 'all' ? electionFilter : undefined,
        search: debouncedSearch || undefined,
        page: p,
        per_page: PER_PAGE,
      });

      setCandidates(res.data?.data ?? []);
      setTotal(res.data?.meta?.total ?? 0);
      setLastPage(res.data?.meta?.last_page ?? 1);
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Erreur de chargement.');
      setCandidates([]);
    } finally {
      setLoading(false);
    }
  }, [org?.uuid, electionFilter, statusFilter, debouncedSearch]);

  useEffect(() => {
    if (!org?.uuid) return;
    setPage(1);
    loadCandidates(1);
  }, [org?.uuid, electionFilter, statusFilter, debouncedSearch, loadCandidates]);

  useEffect(() => {
    if (!electionFilter || page === 1) return;
    loadCandidates(page);
  }, [page, loadCandidates, electionFilter]);

  // ── Actions ──────────────────────────────────────────────────
  const handleApprove = async (candidate) => {
    try {
      await candidatesApi.approve(candidate.uuid);
      toast.success(`${candidate.full_name} approuvé.`);
      loadCandidates(page);
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Erreur lors de l\'approbation.');
    }
  };

  const handleReject = async (candidate) => {
    const reason = window.prompt('Raison du rejet (optionnel) :') ?? '';
    try {
      await candidatesApi.reject(candidate.uuid, reason);
      toast.success(`${candidate.full_name} rejeté.`);
      loadCandidates(page);
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Erreur lors du rejet.');
    }
  };

  const handleDelete = async (candidate) => {
    if (!window.confirm(`Supprimer ${candidate.full_name} ?`)) return;
    try {
      await candidatesApi.delete(candidate.election?.uuid, candidate.uuid);
      toast.success('Candidat supprimé.');
      loadCandidates(page);
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Erreur lors de la suppression.');
    }
  };

  const handleImport = () => {
    if (electionFilter === 'all') {
      toast.error('Sélectionnez une élection avant d\'importer.');
      return;
    }
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv,.xlsx,.xls';
    input.onchange = async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const toastId = toast.loading('Import en cours...');
      try {
        await candidatesApi.import(electionFilter, file);
        toast.success('Import réussi !', { id: toastId });
        loadCandidates(1);
      } catch (err) {
        toast.error(err.response?.data?.message ?? 'Erreur d\'import.', { id: toastId });
      }
    };
    input.click();
  };

  const resetFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setElectionFilter('all');
    setPage(1);
  };

  // ── Rendu ─────────────────────────────────────────────────────
  return (
    <div className="p-2 space-y-6">

      {/* HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold text-[var(--color-dark)]">
            Gestion des Candidats
          </h1>
          <p className="text-sm text-[var(--color-gray)] mt-1">
            {total} candidat{total > 1 ? 's' : ''} au total
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
          <button
            onClick={handleImport}
            className="flex items-center max-h-12 justify-center gap-2 px-5 py-3 bg-[var(--color-white)] border border-[var(--color-gray-light)] rounded-xl hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors font-medium whitespace-nowrap"
          >
            <Upload size={16} />
            <span className="hidden sm:inline">Importer CSV/Excel</span>
            <span className="sm:hidden">Importer</span>
          </button>
          <button
            onClick={() => { setSelected(null); setOpenModal(true); }}
            disabled={loadingElec || elections.length === 0}
            className="btn-primary flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium w-full sm:w-auto whitespace-nowrap disabled:opacity-50"
          >
            <Plus size={18} /> Ajouter un candidat
          </button>
        </div>
      </div>

      {/* FILTRES */}
      <div className="p-4 bg-[var(--color-background-white)] rounded-[--radius-md] shadow flex flex-col gap-3 md:flex-row lg:items-center">
        <div className="relative w-full">
          <TextInput
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            iconLeft={Search}
            placeholder="Rechercher un candidat..."
          />
        </div>

        {/* Filtre par élection */}
        <select
          value={electionFilter}
          onChange={(e) => setElectionFilter(e.target.value)}
          className="input w-full lg:w-auto"
          disabled={loadingElec}
        >
          <option value='all'>Toutes les élections</option>
          {elections.map(e => (
            <option key={e.uuid} value={e.uuid}>{e.title}</option>
          ))}
        </select>

        {/* Filtre par statut */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="input w-full lg:w-auto"
        >
          <option value="all">Tous les statuts</option>
          <option value="pending">En attente</option>
          <option value="approved">Approuvé</option>
          <option value="rejected">Rejeté</option>
        </select>
        {(searchTerm || statusFilter !== 'all' || electionFilter !== 'all') && (
          <button
            onClick={resetFilters}
            className="flex items-center gap-1 btn-secondary font-medium whitespace-nowrap"
          >
            <RefreshCw size={14} /> Réinitialiser
          </button>
        )}
      </div>

      {/* TABLE */}
      <div className="bg-[var(--color-white)] rounded-[var(--radius-md)] shadow-[var(--shadow-md)] overflow-x-auto">
        {(() => {

          if (loadingElec || loading) {
            return (
              <div className="flex items-center justify-center">
                <FadeLoader color="#1e40af" size={48} cssOverride={{ display: "block", margin: "0 auto", }} />
              </div>
            );
          }
          if (candidates.length === 0) {
            return (
              <div className="text-center py-16 text-[var(--color-gray)]">
                {electionFilter === 'all' && elections.length === 0
                  ? 'Aucune élection trouvée pour cette organisation.'
                  : 'Aucun candidat trouvé pour ces critères.'}
              </div>
            );
          }
          return (
            <table className="w-full text-sm min-w-[700px]">
              <thead className="bg-[var(--color-gray-light)] text-xs uppercase">
                <tr>
                  <th className="px-4 py-3 text-left">Candidat</th>
                  <th className="px-4 py-3 text-left">Élection</th>
                  <th className="px-4 py-3 text-left hidden md:table-cell">Candidature</th>
                  <th className="px-4 py-3 text-left">Statut</th>
                  <th className="px-4 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {candidates.map((c) => (
                  <tr key={c.uuid} className="border-t border-[var(--color-gray-light)] hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {c.photo ? (
                          <img src={c.photo} alt={c.full_name} className="w-8 h-8 rounded-full object-cover" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                            <User size={14} />
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-[var(--color-dark)]">{c.full_name}</p>
                          <p className="text-xs text-[var(--color-gray)]">{c.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[var(--color-gray)]">{c.election?.title}</td>
                    <td className="px-4 py-3 text-[var(--color-gray)] hidden md:table-cell">
                      {c.created_at ? new Date(c.created_at).toLocaleDateString('fr-FR') : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={c.status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        {/* Approuver */}
                        {c.status === 'pending' && (
                          <button
                            onClick={() => handleApprove(c)}
                            title="Approuver"
                            className="p-1.5 rounded text-green-600 hover:bg-green-50 transition"
                          >
                            <CheckCircle size={15} />
                          </button>
                        )}
                        {/* Rejeter */}
                        {c.status === 'pending' && (
                          <button
                            onClick={() => handleReject(c)}
                            title="Rejeter"
                            className="p-1.5 rounded text-red-500 hover:bg-red-50 transition"
                          >
                            <XCircle size={15} />
                          </button>
                        )}
                        {/* Modifier */}
                        <button
                          onClick={() => { setSelected(c); setOpenModal(true); }}
                          title="Modifier"
                          className="p-1.5 rounded text-[var(--color-primary)] hover:bg-blue-50 transition text-xs font-medium"
                        >
                          Éditer
                        </button>
                        {/* Supprimer */}
                        <button
                          onClick={() => handleDelete(c)}
                          title="Supprimer"
                          className="p-1.5 rounded text-red-500 hover:bg-red-50 transition"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        })()}
      </div>

      {/* PAGINATION */}
      {!loading && lastPage > 1 && (
        <div className="flex items-center justify-between p-2 text-sm">
          <span className="text-[var(--color-gray)]">
            Page {page} sur {lastPage} — {total} résultat(s)
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex items-center gap-1 px-3 py-2 border border-gray-200 rounded-[var(--radius-md)] text-sm disabled:opacity-50 hover:bg-gray-50"
            >
              <ChevronLeft size={16} /> Précédent
            </button>
            <button
              onClick={() => setPage(p => Math.min(lastPage, p + 1))}
              disabled={page === lastPage}
              className="flex items-center gap-1 px-3 py-2 border border-gray-200 rounded-[var(--radius-md)] text-sm disabled:opacity-50 hover:bg-gray-50"
            >
              Suivant <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* MODAL */}
      {openModal && (
        <CandidatModal
          data={selected}
          elections={elections}
          onClose={() => setOpenModal(false)}
          onSuccess={() => {
            setOpenModal(false);
            loadCandidates(page);
          }}
        />
      )}
    </div>
  );
}
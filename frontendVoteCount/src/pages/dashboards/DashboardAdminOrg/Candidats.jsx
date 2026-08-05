// pages/dashboards/DashboardAdminOrg/Candidats.jsx
import {
  Search, Plus, Trash2, User, ChevronLeft, ChevronRight,
  Upload, CheckCircle, XCircle, Clock, RefreshCw, Inbox, Users as UsersIcon,
} from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { useDebounce } from '@hooks/useDebounce';
import toast from 'react-hot-toast';
import CandidatModal from './CandidatModal';
import TextInput from '@components/ui/TextInput';
import { candidatesApi, candidateApplicationsApi, electionsApi, organizationsApi } from '@services/api';
import { useOrg } from '@hooks/useOrg';
import { FadeLoader } from 'react-spinners';

// Badge statut (candidat.status ET candidature.application_status : mêmes clés)
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

// Suivi de l'import : l'API répond 202 (traitement mis en file), il faut donc
// interroger son statut jusqu'à ce qu'il aboutisse.
const IMPORT_POLL_MS = 2000;
const IMPORT_MAX_ATTEMPTS = 45; // ~90 s, au-delà on rend la main à l'utilisateur

/**
 * Interroge le statut de l'import jusqu'à son terme.
 * @returns les données finales, ou null si le délai est dépassé (le traitement
 *          continue côté serveur, on évite simplement d'attendre indéfiniment).
 */
const pollImportStatus = async (electionUuid, jobId) => {
  for (let attempt = 0; attempt < IMPORT_MAX_ATTEMPTS; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, IMPORT_POLL_MS));

    try {
      const res = await candidatesApi.importStatus(electionUuid, jobId);
      const data = res.data?.data;

      if (data?.status === 'completed' || data?.status === 'failed') {
        return data;
      }
    } catch {
      // Erreur réseau ponctuelle : on retente au tour suivant.
    }
  }

  return null;
};

export default function Candidats() {
  const { org } = useOrg();

  // Onglet actif : 'candidates' (candidats en lice) | 'applications' (candidatures publiques reçues)
  const [activeTab, setActiveTab] = useState('candidates');

  // -- États ----------------------------------------------------
  const [candidates, setCandidates] = useState([]);
  const [applications, setApplications] = useState([]);
  const [elections, setElections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingElec, setLoadingElec] = useState(true);

  // Filtres (partagés entre les deux onglets)
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 400);
  const [statusFilter, setStatusFilter] = useState('all');
  const [electionFilter, setElectionFilter] = useState('all');

  // Pagination
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);

  // Modal (ajout/édition de candidat)
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

  // -- Chargement selon l'onglet actif --------------------------
  const loadData = useCallback(async (p = 1) => {
    if (!org?.uuid) return;

    setLoading(true);
    const params = {
      status: statusFilter !== 'all' ? statusFilter : undefined,
      election_uuid: electionFilter !== 'all' ? electionFilter : undefined,
      search: debouncedSearch || undefined,
      page: p,
      per_page: PER_PAGE,
    };

    try {
      if (activeTab === 'applications') {
        const res = await organizationsApi.getApplications(org.uuid, params);
        setApplications(res.data?.data ?? []);
        setTotal(res.data?.meta?.total ?? 0);
        setLastPage(res.data?.meta?.last_page ?? 1);
      } else {
        const res = await organizationsApi.getCandidates(org.uuid, params);
        setCandidates(res.data?.data ?? []);
        setTotal(res.data?.meta?.total ?? 0);
        setLastPage(res.data?.meta?.last_page ?? 1);
      }
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Erreur de chargement.');
      if (activeTab === 'applications') setApplications([]);
      else setCandidates([]);
    } finally {
      setLoading(false);
    }
  }, [org?.uuid, activeTab, electionFilter, statusFilter, debouncedSearch]);

  useEffect(() => {
    if (!org?.uuid) return;
    setPage(1);
    loadData(1);
  }, [org?.uuid, activeTab, electionFilter, statusFilter, debouncedSearch, loadData]);

  useEffect(() => {
    if (page === 1) return;
    loadData(page);
  }, [page, loadData]);

  // -- Actions candidats ----------------------------------------
  const handleApprove = async (candidate) => {
    try {
      await candidatesApi.approve(candidate.uuid);
      toast.success(`${candidate.full_name} approuvé.`);
      loadData(page);
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Erreur lors de l\'approbation.');
    }
  };

  const handleReject = async (candidate) => {
    const reason = window.prompt('Raison du rejet (optionnel) :') ?? '';
    try {
      await candidatesApi.reject(candidate.uuid, reason);
      toast.success(`${candidate.full_name} rejeté.`);
      loadData(page);
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Erreur lors du rejet.');
    }
  };

  const handleDelete = async (candidate) => {
    if (!window.confirm(`Supprimer ${candidate.full_name} ?`)) return;
    try {
      await candidatesApi.delete(candidate.election?.uuid, candidate.uuid);
      toast.success('Candidat supprimé.');
      loadData(page);
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Erreur lors de la suppression.');
    }
  };

  // -- Actions candidatures publiques ---------------------------
  const handleApproveApplication = async (app) => {
    if (!window.confirm(`Approuver la candidature de ${app.full_name} ? Un candidat sera créé pour l'élection concernée.`)) return;
    try {
      await candidateApplicationsApi.approve(app.election?.uuid, app.uuid);
      toast.success(`Candidature de ${app.full_name} approuvée — candidat créé.`);
      loadData(page);
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Erreur lors de l\'approbation.');
    }
  };

  const handleRejectApplication = async (app) => {
    const reason = window.prompt('Raison du rejet (communiquée au candidat) :');
    if (reason === null) return; // annulé
    try {
      await candidateApplicationsApi.reject(app.election?.uuid, app.uuid, reason);
      toast.success(`Candidature de ${app.full_name} rejetée.`);
      loadData(page);
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Erreur lors du rejet.');
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
        // L'API répond 202 : elle a seulement MIS EN FILE le traitement.
        // Annoncer le succès ici afficherait « Import réussi » alors qu'aucun
        // candidat n'est encore créé — et masquerait les lignes rejetées.
        const res = await candidatesApi.import(electionFilter, file);
        const jobId = res.data?.data?.import_job_id;
        if (!jobId) throw new Error('Identifiant de traitement non reçu.');

        const result = await pollImportStatus(electionFilter, jobId);

        if (!result) {
          toast(
            'Import toujours en cours. Rafraîchissez la page dans quelques instants.',
            { id: toastId, icon: '⏳' },
          );
          return;
        }

        const { status, success_rows: ok = 0, failed_rows: ko = 0, errors = [] } = result;

        if (status === 'completed' && ok > 0) {
          toast.success(`${ok} candidat(s) importé(s).`, { id: toastId });
          loadData(1);
        } else {
          toast.error('Aucun candidat importé.', { id: toastId });
        }

        // Les lignes rejetées sont détaillées : sans leur numéro et leur motif,
        // l'utilisateur ne peut pas corriger son fichier.
        if (ko > 0) {
          const detail = errors
            .slice(0, 3)
            .map((e) => `Ligne ${e.row} : ${e.message}`)
            .join('\n');
          const reste = errors.length > 3 ? `\n… et ${errors.length - 3} autre(s).` : '';
          toast.error(`${ko} ligne(s) rejetée(s).\n${detail}${reste}`, { duration: 10000 });
        }
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

  const isApplications = activeTab === 'applications';

  // -- Rendu ----------------------------------------------------─
  return (
    <div className="p-2 space-y-6">

      {/* HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold text-[var(--color-dark)]">
            Gestion des Candidats
          </h1>
          <p className="text-sm text-[var(--color-gray)] mt-1">
            {total} {isApplications ? `candidature${total > 1 ? 's' : ''} reçue${total > 1 ? 's' : ''}` : `candidat${total > 1 ? 's' : ''}`} au total
          </p>
        </div>
        {/* Boutons ajout/import : uniquement pour les candidats en lice */}
        {!isApplications && (
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
        )}
      </div>

      {/* ONGLETS */}
      <div className="flex gap-1 border-b border-[var(--color-gray-light)]">
        <button
          onClick={() => setActiveTab('candidates')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${!isApplications
            ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
            : 'border-transparent text-[var(--color-gray)] hover:text-[var(--color-dark)]'}`}
        >
          <UsersIcon size={16} /> Candidats
        </button>
        <button
          onClick={() => setActiveTab('applications')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${isApplications
            ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
            : 'border-transparent text-[var(--color-gray)] hover:text-[var(--color-dark)]'}`}
        >
          <Inbox size={16} /> Candidatures reçues
        </button>
      </div>

      {/* FILTRES */}
      <div className="p-4 bg-[var(--color-background-white)] rounded-[--radius-md] shadow flex flex-col gap-3 md:flex-row lg:items-center">
        <div className="relative w-full">
          <TextInput
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            iconLeft={Search}
            placeholder={isApplications ? 'Rechercher une candidature...' : 'Rechercher un candidat...'}
          />
        </div>

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
              <div className="flex items-center justify-center py-16">
                <FadeLoader color="#1e40af" size={48} cssOverride={{ display: "block", margin: "0 auto", }} />
              </div>
            );
          }

          const list = isApplications ? applications : candidates;
          if (list.length === 0) {
            return (
              <div className="text-center py-16 text-[var(--color-gray)]">
                {electionFilter === 'all' && elections.length === 0
                  ? 'Aucune élection trouvée pour cette organisation.'
                  : isApplications
                    ? 'Aucune candidature reçue pour ces critères.'
                    : 'Aucun candidat trouvé pour ces critères.'}
              </div>
            );
          }

          // -- Table des CANDIDATURES REÇUES --
          if (isApplications) {
            return (
              <table className="w-full text-sm min-w-[700px]">
                <thead className="bg-[var(--color-gray-light)] text-xs uppercase">
                  <tr>
                    <th className="px-4 py-3 text-left">Candidat</th>
                    <th className="px-4 py-3 text-left">Élection</th>
                    <th className="px-4 py-3 text-left hidden md:table-cell">Soumise le</th>
                    <th className="px-4 py-3 text-left">Statut</th>
                    <th className="px-4 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map((a) => (
                    <tr key={a.uuid} className="border-t border-[var(--color-gray-light)] hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {a.photo ? (
                            <img src={a.photo} alt={a.full_name} className="w-8 h-8 rounded-full object-cover" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                              <User size={14} />
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-[var(--color-dark)]">{a.full_name}</p>
                            <p className="text-xs text-[var(--color-gray)]">{a.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[var(--color-gray)]">{a.election?.title ?? '—'}</td>
                      <td className="px-4 py-3 text-[var(--color-gray)] hidden md:table-cell">
                        {a.submitted_at ? new Date(a.submitted_at).toLocaleDateString('fr-FR') : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={a.application_status} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          {a.application_status === 'pending' ? (
                            <>
                              <button
                                onClick={() => handleApproveApplication(a)}
                                title="Approuver — crée le candidat"
                                className="p-1.5 rounded text-green-600 hover:bg-green-50 transition"
                              >
                                <CheckCircle size={15} />
                              </button>
                              <button
                                onClick={() => handleRejectApplication(a)}
                                title="Rejeter"
                                className="p-1.5 rounded text-red-500 hover:bg-red-50 transition"
                              >
                                <XCircle size={15} />
                              </button>
                            </>
                          ) : (
                            <span className="text-xs text-[var(--color-gray)] italic">
                              {a.application_status === 'approved' ? 'Traitée' : 'Rejetée'}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            );
          }

          // -- Table des CANDIDATS en lice --
          return (
            <table className="w-full text-sm min-w-[700px]">
              <thead className="bg-[var(--color-gray-light)] text-xs uppercase">
                <tr>
                  <th className="px-4 py-3 text-left">Candidat</th>
                  <th className="px-4 py-3 text-left">Élection</th>
                  <th className="px-4 py-3 text-left hidden md:table-cell">Ajouté le</th>
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
                        {c.status === 'pending' && (
                          <button
                            onClick={() => handleApprove(c)}
                            title="Approuver"
                            className="p-1.5 rounded text-green-600 hover:bg-green-50 transition"
                          >
                            <CheckCircle size={15} />
                          </button>
                        )}
                        {c.status === 'pending' && (
                          <button
                            onClick={() => handleReject(c)}
                            title="Rejeter"
                            className="p-1.5 rounded text-red-500 hover:bg-red-50 transition"
                          >
                            <XCircle size={15} />
                          </button>
                        )}
                        <button
                          onClick={() => { setSelected(c); setOpenModal(true); }}
                          title="Modifier"
                          className="p-1.5 rounded text-[var(--color-primary)] hover:bg-blue-50 transition text-xs font-medium"
                        >
                          Éditer
                        </button>
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
          );
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
            loadData(page);
          }}
        />
      )}
    </div>
  );
}

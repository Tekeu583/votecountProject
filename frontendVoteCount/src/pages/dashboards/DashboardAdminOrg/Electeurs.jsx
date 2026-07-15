// pages/dashboards/DashboardAdminOrg/Electeurs.jsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus, Search, Upload, Edit2, ChevronLeft,
  ChevronRight, Trash2, RefreshCw, X,
  CheckCircle, Clock, CheckSquare, Square, Mail, Loader2, ShieldQuestion, ShieldCheck
} from 'lucide-react';
import TextInput from '@components/ui/TextInput';
import toast from 'react-hot-toast';
import { useDebounce } from '@hooks/useDebounce';
import { electorsApi, electionsApi } from '@services/api';
import { useOrg } from '@hooks/useOrg';
import { FadeLoader } from 'react-spinners';
import ElecteursModal from './ElecteursModal';

// --- Badge statut vote ----------------------─
const VoteBadge = ({ hasVoted }) => (
  hasVoted
    ? <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
      <CheckCircle size={11} /> Voté
    </span>
    : <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-700">
      <Clock size={11} /> Non voté
    </span>
);

const VerificationBadge = ({ status }) => (
  status === 'verified'
    ? <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
      <ShieldCheck size={11} /> Vérifié
    </span>
    : <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
      <ShieldQuestion size={11} /> Non vérifié
    </span>
);

const PER_PAGE = 15;

const Electeurs = () => {
  const { org } = useOrg();

  // --- États -------------------------------------
  const [electors, setElectors] = useState([]);
  const [elections, setElections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingElec, setLoadingElec] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);

  // Sélection multiple — pour l'envoi ciblé des codes
  const [selectedIds, setSelectedIds] = useState(new Set());

  // Filtres
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 500);

  const [statusFilter, setStatusFilter] = useState('all');
  const [electionFilter, setElectionFilter] = useState('all');
  const [verificationFilter, setVerificationFilter] = useState('all');


  // Modal
  const [openModal, setOpenModal] = useState(false);
  const [selected, setSelected] = useState(null);

  const [sendingCodes, setSendingCodes] = useState(false);
  const [verifying, setVerifying] = useState(false);

  // --- Chargement des élections de l'org (pour le filtre select) ─
  useEffect(() => {
    if (!org?.uuid) return;
    setLoadingElec(true);
    electionsApi
      .getAll({ organization_uuid: org.uuid, per_page: 100 })
      .then(res => setElections(res.data?.data ?? []))
      .catch(() => toast.error('Impossible de charger les élections.'))
      .finally(() => setLoadingElec(false));
  }, [org?.uuid]);

  // --- Chargement des électeurs -------------------
  // Une seule requête paginée côté serveur.
  // Si aucune élection sélectionnée, boucle sur toutes (même pattern que Candidats).
  const loadElectors = useCallback(async (p = 1) => {
    if (!org?.uuid) return;
    setLoading(true);
    try {
      if (electionFilter !== 'all') {
        // Élection spécifique → une requête paginée serveur
        const res = await electorsApi.getAll(electionFilter, {
          page: p,
          per_page: PER_PAGE,
          search: debouncedSearch || undefined,
          has_voted: statusFilter !== 'all' ? statusFilter === 'voted' : undefined,
          verification_status: verificationFilter !== 'all' ? verificationFilter : undefined,
        });
        const list = (res.data?.data ?? []).map(e => ({
          ...e,
          electionTitle: elections.find(el => el.uuid === electionFilter)?.title ?? '—',
          electionUuid: electionFilter,
        }));
        setElectors(list);
        setTotal(res.data?.meta?.total ?? list.length);
        setLastPage(res.data?.meta?.last_page ?? 1);
        setSelectedIds(new Set());
      } else {
        // Toutes les élections — boucle parallèle (même pattern que Candidats)
        const results = await Promise.allSettled(
          elections.map(election =>
            electorsApi.getAll(election.uuid, {
              per_page: 100,
              search: debouncedSearch || undefined,
              has_voted: statusFilter !== 'all' ? statusFilter === 'voted' : undefined,
              verification_status: verificationFilter !== 'all' ? verificationFilter : undefined,
            }).then(res => (res.data?.data ?? []).map(e => ({
              ...e,
              electionTitle: election.title,
              electionUuid: election.uuid,
            })))
          )
        );

        const all = results
          .filter(r => r.status === 'fulfilled')
          .flatMap(r => r.value);

        setTotal(all.length);
        setLastPage(Math.max(1, Math.ceil(all.length / PER_PAGE)));
        setElectors(all.slice((p - 1) * PER_PAGE, p * PER_PAGE));
      }
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Erreur de chargement des électeurs.');
      setElectors([]);
    } finally {
      setLoading(false);
    }
  }, [org?.uuid, electionFilter, debouncedSearch, statusFilter, elections]);

  const currentElection = elections.find(e => e.uuid === electionFilter);

  // Se déclenche 500ms après la dernière frappe, pas à chaque touche.
  useEffect(() => {
    if (elections.length === 0 && electionFilter === 'all') return;
    setPage(1);
    loadElectors(1);
  }, [electionFilter, statusFilter, debouncedSearch, elections]);

  useEffect(() => {
    loadElectors(page);
  }, [page]);

  // --- Sélection -----------------------------------
  const toggleSelect = (uuid) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(uuid) ? next.delete(uuid) : next.add(uuid);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === electors.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(electors.map(e => e.uuid)));
    }
  };

  // --- Envoi des voter_code ------------------
  // Si des électeurs sont sélectionnés → envoi ciblé.
  // Sinon → envoi à TOUS les électeurs actifs de l'élection.
  const handleSendVoterCodes = async () => {
    if (!currentElection) return;

    if (currentElection.election_mode !== 'private') {
      toast.error('Cette élection n\'est pas privée — aucun code à envoyer.');
      return;
    }

    const targetUuids = selectedIds.size > 0 ? Array.from(selectedIds) : null;
    const label = targetUuids
      ? `${targetUuids.length} électeur(s) sélectionné(s)`
      : 'TOUS les électeurs actifs';

    if (!window.confirm(`Envoyer le code d'accès à ${label} ?`)) return;

    setSendingCodes(true);
    try {
      const res = await electorsApi.sendVoterCodes(electionFilter, targetUuids);
      toast.success(res.data?.message ?? 'Codes envoyés avec succès.');
      setSelectedIds(new Set());
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Erreur lors de l\'envoi.');
    } finally {
      setSendingCodes(false);
    }
  };
  // Reset page à 1 quand un filtre change
  const handleFilterChange = (setter) => (value) => {
    setter(value);
    setPage(1);
  };

  // Nécessite une élection précise sélectionnée dans le filtre (même contrainte
  // que handleSendVoterCodes, car l'endpoint est scopé à une élection).
  const handleVerifySelected = async () => {
    if (!currentElection) {
      toast.error('Sélectionnez une élection précise avant de vérifier des électeurs.');
      return;
    }
    if (selectedIds.size === 0) return;

    const targetUuids = Array.from(selectedIds);

    setVerifying(true);
    try {
      const res = await electorsApi.verifyBulk(electionFilter, targetUuids);
      toast.success(res.data?.message ?? 'Électeurs vérifiés avec succès.');
      setSelectedIds(new Set());
      loadElectors(page);
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Erreur lors de la vérification.');
    } finally {
      setVerifying(false);
    }
  };

  // --- Actions --------------------------------------
  const handleDelete = async (elector) => {
    if (!window.confirm(`Supprimer ${elector.full_name} ?`)) return;
    try {
      await electorsApi.delete(elector.electionUuid, elector.uuid);
      toast.success('Électeur supprimé.');
      loadElectors(page);
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
        await electorsApi.import(electionFilter, file);
        toast.success('Import réussi !', { id: toastId });
        loadElectors(1);
      } catch (err) {
        toast.error(err.response?.data?.message ?? 'Erreur d\'import.', { id: toastId });
      }
    };
    input.click();
  };

  const resetFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setVerificationFilter('all');
    setElectionFilter('all');
    setPage(1);
  };

  // --- Rendu -------------------------------------─
  return (
    <div className="bg-[var(--color-background-white)] p-2">

      {/* HEADER */}
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-semibold text-[var(--color-dark)]">
              Gestion des Électeurs
            </h1>
            <p className="text-[var(--color-gray)] mt-2 text-sm md:text-base">
              {total} électeur{total > 1 ? 's' : ''} au total
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            <button
              onClick={handleImport}
              className="flex items-center justify-center gap-2 px-5 py-3 bg-[var(--color-white)] border border-gray-300 rounded-[var(--radius-md)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors font-medium whitespace-nowrap"
            >
              <Upload size={16} />
              <span className="hidden sm:inline">Importer une liste (CSV/Excel)</span>
              <span className="sm:hidden">Importer</span>
            </button>
            <button
              onClick={() => { setSelected(null); setOpenModal(true); }}
              disabled={loadingElec || elections.length === 0}
              className="flex items-center justify-center gap-2 px-6 py-3 btn-primary rounded-[var(--radius-md)] font-medium whitespace-nowrap w-full sm:w-auto disabled:opacity-50"
            >
              <Plus size={16} /> Ajouter un électeur
            </button>
          </div>
        </div>
      </div>
      {/* Bandeau vérification — visible seulement si des électeurs sont sélectionnés */}
      {selectedIds.size > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-[var(--radius-md)] p-4 mb-6 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2 text-sm text-blue-800">
            <ShieldCheck size={16} />
            <span>{selectedIds.size} électeur(s) sélectionné(s)</span>
          </div>
          <button
            onClick={handleVerifySelected}
            disabled={verifying}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-[var(--radius-md)] text-sm font-medium disabled:opacity-50 transition"
          >
            {verifying
              ? <><Loader2 size={14} className="animate-spin" /> Vérification en cours...</>
              : <><ShieldCheck size={14} /> Vérifier la sélection</>
            }
          </button>
        </div>
      )}

      {/* Bandeau envoi codes — visible seulement si élection privée */}
      {currentElection?.election_mode === 'private' && (
        <div className="bg-blue-50 border border-blue-200 rounded-[var(--radius-md)] p-4 mb-6 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2 text-sm text-blue-800">
            <Mail size={16} />
            <span>
              Code d'accès de cette élection : <span className="font-mono font-bold">{currentElection.voter_code}</span>
            </span>
          </div>
          <button
            onClick={handleSendVoterCodes}
            disabled={sendingCodes}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-[var(--radius-md)] text-sm font-medium disabled:opacity-50 transition"
          >
            {sendingCodes
              ? <><Loader2 size={14} className="animate-spin" /> Envoi en cours...</>
              : <><Mail size={14} /> {selectedIds.size > 0
                ? `Envoyer à ${selectedIds.size} sélectionné(s)`
                : 'Envoyer à tous les électeurs'}</>
            }
          </button>
        </div>
      )}

      {/* FILTRES */}
      <div className="bg-[var(--color-white)] rounded-[var(--radius-md)] shadow-[var(--shadow-sm)] border border-gray-100 p-5 md:p-6 mb-6">
        <div className="flex flex-col lg:flex-row gap-4 lg:items-end">
          <div className="flex-1">
            <TextInput
              type="text"
              placeholder="Rechercher par nom ou email..."
              value={searchTerm}
              iconLeft={Search}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* FIX (Claude): NOUVEAU — filtre par statut de vérification */}
          <div className="flex flex-col min-w-[160px]">
            <span className="text-xs text-[var(--color-gray)] mb-1.5 hidden sm:block">Vérification</span>
            <select
              value={verificationFilter}
              onChange={(e) => handleFilterChange(setVerificationFilter)(e.target.value)}
              className="w-full input"
            >
              <option value="all">Tous</option>
              <option value="verified">Vérifié</option>
              <option value="pending">Non vérifié</option>
            </select>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
            <div className="flex flex-col min-w-[160px]">
              <span className="text-xs text-[var(--color-gray)] mb-1.5 hidden sm:block">Statut</span>
              <select
                value={statusFilter}
                onChange={(e) => handleFilterChange(setStatusFilter)(e.target.value)}
                className="w-full input"
              >
                <option value="all">Tous les statuts</option>
                <option value="voted">Voté</option>
                <option value="not_voted">Non voté</option>
              </select>
            </div>
            <div className="flex flex-col w-full sm:w-auto min-w-[160px]">
              <span className="text-xs text-[var(--color-gray)] mb-1.5 hidden sm:block">Élection</span>
              <select
                value={electionFilter}
                onChange={(e) => handleFilterChange(setElectionFilter)(e.target.value)}
                className="w-full input"
              >
                <option value="all">Toutes les élections</option>
                {elections.map(e => (
                  <option key={e.uuid} value={e.uuid}>{e.title}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2 items-end">
              <button
                onClick={resetFilters}
                className="flex items-center gap-1 btn-secondary font-medium whitespace-nowrap"
              >
                <RefreshCw size={16} /> Réinitialiser
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* TABLEAU */}
      <div className="bg-[var(--color-white)] rounded-[var(--radius-md)] shadow-[var(--shadow-sm)] border border-gray-100 overflow-x-auto">
        {(() => {
          if (loading) {
            return (
              <div className="flex items-center justify-center py-20">
                <FadeLoader size={32} color="#1e40af" className=" text-[var(--color-primary)] mx-auto" />
              </div>
            );
          }
          if (electors.length === 0) {
            return (
              <div className="text-center py-16 text-[var(--color-gray)]">
                {elections.length === 0
                  ? 'Aucune élection trouvée pour cette organisation.'
                  : 'Aucun électeur trouvé pour ces critères.'}
              </div>
            );
          }
          return (
            <table className="w-full">
              <thead>
                <tr className="bg-[var(--color-gray-light)] border-b border-[var(--color-gray-light)]">
                  <th className="px-4 py-2 w-10">
                    <button onClick={toggleSelectAll} className="text-[var(--color-gray)] hover:text-[var(--color-primary)]">
                      {selectedIds.size === electors.length
                        ? <CheckSquare size={16} />
                        : <Square size={16} />}
                    </button>
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-[var(--color-dark)] text-sm">Nom complet</th>
                  <th className="text-left px-4 py-3 font-medium text-[var(--color-dark)] text-sm">Email</th>
                  <th className="text-left px-4 py-3 font-medium text-[var(--color-dark)] text-sm hidden md:table-cell">Élection</th>
                  <th className="text-left px-4 py-3 font-medium text-[var(--color-dark)] text-sm">Statut</th>
                  <th className="text-left px-4 py-3 font-medium text-[var(--color-dark)] text-sm">Vérification</th>
                  <th className="text-center px-4 py-3 font-medium text-[var(--color-dark)] text-sm">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-gray-light)]">
                {electors.map((elector) => (
                  <tr key={elector.uuid} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-2">
                      <button onClick={() => toggleSelect(elector.uuid)} className="text-[var(--color-gray)] hover:text-[var(--color-primary)]">
                        {selectedIds.has(elector.uuid)
                          ? <CheckSquare size={16} className="text-[var(--color-primary)]" />
                          : <Square size={16} />}
                      </button>
                    </td>
                    <td className="px-4 py-3 font-medium text-[var(--color-dark)]">
                      {elector.full_name ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-[var(--color-gray)]">
                      {elector.email ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-[var(--color-gray)] hidden md:table-cell truncate max-w-[200px]">
                      {elector.electionTitle}
                    </td>
                    <td className="px-4 py-3">
                      <VoteBadge hasVoted={elector.has_voted} />
                    </td>
                    <td className="px-4 py-3">
                      <VerificationBadge status={elector.verification_status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => { setSelected(elector); setOpenModal(true); }}
                          title="Modifier"
                          className="p-1.5 rounded hover:text-[var(--color-primary)] transition-colors"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(elector)}
                          title="Supprimer"
                          className="p-1.5 rounded hover:text-[var(--color-danger)] transition-colors"
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
        {/* PAGINATION */}
        {!loading && lastPage > 1 && (
          <div className="p-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
            <p className="text-sm text-[var(--color-gray)]">
              Page {page} sur {lastPage} — {total} électeur{total > 1 ? 's' : ''}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-[var(--radius-md)] hover:bg-[var(--color-gray-light)] transition-colors disabled:opacity-40"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="px-3 py-1 bg-[var(--color-primary)] text-white rounded-[var(--radius-md)] text-sm font-medium">
                {page}
              </span>
              <button
                onClick={() => setPage(p => Math.min(lastPage, p + 1))}
                disabled={page === lastPage}
                className="p-2 rounded-[var(--radius-md)] hover:bg-[var(--color-gray-light)] transition-colors disabled:opacity-40"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL */}
      {openModal && (
        <ElecteursModal
          data={selected}
          elections={elections}
          onClose={() => setOpenModal(false)}
          onSuccess={(message) => {
            toast.success(message);
            setOpenModal(false);
            loadElectors(page);
          }}
          onError={(message) => toast.error(message)}
        />
      )}
    </div>
  );
};

export default Electeurs;
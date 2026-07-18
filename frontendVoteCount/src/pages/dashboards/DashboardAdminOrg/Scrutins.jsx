// pages/dashboards/DashboardAdminOrg/Scrutins.jsx
import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { NavLink } from 'react-router-dom';
import {
  Plus, Search, BarChart3, ChevronLeft, ChevronRight,
  Trash2, Eye, Send, MoreVertical, RefreshCw, Loader2,
  Vote, Users, Clock, CheckCircle, XCircle, Archive,
  Filter, Play, Square, Pencil,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { electionsApi } from '@services/api';
import { useOrg } from '@hooks/useOrg';
import { FadeLoader } from "react-spinners";
import TextInput from '@components/ui/TextInput';
import { useDebounce } from '@hooks/useDebounce';
// ── Constantes ────────────────────────────────────────────────────

const ITEMS_PER_PAGE = 10;

const STATUS_CONFIG = {
  draft: { label: 'Brouillon', color: 'bg-gray-100 text-gray-700', icon: Clock },
  pending: { label: 'En attente', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  published: { label: 'Publié', color: 'bg-blue-100 text-blue-700', icon: CheckCircle },
  ongoing: { label: 'En cours', color: 'bg-green-100 text-green-700', icon: Vote },
  paused: { label: 'En pause', color: 'bg-orange-100 text-orange-700', icon: Clock },
  closed: { label: 'Clôturé', color: 'bg-purple-100 text-purple-700', icon: CheckCircle },
  completed: { label: 'Terminé', color: 'bg-teal-100 text-teal-700', icon: CheckCircle },
  cancelled: { label: 'Annulé', color: 'bg-red-100 text-red-700', icon: XCircle },
  archived: { label: 'Archivé', color: 'bg-gray-100 text-gray-600', icon: Archive },
};

const STATUS_FILTERS = [
  { value: 'all', label: 'Tous' },
  { value: 'draft', label: 'Brouillons' },
  { value: 'published', label: 'Publiés' },
  { value: 'ongoing', label: 'En cours' },
  { value: 'closed', label: 'Clôturés' },
  { value: 'completed', label: 'Terminés' },
  { value: 'cancelled', label: 'Annulés' },
];

// ── Helpers ───────────────────────────────────────────────────────

const formatDateTime = (iso) =>
  iso ? new Date(iso).toLocaleString('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }) : '—';

// ── Badge statut ──────────────────────────────────────────────────

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, color: 'bg-gray-100 text-gray-700', icon: Clock };
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-medium whitespace-nowrap ${cfg.color}`}>
      <Icon size={11} />
      {cfg.label}
    </span>
  );
}

// ── Menu d'actions ────────────────────────────────────────────────

function ActionMenu({ election, orgUuid, onAction }) {
  const [open, setOpen] = useState(false);

  const close = () => setOpen(false);


  const actions = [
    {
      label: 'Voir',
      icon: Eye,
      show: true,
      to: `/org/${orgUuid}/results`,
    },
    {
      label: 'Modifier',
      icon: Pencil,
      // Source de vérité unique : Election::getIsEditableAttribute()
      // (déjà utilisé par EditScrutin.jsx) — une liste de statuts en dur
      // ici se désynchronise dès que la règle backend évolue (ex. une
      // élection "ongoing" sans vote redevient modifiable).
      show: election.is_editable,
      to: `/org/${orgUuid}/scrutins/${election.uuid}/edit`,
    },
    {
      label: 'Publier',
      icon: Send,
      show: ['draft', 'pending'].includes(election.status),
      onClick: () => { onAction('publish', election); close(); },
      className: 'text-blue-600',
    },
    {
      label: 'Démarrer',
      icon: Play,
      show: election.status === 'published',
      onClick: () => { onAction('start', election); close(); },
      className: 'text-green-600',
    },
    {
      label: 'Terminer',
      icon: Square,
      show: election.status === 'ongoing',
      onClick: () => { onAction('end', election); close(); },
      className: 'text-orange-600',
    },
    {
      label: 'Résultats',
      icon: BarChart3,
      show: ['closed', 'completed', 'ongoing'].includes(election.status),
      to: `/org/${orgUuid}/results?election=${election.uuid}`,
    },
    {
      label: 'Supprimer',
      icon: Trash2,
      // Autorisé tant qu'aucun vote n'a été reçu, indépendamment du statut.
      show: (election.statistics?.total_votes ?? election.votes_count ?? 0) === 0,
      onClick: () => { onAction('delete', election); close(); },
      className: 'text-red-600',
    },
  ];

  const visible = actions.filter(a => a.show);

  const btnRef = useRef(null);
  const menuRef = useRef(null);
  const [menuStyle, setMenuStyle] = useState({});

  const openMenu = () => {
    if (!btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    const menuHeight = visible.length * 42 + 8;
    const spaceBelow = window.innerHeight - rect.bottom;
    const top = spaceBelow < menuHeight
      ? rect.top - menuHeight
      : rect.bottom + 4;
    setMenuStyle({
      position: 'fixed',
      top,
      left: rect.right - 175,
      width: 175,
      zIndex: 9999,
    });
    setOpen(o => !o);
  };

  useEffect(() => {
    if (!open) return;
    const handleMouseDown = (e) => {
      if (btnRef.current?.contains(e.target)) return;
      if (menuRef.current?.contains(e.target)) return;
      close();
    };
    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [open]);


  const menu = open ? createPortal(
    <div
      ref={menuRef}
      style={menuStyle}
      className="bg-white border border-gray-200 rounded-[var(--radius-md)] shadow-lg py-1"
    >
      {visible.map((action, i) =>
        action.to ? (
          <NavLink
            key={i}
            to={action.to}
            onClick={close}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors ${action.className ?? 'text-gray-700'}`}
          >
            <action.icon size={14} />
            {action.label}
          </NavLink>
        ) : (
          <button
            key={i}
            onClick={action.onClick}
            className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors text-left ${action.className ?? 'text-gray-700'}`}
          >
            <action.icon size={14} />
            {action.label}
          </button>
        )
      )}
    </div>,
    document.body
  ) : null;

  return (
    <div className="relative">
      <button
        ref={btnRef}
        onClick={openMenu}
        className="p-1.5 rounded hover:bg-gray-100 text-gray-700 transition-colors"
      >
        <MoreVertical size={16} />
      </button>
      {menu}
    </div>
  );
}

// ── Page principale ───────────────────────────────────────────────

export default function Scrutins() {
  const { org } = useOrg();

  const [elections, setElections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  const [searchInput, setSearchInput] = useState('');
  const search = useDebounce(searchInput, 400);
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // ── Chargement ────────────────────────────────────────────────

  const loadElections = useCallback(async (page = 1) => {
    if (!org) return;
    setLoading(true);
    try {
      const params = {
        organization_uuid: org.uuid,
        page,
        per_page: ITEMS_PER_PAGE,
      };
      if (statusFilter !== 'all') params.status = statusFilter;
      if (search.trim()) params.search = search.trim();

      const res = await electionsApi.getAll(params);
      const data = res.data?.data ?? res.data ?? [];
      const meta = res.data?.meta ?? {};

      setElections(Array.isArray(data) ? data : []);
      setTotalPages(meta.last_page ?? 1);
      setTotalCount(meta.total ?? (Array.isArray(data) ? data.length : 0));
      setCurrentPage(page);
    } catch {
      toast.error('Erreur lors du chargement des scrutins');
    } finally {
      setLoading(false);
    }
  }, [org, statusFilter, search]);

  useEffect(() => {
    loadElections(1);
  }, [org, statusFilter, search]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Actions sur les élections ─────────────────────────────────

  const CONFIRMATIONS = {
    publish: (e) => `Publier "${e.title}" ? Cette action est irréversible.`,
    start: (e) => `Démarrer "${e.title}" ? Les votants pourront commencer à voter.`,
    end: (e) => `Terminer "${e.title}" ? Le scrutin sera clôturé définitivement.`,
    delete: (e) => `Supprimer "${e.title}" ? Cette action est irréversible.`,
  };

  const HANDLERS = {
    publish: (uuid) => electionsApi.publish(uuid),
    start: (uuid) => electionsApi.start(uuid),
    end: (uuid) => electionsApi.end(uuid),
    delete: (uuid) => electionsApi.delete(uuid),
  };

  const SUCCESS_MESSAGES = {
    publish: 'Scrutin publié avec succès',
    start: 'Scrutin démarré avec succès',
    end: 'Scrutin clôturé avec succès',
    delete: 'Scrutin supprimé',
  };

  const handleAction = async (type, election) => {
    const confirm_msg = CONFIRMATIONS[type]?.(election);
    if (confirm_msg && !window.confirm(confirm_msg)) return;

    setActionLoading(election.uuid);
    try {
      await HANDLERS[type](election.uuid);
      toast.success(SUCCESS_MESSAGES[type]);
      loadElections(currentPage);
    } catch (err) {
      toast.error(err.response?.data?.message ?? `Erreur lors de l'action`);
    } finally {
      setActionLoading(null);
    }
  };

  // ── Recherche ─────────────────────────────────────────────────
  // Recherche live débouncée (comme Candidats.jsx/Electeurs.jsx/AuditLogs.jsx) :
  // l'appel API part 400ms après la dernière frappe, pas de bouton "Rechercher".

  const handleReset = () => {
    setSearchInput('');
    setStatusFilter('all');
    setCurrentPage(1);
  };

  // ── Rendu ─────────────────────────────────────────────────────

  return (
    <div className=" bg-[var(--color-background-white)] flex-1 p-2">

      {/* Header */}
      <div className="bg-[var(--color-white)] px-4 md:px-8 py-5 mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-semibold text-gray-900">
              Gestion des Scrutins
            </h1>
            <p className="text-sm text-[var(--color-gray)] mt-0.5">
              {totalCount} scrutin(s) — <strong>{org?.name}</strong>
            </p>
            <p className="text-sm text-[var(--color-gray)] mt-1">
              Gérez tous vos votes et consultations
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
            <NavLink to={`/org/${org?.uuid}/CreateScrutin`} className="flex items-center justify-center gap-2 btn-primary  font-medium transition-colors whitespace-nowrap">
              <Plus className="w-5 h-5" />
              <span className="hidden sm:inline">Créer un nouveau scrutin</span>
              <span className="sm:hidden">Nouveau</span>
            </NavLink>
          </div>
        </div>
      </div>
      {/* Filtres */}
      <div className="flex flex-col gap-4 mb-3">
        {/* Filtres statut */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <Filter size={14} className="text-[var(--color-dark)] shrink-0" />
          {STATUS_FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => { setStatusFilter(f.value); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-full  font-medium whitespace-nowrap transition-all
                                ${statusFilter === f.value
                  ? 'bg-[var(--color-primary)] text-white'
                  : 'bg-gray-100 text-gray-900 hover:bg-gray-200'}`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Recherche */}
        <div className="flex gap-2">
          <div className="relative flex-1 max-w-sm">
            <TextInput
              type="text"
              value={searchInput}
              onChange={e => { setSearchInput(e.target.value); setCurrentPage(1); }}
              iconLeft={Search}
              placeholder="Rechercher un scrutin..."
              className="w-full "
            />
          </div>
          {(search || statusFilter !== 'all') && (
            <button
              type="button"
              onClick={handleReset}
              className="btn-secondary px-3"
              title="Réinitialiser les filtres"
            >
              <RefreshCw size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Tableau */}
      <div className="bg-white rounded-[var(--radius-md)] shadow-sm overflow-hidden">
        {(() => {

          if (loading) {
            return (
              <div className="flex items-center justify-center py-20">
                <FadeLoader size={32} color="#1e40af" className=" text-[var(--color-primary)] mx-auto" />
              </div>
            );
          }
          if (elections.length === 0) {
            return (
              <div className="text-center py-20">
                <Vote size={40} className="text-gray-300 mx-auto mb-3" />
                <p className="text-[var(--color-gray)] font-medium">Aucun scrutin trouvé</p>
                <p className="text-sm text-gray-700 mt-1">
                  {search || statusFilter !== 'all'
                    ? 'Modifiez vos filtres pour voir plus de résultats'
                    : 'Créez votre premier scrutin pour commencer'}
                </p>
                {!search && statusFilter === 'all' && (
                  <NavLink
                    to={`/org/${org?.uuid}/CreateScrutin`}
                    className="btn-primary inline-flex items-center gap-2 mt-5"
                  >
                    <Plus size={16} /> Créer un scrutin
                  </NavLink>
                )}
              </div>
            );
          }
          return (
            <div className="bg-[var(--color-white)] rounded-[var(--radius-md)] shadow-[var(--shadow-md)] border border-gray-100 overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-[var(--color-gray-light)]  border-b border-[var(--color-gray-light)] capitalize">
                    <th className="text-left px-5 py-3.5 font-medium text-[var(--color-dark)]">Scrutin</th>
                    <th className="text-left px-5 py-3.5 font-medium text-[var(--color-dark)] hidden md:table-cell">Statut</th>
                    <th className="text-left px-5 py-3.5 font-medium text-[var(--color-dark)] hidden lg:table-cell">Début</th>
                    <th className="text-left px-5 py-3.5 font-medium text-[var(--color-dark)] hidden lg:table-cell">Fin</th>
                    <th className="text-center px-5 py-3.5 font-medium text-[var(--color-dark)] hidden md:table-cell">Candidats</th>
                    <th className="text-center px-5 py-3.5 font-medium text-[var(--color-dark)] hidden md:table-cell">Votes</th>
                    <th className="w-12 px-5 py-3.5" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-gray-light)]">
                  {elections.map(election => (
                    <tr
                      key={election.uuid}
                      className={`hover:bg-gray-50 transition-colors ${actionLoading === election.uuid ? 'opacity-50 pointer-events-none' : ''}`}
                    >
                      {/* Titre */}
                      <td className="px-5 py-4">
                        <div className="flex items-start gap-3">
                          {/* Banner miniature */}
                          {election.banner ? (
                            <img
                              src={election.banner}
                              alt={election.title}
                              className="w-10 h-10 rounded-lg object-cover shrink-0"
                              onError={e => { e.target.style.display = 'none'; }}
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                              <Vote size={16} className="text-[var(--color-primary)]" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-medium text-[var(--color-dark)] truncate max-w-[200px] lg:max-w-[280px]">
                              {election.title}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                              <span className="text-sm text-gray-700 capitalize">
                                {election.election_mode}
                              </span>
                              <span className="text-gray-300">·</span>
                              <span className="text-sm text-gray-700 capitalize">
                                {election.vote_type}
                              </span>
                              {/* Statut visible sur mobile */}
                              <span className="md:hidden">
                                <StatusBadge status={election.status} />
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Statut */}
                      <td className="px-5 py-4 hidden md:table-cell">
                        <StatusBadge status={election.status} />
                      </td>

                      {/* Dates */}
                      <td className="px-5 py-4 text-gray-700 text-sm hidden lg:table-cell whitespace-nowrap">
                        {formatDateTime(election.start_at)}
                      </td>
                      <td className="px-5 py-4 text-gray-700 text-sm hidden lg:table-cell whitespace-nowrap">
                        {formatDateTime(election.end_at)}
                      </td>

                      {/* Candidats */}
                      <td className="px-5 py-4 text-center hidden md:table-cell">
                        <span className="inline-flex items-center gap-1 text-gray-700 text-sm">
                          <Users size={13} />
                          {election.candidates_count ?? 0}
                        </span>
                      </td>

                      {/* Votes */}
                      <td className="px-5 py-4 text-center hidden md:table-cell">
                        <span className="inline-flex items-center gap-1 text-gray-700 text-sm">
                          <Vote size={13} />
                          {election.statistics?.total_votes ?? election.votes_count ?? 0}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4">
                        {actionLoading === election.uuid ? (
                          <Loader2 size={16} className="animate-spin text-gray-600" />
                        ) : (
                          <ActionMenu
                            election={election}
                            orgUuid={org?.uuid}
                            onAction={handleAction}
                          />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        })()}
      </div>

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-[var(--color-gray)]">
            Page {currentPage} sur {totalPages} — {totalCount} résultat(s)
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => loadElections(currentPage - 1)}
              disabled={currentPage === 1}
              className="flex items-center gap-1 px-3 py-2 border border-gray-200 rounded-[var(--radius-md)] text-sm disabled:opacity-50 hover:bg-gray-50 transition-colors"
            >
              <ChevronLeft size={16} /> Précédent
            </button>
            <button
              onClick={() => loadElections(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="flex items-center gap-1 px-3 py-2 border border-gray-200 rounded-[var(--radius-md)] text-sm disabled:opacity-50 hover:bg-gray-50 transition-colors"
            >
              Suivant <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
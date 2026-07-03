import { Search, Plus, Pencil, Ban, ChevronLeft, ChevronRight, Building2, CheckCircle, RefreshCw, AlertCircle } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import OrgModal from './OrgModal';
import UpdateStatusModal from './UpdateStatusModal';
import TextInput from '@components/ui/TextInput';
import { organizationsApi } from '@services/api';
import StatCard from "@/components/dashboard/StatCard";
import { FadeLoader } from 'react-spinners';
import { useConfirm } from '@hooks/useConfirm';

const statusStyle = (status) => {
  const map = {
    active: 'bg-green-100 text-green-600',
    pending: 'bg-yellow-100 text-yellow-600',
    suspended: 'bg-red-100 text-red-600',
    expired: 'bg-red-100 text-red-600',
  };
  return map[status] ?? 'bg-gray-100 text-gray-600';
};

const statusLabel = (status) => {
  const map = {
    active: 'Actif',
    pending: 'En attente',
    suspended: 'Suspendu',
    expired: 'Expiré',
  };
  return map[status] ?? status;
};

// ── Debounce hook ─────────────────────────────────────────────────
// Empêche un appel API à chaque frappe : attend 400ms d'inactivité.
function useDebounce(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

// ── Shape initiale de la réponse paginée ──────────────────────────
const EMPTY_PAGE = {
  data: [],
  meta: { current_page: 1, last_page: 1, per_page: 15, total: 0, from: 0, to: 0 },
};

export default function OrganisationsPage() {
  // const { confirm } = useConfirm();
  const [openModal, setOpenModal] = useState(false);
  const [openStatusModal, setOpenStatusModal] = useState(false);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);

  const [organisations, setOrganisations] = useState(EMPTY_PAGE);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [stats, setStats] = useState({
    total: '—',
    active: '—',
    inactive: '—',
    suspended: '—',
    new_this_month: '—',
    with_active_election: '—',
  });

  useEffect(() => {
    organizationsApi.getStats()
      .then(res => {
        const data = res.data?.data ?? {};
        setStats({
          total: data.total ?? '—',
          active: data.active ?? '—',
          inactive: data.inactive ?? '—',
          suspended: data.suspended ?? '—',
          new_this_month: data.new_this_month ?? '—',
          with_active_election: data.with_active_election ?? '—',
        });
        console.log(res.data);
      })
      .catch(() => {
        // Silencieux — les stats sont un bonus, pas bloquant
      });
  }, []);

  // FIX 2 : debounce sur la recherche — attend 400ms après la dernière frappe
  const debouncedSearch = useDebounce(search, 400);

  // FIX 1 : params passés directement à getAll() sans enveloppe { params: {...} }
  const fetchOrganisations = useCallback(async () => {
    setLoading(true);
    try {
      const response = await organizationsApi.getAll({
        page,
        search: debouncedSearch || undefined,
        status: statusFilter || undefined,
        per_page: 15,
      });

      // FIX 3 : extraction correcte depuis la shape Laravel
      // response.data = { success, data: [...], meta: {...} }
      const data = response.data?.data ?? [];
      const meta = response.data?.meta ?? EMPTY_PAGE.meta;

      setOrganisations({ data, meta });
    } catch (error) {
      console.error(error);
      toast.error('Impossible de charger les organisations');
      setOrganisations(EMPTY_PAGE);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, statusFilter]);

  // Re-fetch quand page, recherche debouncée ou filtre changent
  useEffect(() => {
    fetchOrganisations();
  }, [fetchOrganisations]);

  // Remettre à la page 1 quand la recherche ou le filtre changent
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter]);

  const handleReset = () => {
    setSearch('');
    setStatusFilter('');
    setPage(1);
  };

  // FIX 6 : org.uuid au lieu de org.id (id interne non exposé par l'API)
  const handleDelete = async (uuid) => {
    if (!window.confirm('voulez-vous vraiment supprimer')) return;
    try {
      await organizationsApi.delete(uuid);
      toast.success('Organisation supprimée');
      fetchOrganisations(); // re-fetch la liste
    } catch {
      toast.error('Impossible de supprimer cette organisation');
    }
  };

  const openUpdateStatus = (org) => {
    setSelected(org);
    setOpenStatusModal(true);
  };

  const { data: orgs, meta } = organisations;

  // ── Rendu ──────────────────────────────────────────────────────
  return (
    <div className="p-2 space-y-6">

      {/* HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <h1 className="text-xl lg:text-2xl font-bold text-[var(--text-primary)]">
          Gestion des Organisations
        </h1>
        <button
          onClick={() => { setSelected(null); setOpenModal(true); }}
          className="btn-primary flex items-center gap-2 text-white px-4 py-2 transition"
        >
          <Plus size={16} /> Nouvelle Organisation
        </button>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        <StatCard
          title="Total Organisations"
          value={stats.total}
          icon={Building2}
          trend={stats.new_this_month !== '—' ? `+${stats.new_this_month} ce mois` : undefined}
          className="text-[var(--color-primary)]"
          borderColor="[var(--color-primary)]"
          delay={100}
        />

        <StatCard
          title="Organisations actives"
          value={stats.active}
          icon={CheckCircle}
          trend={
            stats.with_active_election !== '—'
              ? `${stats.with_active_election} avec élection en cours`
              : undefined
          }
          className="text-green-500"
          borderColor="[var(--color-success)]"
          color="bg-green-50"
          delay={200}
        />

        <StatCard
          title="Inactives / Suspendues"
          value={
            stats.inactive !== '—' && stats.suspended !== '—'
              ? `${stats.inactive} / ${stats.suspended}`
              : '—'
          }
          icon={AlertCircle}
          trend={undefined}
          className="text-red-500"
          borderColor="[var(--color-danger)]"
          color="bg-red-50"
          delay={300}
        />

      </div>

      {/* FILTRES */}
      <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
        <div className="relative w-full lg:w-2/3">
          <TextInput
            type="text"
            placeholder="Rechercher une organisation..."
            iconLeft={Search}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full lg:w-auto border border-[var(--color-gray-light)] bg-[var(--color-white)] rounded-[var(--radius-md)] px-5 py-3.5 text-sm focus:outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] transition-all"
        >
          <option value="">Tous les statuts</option>
          <option value="active">Actif</option>
          <option value="pending">En attente</option>
          <option value="expired">Expiré</option>
          <option value="suspended">Suspendu</option>
        </select>

        <button
          onClick={handleReset}
          className="flex items-center gap-2 btn-secondary font-medium transition-colors whitespace-nowrap"
        >
          <RefreshCw size={16} /> Réinitialiser
        </button>
      </div>

      {/* TABLE */}
      <div className="bg-[var(--color-background-white)] rounded-[var(--radius-sm)] shadow-[var(--shadow-md)] overflow-x-auto">
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
          if (orgs.length === 0) {
            return (
              <div className="flex flex-col items-center justify-center p-12 text-center">
                <Building2 size={48} className="text-gray-300 mb-4" />
                <h3 className="text-lg font-semibold text-gray-600">Aucune organisation trouvée</h3>
                <p className="text-sm text-gray-500">Commencez par ajouter une nouvelle organisation</p>
              </div>
            );
          }
          return (
            <table className="w-full text-sm">
              <thead className="bg-[var(--color-gray-light)] text-[var(--color-dark)] text-md capitalize">
                <tr>
                  <th className="p-2 text-left">Organisation</th>
                  <th className="p-2 text-left">Responsable</th>
                  <th className="p-2 text-left">Statut</th>
                  <th className="p-2 text-left">Inscription</th>
                  <th className="p-2 text-left">Échéance forfait</th>
                  <th className="p-2 text-left">Élections</th>
                  <th className="p-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orgs.map((org) => (
                  <tr
                    key={org.uuid}
                    className="hover:bg-[var(--color-gray-light)] border-t border-t-[var(--color-gray-light)]"
                  >
                    <td className="p-2 flex items-center gap-3">
                      <img
                        src={org.logo}
                        alt={org.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div>
                        <p className="font-medium">{org.name}</p>
                        <p className="text-xs text-[var(--color-gray)]">{org.email}</p>
                      </div>
                    </td>

                    <td className="p-2">
                      <p className="font-medium">
                        {org.owner?.first_name} {org.owner?.last_name}
                      </p>
                      <p className="text-xs text-[var(--color-gray)]">{org.owner?.email}</p>
                    </td>

                    <td className="p-2">
                      <span className={`px-2 py-1 rounded-full text-xs whitespace-nowrap ${statusStyle(org.status)}`}>
                        {statusLabel(org.status)}
                      </span>
                    </td>

                    {/* FIX : subscription?.plan peut être null → fallback */}
                    <td className="p-2">
                      {org.created_at
                        ? new Date(org.created_at).toLocaleDateString('fr-FR')
                        : '—'}
                    </td>
                    <td className="p-2">
                      {org.subscription?.current?.end_at
                        ? new Date(org.subscription.current.end_at).toLocaleDateString('fr-FR')
                        : 'Aucun abonnement'}
                    </td>
                    <td className="p-2">{org.statistics?.elections_count ?? 0}</td>

                    <td className="p-2 flex items-center gap-3">
                      <button
                        onClick={() => openUpdateStatus(org)}
                        className="text-[var(--color-gray)] hover:text-[var(--color-primary)]"
                        title="Modifier le statut"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(org.uuid)}
                        className="text-[var(--color-gray)] hover:text-[var(--color-danger)]"
                        title="Supprimer"
                      >
                        <Ban size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        })()}
        {/* PAGINATION */}
        {!loading && meta.total > 0 && (
          <div className="flex flex-col lg:flex-row justify-between items-center p-4 text-sm gap-3">
            {/* FIX 4+5 : utilise meta.from, meta.to, meta.total */}
            <span className="text-[var(--color-gray)]">
              {meta.from}–{meta.to} sur {meta.total} organisations
            </span>

            <div className="flex gap-2 items-center">
              <button
                disabled={meta.current_page === 1}
                onClick={() => setPage(p => p - 1)}
                className="px-3 py-1 border rounded disabled:opacity-40"
              >
                <ChevronLeft size={16} />
              </button>

              <span className="px-3 py-1 bg-[var(--color-primary)] text-white rounded">
                {meta.current_page} / {meta.last_page}
              </span>

              <button
                disabled={meta.current_page === meta.last_page}
                onClick={() => setPage(p => p + 1)}
                className="px-3 py-1 border rounded disabled:opacity-40"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL création/édition */}
      {openModal && (
        <OrgModal
          data={selected}
          onClose={() => setOpenModal(false)}
          onSuccess={(message) => {
            setOpenModal(false);
            toast.success(message);
            fetchOrganisations();
          }}
          onError={(message) => toast.error(message)}
        />
      )}

      {/* MODAL statut */}
      {openStatusModal && (
        <UpdateStatusModal
          org={selected}
          onClose={() => setOpenStatusModal(false)}
          onSuccess={(message) => {
            setOpenStatusModal(false);
            toast.success(message);
            fetchOrganisations();
          }}
          onError={(message) => toast.error(message)}
        />
      )}
    </div>
  );
}
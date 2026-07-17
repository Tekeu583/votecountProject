import {
  Plus, CheckCircle,
  AlertTriangle, EllipsisVertical,
  Package, BarChart3,
  Activity, ChevronLeft,
  ChevronRight, Search,
  RefreshCw,
} from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';

import PlanModal from './PlanModal';
import StatCard from '@components/dashboard/StatCard';
import TextInput from '@components/ui/TextInput';
import { plansApi, paymentsApi } from '@services/api';

// Empêche un appel API à chaque frappe : attend 400ms d'inactivité.
function useDebounce(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

const EMPTY_PAGE = {
  data: [],
  meta: { current_page: 1, last_page: 1, per_page: 15, total: 0, from: 0, to: 0 },
};

const STATUS_STYLE = {
  active: 'bg-green-100 text-green-600',
  expired: 'bg-red-100 text-red-600',
  cancelled: 'bg-gray-100 text-gray-600',
  pending: 'bg-yellow-100 text-yellow-600',
};

const STATUS_LABEL = {
  active: 'Actif',
  expired: 'Expiré',
  cancelled: 'Annulé',
  pending: 'En attente',
};

const PLAN_ICONS = [Package, BarChart3, Activity];

export default function SubscriptionsPage() {
  const [selected, setSelected] = useState(null);
  const [openPlanModal, setOpenPlanModal] = useState(false);

  const [plans, setPlans] = useState([]);
  const [statsData, setStatsData] = useState({ total: 0, active: 0, expired: 0, cancelled: 0, expiring_soon: 0 });
  const [revenue, setRevenue] = useState({ total_revenue: 0 });

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [subscriptions, setSubscriptions] = useState(EMPTY_PAGE);

  const fetchPlans = useCallback(() => {
    plansApi.getAll({ per_page: 50 })
      .then(res => setPlans(res.data?.data ?? []))
      .catch(() => setPlans([]));
  }, []);

  const fetchStats = useCallback(() => {
    Promise.all([
      paymentsApi.getSubscriptionsStats(),
      paymentsApi.getTransactionStats(),
    ]).then(([statsRes, revenueRes]) => {
      setStatsData(statsRes.data?.data ?? statsData);
      setRevenue(revenueRes.data?.data ?? revenue);
    }).catch(() => {
      // non bloquant
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchSubscriptions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await paymentsApi.getAllSubscriptions({
        page,
        per_page: 10,
        ...(statusFilter ? { status: statusFilter } : {}),
        ...(debouncedSearch ? { search: debouncedSearch } : {}),
      });
      setSubscriptions({
        data: res.data?.data ?? [],
        meta: res.data?.meta ?? EMPTY_PAGE.meta,
      });
    } catch (error) {
      toast.error(error.response?.data?.message ?? "Impossible de charger les abonnements");
      setSubscriptions(EMPTY_PAGE);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, debouncedSearch]);

  useEffect(() => { fetchPlans(); fetchStats(); }, [fetchPlans, fetchStats]);
  useEffect(() => { fetchSubscriptions(); }, [fetchSubscriptions]);
  useEffect(() => { setPage(1); }, [debouncedSearch, statusFilter]);

  const handleResetFilters = () => {
    setSearch("");
    setStatusFilter("");
    setPage(1);
  };

  const handleToggleAutoRenew = async (sub) => {
    try {
      await paymentsApi.toggleAutoRenew(sub.uuid, !sub.auto_renew);
      toast.success('Renouvellement automatique mis à jour');
      fetchSubscriptions();
    } catch (error) {
      toast.error(error.response?.data?.message ?? "Impossible de mettre à jour l'abonnement");
    }
  };

  const handleCancel = async (sub) => {
    if (!window.confirm(`Annuler l'abonnement de ${sub.organization?.name ?? 'cette organisation'} ?`)) return;
    try {
      await paymentsApi.cancelSubscription(sub.uuid);
      toast.success('Abonnement annulé');
      fetchSubscriptions();
    } catch (error) {
      toast.error(error.response?.data?.message ?? "Impossible d'annuler l'abonnement");
    }
  };

  const stats = [
    { label: 'Abonnements actifs', value: statsData.active.toLocaleString('fr-FR') },
    { label: 'Revenus Totaux', value: `${Number(revenue.total_revenue ?? 0).toLocaleString('fr-FR')} CFA` },
    { label: 'Expirent sous 7 jours', value: statsData.expiring_soon.toLocaleString('fr-FR') },
    { label: 'Annulés', value: statsData.cancelled.toLocaleString('fr-FR') },
  ];

  const { data: items, meta } = subscriptions;

  return (
    <div className="p-2 space-y-6 bg-[var(--color-background-white)]">
      {/* HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <h1 className="text-xl lg:text-2xl font-bold text-[var(--text-primary)]">
          Gestion des Abonnements
        </h1>

        <button
          onClick={() => {
            setSelected(null)
            setOpenPlanModal(true)
          }}
          className="btn-primary flex items-center justify-center gap-2 w-full lg:w-auto">
          <Plus size={16} />
          Nouveau Plan
        </button>
      </div>

      {/* PLANS */}
      <div>
        <h2 className="font-semibold mb-3">Plans d’abonnement</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {plans.length === 0 && (
            <p className="text-sm text-[var(--color-gray)] col-span-full">Aucun plan configuré.</p>
          )}
          {plans.map((plan, i) => {
            const Icon = PLAN_ICONS[i % PLAN_ICONS.length];

            return (
              <div
                key={plan.uuid}
                className={`
            p-5 rounded-[var(--radius-md)] shadow transition hover:shadow-lg
            ${plan.is_active ? 'bg-white' : 'bg-white opacity-60'}
          `}
              >
                {/* HEADER */}
                <div className="flex items-center gap-2 mb-2">
                  <Icon size={18} className="text-[var(--color-primary)]" />
                  <p className="text-sm text-gray-500">{plan.name}</p>
                  {!plan.is_active && (
                    <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Inactif</span>
                  )}
                </div>

                {/* PRICE */}
                <h2 className="text-xl lg:text-2xl font-bold mt-2">
                  {plan.formatted_price ?? `${Number(plan.price).toLocaleString('fr-FR')} ${plan.currency}`}
                </h2>

                {/* FEATURES */}
                <ul className="mt-4 space-y-2">
                  {(plan.features ?? []).map((f, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm">
                      <CheckCircle size={16} className="text-[var(--color-success)]" />
                      {f}
                    </li>
                  ))}
                </ul>

                {/* BUTTON */}
                <button
                  onClick={() => {
                    setSelected(plan);
                    setOpenPlanModal(true);
                  }}
                  className="mt-4 w-full py-2 rounded-[var(--radius-md)] cursor-pointer transition border border-[var(--color-primary)] text-[var(--color-primary)] hover:bg-[var(--color-primary-light)]"
                >
                  Gérer l’offre
                </button>
              </div>
            );
          })}
        </div>
      </div>
      {/* STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <StatCard key={i} title={s.label} value={s.value} delay={i * 100} />
        ))}
      </div>
      {/* BOTTOM */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* RÉPARTITION DES ABONNEMENTS */}
        <div className="bg-white p-4 rounded-[var(--radius-md)] shadow">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <BarChart3 size={18} />
            Répartition des abonnements
          </h3>

          <div className="space-y-3">
            {[
              { label: 'Actifs', value: statsData.active, color: 'bg-green-500' },
              { label: 'Expirés', value: statsData.expired, color: 'bg-red-400' },
              { label: 'Annulés', value: statsData.cancelled, color: 'bg-gray-400' },
            ].map(row => (
              <div key={row.label}>
                <div className="flex justify-between text-sm mb-1">
                  <span>{row.label}</span>
                  <span>{row.value}</span>
                </div>
                <div className="h-2 bg-gray-200 rounded">
                  <div
                    className={`h-2 rounded ${row.color}`}
                    style={{ width: `${statsData.total > 0 ? (row.value / statsData.total) * 100 : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ALERTS */}
        <div className="bg-white p-4 rounded-[var(--radius-md)] shadow">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <AlertTriangle size={18} />
            À surveiller
          </h3>

          <div className="space-y-3 text-sm">
            {statsData.expiring_soon > 0 ? (
              <div className="flex gap-2 items-center text-orange-500">
                <AlertTriangle size={16} />
                {statsData.expiring_soon} abonnement(s) expirent dans les 7 prochains jours
              </div>
            ) : (
              <p className="text-[var(--color-gray)]">Aucune alerte pour le moment.</p>
            )}
          </div>
        </div>

      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:flex-wrap lg:flex-nowrap">
        {/* SEARCH */}
        <div className="relative w-full md:flex-1">
          <TextInput
            className="pl-9 w-full"
            type="text"
            name="search"
            id="search"
            value={search}
            iconLeft={Search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher une organisation..."
          />
        </div>
        <div className="w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input w-full md:w-[180px]"
          >
            <option value="">Tous statuts</option>
            <option value="active">Actif</option>
            <option value="expired">Expiré</option>
            <option value="cancelled">Annulé</option>
          </select>
        </div>
        <div className="w-full md:w-auto">
          <button
            onClick={handleResetFilters}
            className="flex items-center justify-center gap-2 w-full md:w-auto btn-secondary whitespace-nowrap group"
          >
            <RefreshCw
              size={16}
              className="transition-transform duration-300 group-hover:rotate-180"
            />
            Réinitialiser
          </button>
        </div>
      </div>
      {/* TABLE */}
      <div className="bg-white rounded-[var(--radius-md)] shadow overflow-x-auto">
        <table className="min-w-[700px] w-full text-sm">
          <thead className="bg-[var(--color-gray-light)] text-[var(--color-dark)] capitalize">
            <tr>
              <th className="p-3 text-left">Organisation</th>
              <th className="p-3 text-left">Forfait</th>
              <th className="p-3 text-left">Statut</th>
              <th className="p-3 text-left">Expire le</th>
              <th className="p-3 text-left">Renouvellement auto</th>
              <th className="p-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td className="p-6 text-center text-[var(--color-gray)]" colSpan={6}>Chargement...</td>
              </tr>
            )}
            {!loading && items.map((sub) => (
              <tr key={sub.uuid} className="border-t border-t-[var(--color-gray-light)] hover:bg-[var(--color-gray-light)]">
                <td className="p-3">{sub.organization?.name ?? '—'}</td>
                <td className="p-3">{sub.plan?.name ?? '—'}</td>
                <td className="p-3">
                  <span className={`px-2 py-1 rounded-lg text-xs ${STATUS_STYLE[sub.status] ?? 'bg-gray-100 text-gray-600'}`}>
                    {STATUS_LABEL[sub.status] ?? sub.status}
                  </span>
                </td>
                <td className="p-3">{sub.end_at ? new Date(sub.end_at).toLocaleDateString('fr-FR') : '—'}</td>
                <td className="p-3">{sub.auto_renew ? 'Oui' : 'Non'}</td>
                <td className="p-3">
                  <div className="relative group inline-block">
                    <button className="p-1"><EllipsisVertical size={16} className="cursor-pointer" /></button>
                    <div className="hidden group-focus-within:block group-hover:block absolute right-0 z-10 bg-white border border-[var(--color-gray-light)] rounded-[var(--radius-md)] shadow-md w-56 py-1">
                      <button
                        onClick={() => handleToggleAutoRenew(sub)}
                        disabled={sub.status !== 'active'}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {sub.auto_renew ? 'Désactiver' : 'Activer'} le renouvellement auto
                      </button>
                      <button
                        onClick={() => handleCancel(sub)}
                        disabled={sub.status !== 'active'}
                        className="w-full text-left px-3 py-2 text-sm text-[var(--color-danger)] hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Annuler l'abonnement
                      </button>
                    </div>
                  </div>
                </td>
              </tr>
            ))}
            {!loading && items.length === 0 && (
              <tr>
                <td className="p-6 text-center text-[var(--color-gray)]" colSpan={6}>Aucun abonnement trouvé</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {/* PAGINATION */}
      {!loading && meta.total > 0 && (
        <div className="flex flex-col lg:flex-row justify-between items-center p-4 text-sm gap-3">
          <span className="text-[var(--color-gray)]">
            Affichage de {meta.from} à {meta.to} sur {meta.total}
          </span>

          <div className="flex gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-3 py-1 border rounded disabled:opacity-50"><ChevronLeft size={16} /></button>
            <span className="px-3 py-1 bg-[var(--color-primary)] text-white rounded">
              {meta.current_page} / {meta.last_page}
            </span>
            <button
              disabled={page === meta.last_page}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1 border rounded disabled:opacity-50"><ChevronRight size={16} /></button>
          </div>
        </div>
      )}
      {openPlanModal && (
        <PlanModal
          data={selected}
          onClose={() => setOpenPlanModal(false)}
          onSuccess={(message) => {
            setOpenPlanModal(false);
            toast.success(message);
            fetchPlans();
          }}
          onError={(message) => {
            toast.error(message);
          }}
        />
      )}

    </div>
  );
}

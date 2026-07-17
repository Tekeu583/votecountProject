import { useEffect, useState } from 'react';
import { Eye } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import toast from 'react-hot-toast';

import StatCard from "@/components/dashboard/StatCard";
import { analyticsApi, organizationsApi, auditApi } from '@services/api';

const STATUS_LABELS = {
  draft: 'Brouillon',
  published: 'Publiée',
  ongoing: 'En cours',
  closed: 'Terminée',
  cancelled: 'Annulée',
};

const formatDate = (isoString) => {
  const date = new Date(isoString);
  return Number.isNaN(date.getTime())
    ? '—'
    : date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
};

export default function DashboardSuperHome() {

  const primaryColor = getComputedStyle(document.documentElement)
    .getPropertyValue('--color-primary');

  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState({ activeOrganizations: 0, totalVotes: 0, totalRevenue: 0, newOrganizations: 0 });
  const [votesOverTime, setVotesOverTime] = useState([]);
  const [electionsByStatus, setElectionsByStatus] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const [dashboardRes, orgStatsRes, auditRes] = await Promise.all([
          analyticsApi.dashboard(),
          organizationsApi.getStats(),
          auditApi.getAll({ per_page: 5 }),
        ]);
        if (cancelled) return;

        const dashboard = dashboardRes.data?.data ?? {};
        const orgStats = orgStatsRes.data?.data ?? {};

        setKpis({
          activeOrganizations: orgStats.active ?? 0,
          totalVotes: dashboard.total_votes ?? 0,
          totalRevenue: dashboard.total_revenue ?? 0,
          newOrganizations: orgStats.new_this_month ?? 0,
        });

        setVotesOverTime((dashboard.votes_over_time ?? []).slice(-7));

        const byStatus = dashboard.elections_by_status ?? {};
        setElectionsByStatus(
          Object.entries(byStatus).map(([status, count]) => ({
            status,
            label: STATUS_LABELS[status] ?? status,
            count: Number(count),
          }))
        );

        setRecentActivity(auditRes.data?.data ?? []);
      } catch {
        toast.error("Impossible de charger les statistiques du tableau de bord.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, []);

  const stats = [
    { id: 1, title: 'Organisations Actives', value: kpis.activeOrganizations.toLocaleString('fr-FR') },
    { id: 2, title: 'Volume Total de Votes', value: kpis.totalVotes.toLocaleString('fr-FR') },
    { id: 3, title: 'Revenus Totaux', value: `${Number(kpis.totalRevenue).toLocaleString('fr-FR')} CFA` },
    { id: 4, title: 'Nouvelles Organisations (ce mois)', value: kpis.newOrganizations.toLocaleString('fr-FR') },
  ];

  const maxStatusCount = Math.max(1, ...electionsByStatus.map(s => s.count));

  return (
    <div className="p-2 space-y-6 bg-[var(--color-background-white)] w-full max-w-full overflow-x-hidden min-w-0">

      {/* HEADER */}
      <div className='w-full'>
        <h1 className="text-2xl font-bold text-[var(--color-dark)]">
          Vue d'ensemble du système
        </h1>
        <p className="text-sm text-[var(--color-gray)]">
          Statistiques globales de la plateforme
        </p>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 w-full">
        {stats.map((item) => (
            <StatCard key={item.id} Icon='' title={item.title} value={loading ? '…' : item.value} delay={item.id * 100} />
        ))}
      </div>

      {/* CHART + RIGHT PANEL */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* BAR CHART */}
        <div className="bg-white p-4 rounded-[var(--radius-md)] shadow lg:col-span-2 w-full overflow-hidden">
          <h3 className="font-semibold mb-4">
            Votes des 7 derniers jours avec activité
          </h3>
          {votesOverTime.length > 0 ? (
            <div className="w-full min-h-[300px]">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={votesOverTime.map(v => ({ name: formatDate(v.date), votes: Number(v.total) }))}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar
                    dataKey="votes"
                    fill={primaryColor}
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="text-center py-10 text-gray-500">
              {loading ? 'Chargement...' : 'Aucun vote enregistré récemment'}
            </div>
          )}
        </div>

        {/* ÉLECTIONS PAR STATUT */}
        <div className="bg-white p-4 rounded-[var(--radius-md)] shadow">
          <h3 className="font-semibold mb-4">
            Élections par statut
          </h3>
          {electionsByStatus.length > 0 ? electionsByStatus.map((item) => (
            <div key={item.status} className="mb-3">
              <div className="flex justify-between text-sm mb-1">
                <span>{item.label}</span>
                <span>{item.count}</span>
              </div>
              <div className="h-2 bg-gray-200 rounded">
                <div
                  className="h-2 bg-[var(--color-primary)] rounded"
                  style={{ width: `${(item.count / maxStatusCount) * 100}%` }}
                />
              </div>
            </div>
          )) : (
            <p className="text-sm text-gray-500">{loading ? 'Chargement...' : 'Aucune élection'}</p>
          )}
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white p-4 rounded-[var(--radius-md)] shadow-[var(--shadow-md)] w-full overflow-x-auto">
        <h3 className="font-semibold mb-4">Activités Récentes</h3>

        <table className="w-full text-sm  rounded-[var(--radius-md)] overflow-hidden min-w-[600px]">
          <thead>
            <tr className="p-3 text-left text-[var(--color-dark)] bg-[var(--color-gray-light)]">
              <th className='p-3'>Entité</th>
              <th className='p-3'>Action</th>
              <th className='p-3'>Utilisateur</th>
              <th className='p-3'>Date</th>
              <th className='p-3'>Détails</th>
            </tr>
          </thead>

          <tbody>
            {recentActivity.length > 0 ? recentActivity.map((log) => (
              <tr key={log.uuid} className="border-t border-t-[var(--color-gray-light)]">
                <td className='p-3'>{log.entity_label}</td>
                <td className='p-3'>{log.action_label}</td>
                <td className='p-3'>{log.user?.name ?? '—'}</td>
                <td className='p-3'>{formatDate(log.created_at)}</td>
                <td className="p-3 text-[var(--color-primary)]">
                  <NavLink to={'audit-logs'}>
                    <Eye />
                  </NavLink>
                </td>
              </tr>
            )) : (
              <tr>
                <td className="p-3 text-gray-500" colSpan={5}>
                  {loading ? 'Chargement...' : 'Aucune activité récente'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}

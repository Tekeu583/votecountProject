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

import StatCard from "@/components/dashboard/StatCard";

const stats = [
  { id: 1, title: 'Organisations Actives', value: '1 284', change: '+5.2%' },
  { id: 2, title: 'Volume Total de Votes', value: '856 432', change: '+12%' },
  { id: 3, title: 'Revenus Mensuels', value: '5 234 000 CFA', change: '+8.1%' },
  { id: 4, title: 'Alertes Récentes', value: '12', change: '-3.5%' },
];

const chartData = [
  { name: 'Lun', votes: 400 },
  { name: 'Mar', votes: 300 },
  { name: 'Mer', votes: 500 },
  { name: 'Jeu', votes: 700 },
  { name: 'Ven', votes: 600 },
  { name: 'Sam', votes: 300 },
  { name: 'Dim', votes: 200 },
];



export default function DashboardSuperHome() {

  const primaryColor = getComputedStyle(document.documentElement)
    .getPropertyValue('--color-primary');

  return (
    <div className="p-2 space-y-6 bg-[var(--color-background-white)] w-full max-w-full overflow-x-hidden min-w-0">

      {/* HEADER */}
      <div className='w-full'>
        <h1 className="text-2xl font-bold text-[var(--color-dark)]">
          Vue d'ensemble du système
        </h1>
        <p className="text-sm text-[var(--color-gray)]">
          Voici ce qui s'est passé ces dernières 24 heures
        </p>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 w-full">
        {stats.map((item) => (
            <StatCard key={item.id} Icon='' title={item.title} value={item.value} trend={item.change} delay={item.id * 100} />
        ))}
      </div>

      {/* CHART + RIGHT PANEL */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* BAR CHART */}
        <div className="bg-white p-4 rounded-[var(--radius-md)] shadow lg:col-span-2 w-full overflow-hidden">
          <h3 className="font-semibold mb-4">
            Évolution du Volume de Votes
          </h3>
          {chartData && chartData.length > 0 ? (
            <div className="w-full min-h-[300px]">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData || []}>
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
              Aucun graphique disponible
            </div>
          )}
        </div>

        {/* ORGANISATIONS */}
        <div className="bg-white p-4 rounded-[var(--radius-md)] shadow">
          <h3 className="font-semibold mb-4">
            Nouvelles Organisations
          </h3>
          {[
            { id: 1, label: 'T1 2026', value: 42 },
            { id: 2, label: 'T4 2026', value: 38 },
            { id: 3, label: 'T3 2026', value: 31 },
            { id: 4, label: 'T2 2026', value: 24 },
          ].map((item) => (
            <div key={item.id} className="mb-3">
              <div className="flex justify-between text-sm mb-1">
                <span>{item.label}</span>
                <span>{item.value}</span>
              </div>
              <div className="h-2 bg-gray-200 rounded">
                <div
                  className="h-2 bg-[var(--color-primary)] rounded"
                  style={{ width: `${item.value}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white p-4 rounded-[var(--radius-md)] shadow-[var(--shadow-md)] w-full overflow-x-auto">
        <h3 className="font-semibold mb-4">Activités Récentes</h3>

        <table className="w-full text-sm  rounded-[var(--radius-md)] overflow-hidden min-w-[600px]">
          <thead>
            <tr className="p-3 text-left text-[var(--color-dark)] bg-[var(--color-gray-light)]">
              <th className='p-3'>Organisation</th>
              <th className='p-3'>Action</th>
              <th className='p-3'>Date</th>
              <th className='p-3'>Statut</th>
              <th className='p-3'>Détails</th>
            </tr>
          </thead>

          <tbody>
            <tr className="border-t border-t-[var(--color-gray-light)]">
              <td className='p-3'>Mairie</td>
              <td className='p-3'>Création</td>
              <td className='p-3'>Il y a 10 min</td>
              <td className="p-3 text-green-600 font-semibold">Réussie</td>
              <td className="p-3 text-[var(--color-primary)]">
                <NavLink to={'organisations'}>
                  <Eye />
                </NavLink>
              </td>
            </tr>
            <tr className="border-t border-t-[var(--color-gray-light)]">
              <td className='p-3 truncate max-w-[120px] sm:max-w-none'>Université de Douala</td>
              <td className='p-3'>Vote lancé</td>
              <td className='p-3'>Il y a 1h</td>
              <td className=" p-3 text-[var(--color-success)] font-semibold">Actif</td>
              <td className=' p-3 text-[var(--color-primary)]' >
                <NavLink to={'organisations'}>
                  <Eye />
                </NavLink>
              </td>
            </tr>
            <tr className="border-t border-t-[var(--color-gray-light)]">
              <td className='p-3 truncate max-w-[120px] sm:max-w-none'>ENSPD</td>
              <td className='p-3'>Vote lancé</td>
              <td className='p-3'>Il y a 2h</td>
              <td className="p-3 text-[var(--color-success)] font-semibold">Actif</td>
              <td className='p-3 text-[var(--color-primary)]' >
                <NavLink to={'organisations'}>
                  <Eye />
                </NavLink>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

    </div>
  );
}
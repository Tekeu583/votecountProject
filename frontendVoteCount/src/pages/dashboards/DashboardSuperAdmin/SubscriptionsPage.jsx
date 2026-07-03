import {
  Plus,CheckCircle,
  AlertTriangle,EllipsisVertical,
  Package,BarChart3,
  Activity,ChevronLeft,
  ChevronRight,Search,
  RefreshCw,
} from 'lucide-react';
import { useState, useMemo } from 'react';
import toast from 'react-hot-toast';

import {
  BarChart,Bar,
  XAxis,ResponsiveContainer,
} from 'recharts';

import UpdateStatusModal from './UpdateStatusModal';
import PlanModal from './PlanModal';
import StatCard from '@components/dashboard/StatCard';
import TextInput from '@components/ui/TextInput';

const plans = [
  {
    name: 'Starter',
    price: '29 900',
    icon: Package,
    features: ['Jusqu’à 5 utilisateurs', 'Support par email', 'Rapports basiques'],
  },
  {
    name: 'Business',
    price: '129 900',
    featured: true,
    icon: BarChart3,
    features: ['Utilisateurs illimités', 'Support prioritaire 24/7', 'Analyse avancée'],
  },
  {
    name: 'Enterprise',
    price: '299 900',
    icon: Activity,
    features: ['Tout Business', 'Account Manager', 'Sécurité avancée'],
  },
];

const stats = [
  { label: 'Abonnements', value: '1,284', change: '+5.2%' },
  { label: 'Revenus Mensuels', value: '29 650 000 FCFA', change: '+3.1%' },
  { label: 'Taux renouvellement', value: '94.2%', change: '-0.5%' },
  { label: 'Alertes', value: '12', change: 'Attention' },
];

const chartData = [
  { name: 'Avr', value: 40 },
  { name: 'Mai', value: 30 },
  { name: 'Jun', value: 50 },
  { name: 'Jul', value: 60 },
  { name: 'Aoû', value: 70 },
  { name: 'Sep', value: 90 },
];

export default function SubscriptionsPage() {
  const [selected, setSelected] = useState(null);
  const [openStatusModal, setOpenStatusModal] = useState(false);
  const [openPlanModal, setOpenPlanModal] = useState(false);
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 3;

  const organisations = useMemo(() => [
    {
      id: 1,
      name: "Mairie de Douala",
      forfait: "Business",
      logo: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=3&w=256&h=256&q=60",
      status: "Actif",
      date: "2026-10-12",
      montant: 40000,
    },
    {
      id: 2,
      name: "Bureau BDE Academique",
      forfait: "started",
      logo: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=3&w=256&h=256&q=60",
      status: "Actif",
      date: "2026-10-12",
      montant: 40000,
    },
    {
      id: 3,
      name: "Mairie de Douala",
      forfait: "Entreprise",
      logo: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=3&w=256&h=256&q=60",
      status: "Actif",
      date: "2026-10-12",
      montant: 40000,
    },
    {
      id: 4,
      name: "Mairie de Douala",
      forfait: "Business",
      logo: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=3&w=256&h=256&q=60",
      status: "Actif",
      date: "2026-10-12",
      montant: 40000,
    },
  ], []);

  const filteredOrganisations = useMemo(() => {
    return organisations.filter((n) => {

      const matchSearch =
        n.name.toLowerCase().includes(search.toLowerCase()) ||
        n.forfait.toLowerCase().includes(search.toLowerCase());

      const matchDate = dateFilter
        ? n.date.startsWith(dateFilter)
        : true;

      return matchSearch && matchDate;
    });
  }, [search, dateFilter, organisations]);

  const paginatedAbonnements = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredOrganisations.slice(start, start + itemsPerPage);
  }, [filteredOrganisations, currentPage]);

  const totalPages = Math.ceil(filteredOrganisations.length / itemsPerPage);
  const handleResetFilters = () => {
    setSearch("");
    setDateFilter("");
    setCurrentPage(1);
  };
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
          Nouvel Abonnement
        </button>
      </div>

      {/* PLANS */}
      <div>
        <h2 className="font-semibold mb-3">Plans d’abonnement</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {plans.map((plan, i) => {
            const Icon = plan.icon;

            return (
              <div
                key={i}
                className={`
            p-5 rounded-[var(--radius-md)] shadow transition hover:shadow-lg
            ${plan.featured
                    ? 'border border-[var(--color-primary)] shadow-[var(--shadow-md)]'
                    : 'bg-white'}
          `}
              >
                {/* HEADER */}
                <div className="flex items-center gap-2 mb-2">
                  <Icon size={18} className="text-[var(--color-primary)]" />
                  <p className="text-sm text-gray-500">{plan.name}</p>
                </div>

                {/* PRICE */}
                <h2 className="text-xl lg:text-2xl font-bold mt-2">
                  {plan.price} FCFA
                </h2>

                {/* FEATURES */}
                <ul className="mt-4 space-y-2">
                  {plan.features.map((f, idx) => (
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
                  className={`mt-4 w-full py-2 rounded-[var(--radius-md)] cursor-pointer transition
              ${plan.featured
                      ? 'bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)]'
                      : 'border border-[var(--color-primary)] text-[var(--color-primary)] hover:bg-[var(--color-primary-light)]'
                    }`}
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
          <StatCard key={i} title={s.label} value={s.value} trend={s.change} delay={i * 100} />
        ))}
      </div>
      {/* BOTTOM */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* CHART */}
        <div className="bg-white p-4 rounded-[var(--radius-md)] shadow">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <BarChart3 size={18} />
            Évolution des Revenus Mensuels
          </h3>

          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="name" />
                <Bar dataKey="value" fill="var(--color-primary)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ALERTS */}
        <div className="bg-white p-4 rounded-[var(--radius-md)] shadow">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <AlertTriangle size={18} />
            Alertes critiques
          </h3>

          <div className="space-y-3 text-sm">
            <div className="flex gap-2 items-center text-[var(--color-danger)]">
              <AlertTriangle size={16} />
              Horizon Data critique
            </div>

            <div className="flex gap-2 items-center text-orange-500">
              <AlertTriangle size={16} />
              CloudSphere bientôt expiré
            </div>
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
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Rechercher..."
          />
        </div>
        <div className="w-full md:w-auto">
          <TextInput
            name="date"
            type="date"
            id="date"
            value={dateFilter}
            onChange={(e) => {
              setDateFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full md:w-[180px]"
          />
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
              <th className="p-3 text-left">Date</th>
              <th className="p-3 text-left">Montant</th>
              <th className="p-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedAbonnements.map((abonnement) => (
              <tr key={abonnement.id} className="border-t border-t-[var(--color-gray-light)] hover:bg-[var(--color-gray-light)]">
                <td className="p-3">{abonnement.name}</td>
                <td className="p-3">{abonnement.forfait}</td>
                <td className="p-3">
                  <span className="bg-green-100 text-green-600 px-2 py-1 rounded-lg text-xs">
                    {abonnement.status}
                  </span>
                </td>
                <td className="p-3">{abonnement.date}</td>
                <td className="p-3 text-[var(--color-primary)] font-bold">
                  {abonnement.montant} FCFA
                </td>
                <td className="p-3">
                  <button
                    onClick={() => {
                      setSelected(abonnement.id)
                      setOpenStatusModal(true)
                    }}
                  ><EllipsisVertical size={16} className="cursor-pointer" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* PAGINATION */}
      <div className="flex flex-col lg:flex-row justify-between items-center p-4 text-sm gap-3">
        <span className="text-[var(--color-gray)]">
          Affichage de {(currentPage - 1) * itemsPerPage + 1} à{" "}
          {Math.min(currentPage * itemsPerPage, organisations.length)} sur{" "}
          {organisations.length}
        </span>

        <div className="flex gap-2">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => p - 1)}
            className="px-3 py-1 border rounded"><ChevronLeft size={16} /></button>
          <span className="px-3 py-1 bg-[var(--color-primary)] text-white rounded">
            {currentPage} / {totalPages}
          </span>
          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => p + 1)}
            className="px-3 py-1 border rounded"><ChevronRight size={16} /></button>
        </div>
      </div>
      {openStatusModal && (
        <UpdateStatusModal
          org={selected}
          onClose={() => setOpenStatusModal(false)}
          onSuccess={() => {
            setOpenStatusModal(false);
            toast.success('Statut mis à jour avec succès');
          }}
          onError={() => {
            toast.error('Une erreur est survenue');
          }}
        />
      )}
      {openPlanModal && (
        <PlanModal
          data={selected}
          onClose={() => setOpenPlanModal(false)}
          onSuccess={(message) => {
            setOpenPlanModal(false);
            toast.success(message);
          }}
          onError={(message) => {
            toast.error(message);
          }}
        />
      )}

    </div>
  );
}
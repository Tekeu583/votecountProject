import {
  Plus,
  Search,
  MoreVertical,
  User,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';

import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import AdminModal from './AdminModal';
import TextInput from '@components/ui/TextInput';
import StatCard from '@components/dashboard/StatCard';
import { usersApi } from '@services/api';
import { useDebounce } from '@hooks/useDebounce';

const ADMIN_ROLES = ['super_admin', 'admin'];

const roleBadge = (role) => {
  switch (role) {
    case 'super_admin':
      return 'bg-[var(--color-primary)] text-white';
    case 'admin':
      return 'bg-[var(--color-primary)]/40 text-gray-800';
    default:
      return 'bg-gray-200 text-gray-900';
  }
};

const statusDisplay = (status) => {
  if (status === 'active') return { text: 'Actif', color: 'text-green-600' };
  if (status === 'inactive') return { text: 'Inactif', color: 'text-gray-400' };
  if (status === 'suspended') return { text: 'Suspendu', color: 'text-red-500' };
  return { text: status ?? 'Inconnu', color: 'text-gray-400' };
};

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
};

export default function AdminsPage() {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search);
  const [roleFilter, setRoleFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 });
  const itemsPerPage = 10;

  const fetchAdmins = useCallback(async () => {
    setLoading(true);
    try {
      const res = await usersApi.getAll(page, itemsPerPage, {
        role: roleFilter === 'all' ? ADMIN_ROLES : roleFilter,
        ...(debouncedSearch ? { search: debouncedSearch } : {}),
      });
      const payload = res.data;
      const list = payload?.data?.data ?? payload?.data ?? [];
      const lastPage = payload?.data?.pagination?.last_page ?? payload?.meta?.last_page ?? 1;
      const total = payload?.data?.pagination?.total ?? payload?.meta?.total ?? list.length;
      setAdmins(list);
      setMeta({ current_page: page, last_page: lastPage, total });
    } catch (error) {
      toast.error(error.response?.data?.message ?? 'Impossible de charger les administrateurs');
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, roleFilter]);

  useEffect(() => { fetchAdmins(); }, [fetchAdmins]);
  useEffect(() => { setPage(1); }, [debouncedSearch, roleFilter]);

  const stats = [
    { label: 'Total Admins', value: meta.total },
    { label: 'Super Admins', value: admins.filter(a => a.roles?.includes('super_admin')).length },
    { label: 'Admins', value: admins.filter(a => a.roles?.includes('admin')).length },
    { label: 'Actifs (page)', value: admins.filter(a => a.status === 'active').length },
  ];

  return (
    <div className="flex-1 bg-[var(--color-background-white)] p-2 space-y-6">

      {/* HEADER */}
      <div className="flex flex-col lg:flex-row justify-between gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold">
            Gestion des administrateurs
          </h1>
          <p className="text-sm text-gray-500">
            Gérez les privilèges système
          </p>
        </div>

        <button
          onClick={() => {
            setSelected(null);
            setOpenModal(true);
          }}
          className="btn-primary flex items-center gap-2 h-10"
        >
          <Plus size={16} />
          Ajouter un administrateur
        </button>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <StatCard key={i} title={s.label} value={String(s.value)} delay={i * 100} />
        ))}
      </div>

      {/* SEARCH */}
      <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
        <div className="relative flex-1">
          <TextInput
            className="w-full pl-9"
            value={search}
            name="search"
            iconLeft={Search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher..." />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="input w-full lg:w-auto"
        >
          <option value="all">Tous les rôles</option>
          <option value="super_admin">Super Admin</option>
          <option value="admin">Admin</option>
        </select>
        <button
          onClick={() => { setSearch(''); setRoleFilter('all'); }}
          className="flex items-center gap-2 btn-secondary font-medium transition-colors  whitespace-nowrap"
        >
          <RefreshCw size={16} />Réinitialiser
        </button>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-[var(--radius-md)] shadow overflow-x-auto">
        <table className="w-full text-sm min-w-[600px]">
          <thead className="bg-[var(--color-gray-light)] text-md capitalize text-[var(--color-dark)] text-left">
            <tr>
              <th className="p-3 text-left">Nom</th>
              <th>Email</th>
              <th>Rôle</th>
              <th>Statut</th>
              <th>Dernière connexion</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {loading && (
              <tr><td colSpan={6} className="p-6 text-center text-[var(--color-gray)]">Chargement...</td></tr>
            )}
            {!loading && admins.map((a) => {
              const sd = statusDisplay(a.status);
              return (
                <tr key={a.uuid} className="border-t border-t-[var(--color-gray-light)] hover:bg-[var(--color-gray-light)]">

                  <td className="p-3 flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold overflow-hidden shrink-0">
                          {a.photo ? (
                            <img src={a.photo} alt={a.full_name} className='w-full h-full object-cover' />
                          ) : (
                            (a.first_name?.[0] ?? '?').toUpperCase()
                          )}
                        </div>
                        <span className="font-medium">
                          {a.full_name}
                        </span>
                      </td>

                  <td className='p-2'>{a.email}</td>

                  <td className='p-2'>
                    {(a.roles ?? []).filter(r => ADMIN_ROLES.includes(r)).map(r => (
                      <span key={r} className={`p-2 text-xs rounded-xl capitalize ${roleBadge(r)}`}>
                        {r === 'super_admin' ? 'Super Admin' : 'Admin'}
                      </span>
                    ))}
                  </td>

                  <td className='p-2 whitespace-nowrap'>
                    <span className={sd.color}>● {sd.text}</span>
                  </td>

                  <td className='p-2 whitespace-nowrap'>{formatDate(a.last_login_at)}</td>
                  <td className='p-2'>
                    <button
                      onClick={() => {
                        setSelected(a);
                        setOpenModal(true);
                      }}
                    >
                      <MoreVertical size={16} />
                    </button>
                  </td>

                </tr>
              );
            })}
            {!loading && admins.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-10 text-[var(--color-gray)]">
                  Aucun administrateur trouvé
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* PAGINATION */}
      {!loading && meta.total > 0 && (
        <div className="flex flex-col lg:flex-row justify-between items-center p-4 text-sm gap-3">
          <span className="text-[var(--color-gray)]">
            Page {meta.current_page} sur {meta.last_page} • Total: {meta.total}
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
      {/* MODAL */}
      {openModal && (
        <AdminModal
          data={selected}
          onClose={() => setOpenModal(false)}
          onSuccess={(message) => {
            setOpenModal(false);
            toast.success(message);
            fetchAdmins();
          }}
          onError={(message) => toast.error(message)}
        />
      )}
    </div>
  );
}

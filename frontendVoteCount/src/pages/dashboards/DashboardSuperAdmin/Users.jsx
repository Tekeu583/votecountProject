import {
  Search,
  Plus,
  Pencil,
  Trash2,
  User,
  UserPlus,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  AlertCircle,
  Loader,
} from 'lucide-react';

import { useState } from 'react';
import { FadeLoader } from 'react-spinners';
import toast from 'react-hot-toast';
import { useDebounce } from '@hooks/useDebounce';
import useUsers from '@hooks/useUsers';
import { usersApi } from '@services/api';
import UserModal from './UserModal';
import TextInput from '@components/ui/TextInput';
import StatCard from '@components/dashboard/StatCard';
import { getPrimaryRole } from '@utils/roleRoutes';



const badgeRole = (role) => {
  switch (role) {
    case 'super_admin':
      return 'bg-blue-100 text-blue-600';
    case 'admin_org':
      return 'bg-purple-100 text-purple-600';
    case 'votant':
      return 'bg-gray-100 text-gray-600';
    case 'jury':
      return 'bg-gray-200 text-gray-600';
    case 'candidat':
      return 'bg-yellow-100 text-yellow-600';
    case 'user':
      return 'bg-green-100 text-green-600';
    default:
      return '';
  }
};

export default function Users() {
  const [openModal, setOpenModal] = useState(false);
  const [selected, setSelected] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 4000);
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Hook personnalisé pour gérer les utilisateurs
  const {
    users,
    stats,
    loading,
    error,
    currentPage,
    totalPages,
    totalUsers,
    filters,
    refresh,
    applyFilters,
    clearFilters,
    goToPage,
  } = useUsers({
    limit: 15,
    autoFetch: true,
  });

  /**
   * Gère la recherche et les filtres
   */
  const handleSearch = (value) => {
    setSearchTerm(value);
    applyFilters({
      search: value,
      role: roleFilter,
      status: statusFilter,
    });
  };

  const handleRoleFilter = (value) => {
    setRoleFilter(value);
    applyFilters({
      search: debouncedSearch,
      role: value,
      status: statusFilter,
    });
  };

  const handleStatusFilter = (value) => {
    setStatusFilter(value);
    applyFilters({
      search: debouncedSearch,
      role: roleFilter,
      status: value,
    });
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setRoleFilter('');
    setStatusFilter('');
    clearFilters();
  };

  /**
   * Gère la sauvegarde (création ou mise à jour)
   */
  const handleSave = async (data) => {
    try {
      if (selected?.id) {
        await usersApi.update(selected.id, data);
        toast.success('Utilisateur modifié avec succès');
      } else {
        await usersApi.create(data);
        toast.success('Utilisateur créé avec succès');
      }
      refresh();
      setOpenModal(false);
      setSelected(null);
    } catch (err) {
      toast.error(err.message || 'Erreur lors de la sauvegarde');
    }
  };

  /**
   * Gère la suppression d'un utilisateur
   */
  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      try {
        await usersApi.delete(id);
        toast.success('Utilisateur supprimé');
        refresh();
      } catch (err) {
        toast.error(err.message || 'Erreur lors de la suppression');
      }
    }
  };

  // État des stats
  const displayStats = [
    {
      label: 'Total utilisateurs',
      value: stats?.total_users || totalUsers || '0',
      icon: UserPlus,
      borderColor: "[var(--color-dark)]",
      className: "text-[var(--color-dark)]",
      color: "bg-[var(--color-dark)]"
    },
    {
      label: 'Utilisateurs actifs',
      value: stats?.active_users || '0',
      icon: UserPlus,
      className: "text-[var(--color-primary)]",
      borderColor: "[var(--color-primary)]",
      color: "bg-green-50"
    },
    {
      label: 'Nouveaux (24h)',
      value: stats?.new_today || '0',
      icon: User,
      className: "text-green-500",
      borderColor: "[var(--color-success)]",
      color: "bg-green-50"
    },
    {
      label: 'Alertes',
      value: stats?.alerts || '0',
      icon: AlertCircle,
      className: "text-red-500",
      borderColor: "[var(--color-danger)]",
      color: "bg-red-50"
    },
  ];

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };
  const getStatusDisplay = (user) => {
    if (user.status === 'active') {
      return { text: 'Actif', color: 'text-green-600' };
    } else if (user.status === 'inactive') {
      return { text: 'Inactif', color: 'text-gray-600' };
    } else if (user.status === 'suspended') {
      return { text: 'Suspendu', color: 'text-red-600' };
    } else {
      return { text: user.status || 'Inconnu', color: 'text-gray-600' };
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <FadeLoader color="#1e40af" size={48} cssOverride={{
            display: "block",
            margin: "0 auto",
          }} />
          <p className="mt-4 text-gray-600">
            Chargement...
          </p>
        </div>
      </div>
    );
  }
  return (
    <div className="p-2 space-y-6">
      {/* HEADER */}
      <div className="flex flex-col lg:flex-row justify-between gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold">
            Gestion des Utilisateurs
          </h1>
          <p className="text-sm text-gray-500">
            Gérez les accès et rôles
          </p>
        </div>

        <button
          onClick={() => {
            setSelected(null);
            setOpenModal(true);
          }}
          className="btn-primary flex items-center gap-2 w-full lg:w-auto justify-center h-10"
        >
          <Plus size={16} />
          Ajouter utilisateur
        </button>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {displayStats.map((s, i) => (
          <StatCard key={i} title={s.label} icon={s.icon} className={s.className} borderColor={s.borderColor} color={s.color} value={String(s.value)} delay={i * 100} />
        ))}
      </div>

      {/* ERREUR */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-900">Erreur</h3>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* FILTER */}
      <div className="p-4 bg-[var(--color-background-white)] rounded-[--radius-md] shadow flex flex-col gap-3 md:flex-row lg:items-center">
        <div className="relative w-full lg:w-2/3">
          <TextInput
            iconLeft={Search}
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-9 w-full"
            placeholder="Rechercher par nom ou email..."
          />
        </div>

        <div className="flex gap-2 w-full min-w-[200px] lg:w-auto">
          <select
            value={roleFilter}
            onChange={(e) => handleRoleFilter(e.target.value)}
            className="input w-full"
          >
            <option value="">Tous les rôles</option>
            <option value="super_admin">Super Admin</option>
            <option value="admin_org">Admin Org</option>
            <option value="jury">Jury</option>
            <option value="votant">Votant</option>
            <option value="candidat">Candidat</option>
          </select>
        </div>

        <div className="flex gap-2 w-full min-w-[200px] lg:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => handleStatusFilter(e.target.value)}
            className="input w-full"
          >
            <option value="">Tous les statuts</option>
            <option value="Actif">Actif</option>
            <option value="Inactif">Inactif</option>
          </select>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleResetFilters}
            className="flex items-center gap-2 btn-secondary whitespace-nowrap group"
          >
            <RefreshCw
              size={16}
              className="transition-transform duration-300 group-hover:rotate-180"
            />
            Réinitialiser
          </button>

          <button
            onClick={refresh}
            disabled={loading}
            className="flex items-center gap-2 btn-secondary whitespace-nowrap disabled:opacity-50"
          >
            {loading ? (
              <Loader size={16} className="animate-spin" />
            ) : (
              <RefreshCw size={16} />
            )}
            Actualiser
          </button>
        </div>
      </div>

      {/* TABLE DESKTOP */}
      <div className="bg-[var(--color-white)] rounded-[var(--radius-md)] shadow-[var(--shadow-md)] overflow-x-auto">
        {/* Render logic: Extract nested ternary for clarity */}
        {(() => {
          const isLoadingEmpty = loading && users.length === 0;
          const isEmpty = users.length === 0;

          if (isLoadingEmpty) {
            return (
              <div className="flex items-center justify-center p-12">
                <Loader size={32} className="animate-spin text-blue-600" />
              </div>
            );
          }

          if (isEmpty) {
            return (
              <div className="flex flex-col items-center justify-center p-12 text-center">
                <User size={48} className="text-gray-300 mb-4" />
                <h3 className="text-lg font-semibold text-gray-600">Aucun utilisateur trouvé</h3>
                <p className="text-sm text-gray-500">Commencez par ajouter un nouvel utilisateur</p>
              </div>
            );
          }

          return (
            <table className="w-full text-sm min-w-[700px]">
              <thead className="bg-[var(--color-gray-light)] text-xs uppercase">
                <tr>
                  <th className="p-3 text-left">Utilisateur</th>
                  <th className="text-left">Email</th>
                  <th className="text-left">Rôle</th>
                  <th className="text-left">Date</th>
                  <th className="text-left">Statut</th>
                  <th className="text-left">Actions</th>
                </tr>
              </thead>

              <tbody>
                {users.map((u) => {
                  const statusDisplay = getStatusDisplay(u);
                  return (
                    <tr
                      key={u.id}
                      className="border-t border-t-[var(--color-gray-light)] hover:bg-[var(--color-gray-light)] items-center"
                    >
                      <td className="p-3 flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500  flex items-center justify-center text-white text-xs font-bold">
                          <img src={u.photo} alt={u.last_name} className='w-full h-full' />
                        </div>
                        <span className="font-medium">
                          {u.name} {u.lastname || ''}
                        </span>
                      </td>

                      <td className="text-gray-600">{u.email}</td>

                      <td>
                        <select
                          value={
                            // supporte role objet ou string
                            (() => {
                              const pr = getPrimaryRole(u);
                              return typeof pr === 'string' ? pr : pr?.name || pr?.id || '';
                            })()
                          }
                          onChange={() => { }}
                          className="px-2 py-1 text-xs border rounded-md"
                        >
                          {u.roles?.map((role) => {
                            const roleName = typeof role === 'string' ? role : role?.name || role?.id;
                            const roleKey = typeof role === 'string' ? role : role?.id || roleName;
                            return (
                              <option key={roleKey} value={roleName}>
                                {roleName}
                              </option>
                            );
                          })}
                        </select>
                      </td>

                      <td className="text-gray-600">
                        {formatDate(u.created_at || u.date)}
                      </td>

                      <td>
                        <span className={`text-xs font-semibold ${statusDisplay.color}`}>
                          ● {statusDisplay.text}
                        </span>
                      </td>

                      <td className="flex gap-2 justify-center p-3">
                        <button
                          onClick={() => {
                            setSelected(u);
                            setOpenModal(true);
                          }}
                          className="p-1 hover:bg-blue-100 rounded transition-colors"
                          title="Modifier"
                        >
                          <Pencil size={16} className="text-blue-600" />
                        </button>
                        <button
                          onClick={() => handleDelete(u.id)}
                          className="p-1 hover:bg-red-100 rounded transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 size={16} className="text-red-600" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          );
        })()}
      </div>

      {/* PAGINATION */}
      {totalPages > 1 && (
        <div className="flex flex-col lg:flex-row justify-between items-center p-4 text-sm gap-3">
          <span className="text-[var(--color-gray)]">
            Page {currentPage} sur {totalPages} • Total: {totalUsers} utilisateurs
          </span>

          <div className="flex gap-2 items-center">
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
            >
              <ChevronLeft size={16} />
            </button>


            <button
              className="px-3 py-1 rounded bg-[var(--color-primary)] text-white border hover:bg-gray-100"
            >
              {currentPage}
            </button>


            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* MODAL */}
      {openModal && (
        <UserModal
          data={selected}
          onClose={() => {
            setOpenModal(false);
            setSelected(null);
          }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}


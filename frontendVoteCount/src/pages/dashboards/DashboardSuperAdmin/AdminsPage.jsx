import {
  Plus,
  Search,
  MoreVertical,
  User,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';

import { useState, useMemo } from 'react';
import { FadeLoader } from 'react-spinners';
import toast from 'react-hot-toast';
import AdminModal from './AdminModal';
import TextInput from '@components/ui/TextInput';
import StatCard from '@components/dashboard/StatCard';
import { usersApi } from '@services/api';

const stats = [
  { label: 'Total Admins', value: 24 },
  { label: 'Actifs', value: 18 },
  { label: 'En attente', value: 6 },
  { label: 'Dernier audit', value: 'Il y a 2h' },
];
const initialAdmins = [
  {
    id: 1,
    name: 'Arsene Tekeu',
    email: 'm.tekeu@vote.com',
    role: 'SUPER_ADMIN',
    status: 'Actif',
    lastLogin: 'Aujourd’hui, 09:42',
  },
  {
    id: 2,
    name: 'Valerie NG',
    email: 'valerie@vote.com',
    role: 'EDITEUR',
    status: 'Actif',
    lastLogin: 'Hier, 17:15',
  },
  {
    id: 3,
    name: 'Tonny Fokam',
    email: 'tonny@vote.com',
    role: 'ADMIN_ORG',
    status: 'Actif',
    lastLogin: 'Hier, 17:15',
  },
  {
    id: 4,
    name: 'Arsene Tekeu',
    email: 'm.tekeu@vote.com',
    role: 'user',
    status: 'Actif',
    lastLogin: 'Aujourd’hui, 09:42',
  },
  {
    id: 5,
    name: 'Valerie NG',
    email: 'valerie@vote.com',
    role: 'user',
    status: 'Actif',
    lastLogin: 'Hier, 17:15',
  },
  {
    id: 6,
    name: 'Tonny Fokam',
    email: 'tonny@vote.com',
    role: 'user',
    status: 'Actif',
    lastLogin: 'Hier, 17:15',
  },
];

const roleBadge = (role) => {
  switch (role) {
    case 'SUPER_ADMIN':
      return 'bg-[var(--color-primary)] text-white';
    case 'EDITEUR':
      return 'bg-gray-200 text-gray-900';
    case 'ADMIN_ORG':
      return 'bg-[var(--color-primary)]/40 text-gray-800';
    default:
      return 'bg-gray-200 text-gray-900';
  }
};

export default function AdminsPage() {
  const [admins, setAdmins] = useState(initialAdmins);
  const [openModal, setOpenModal] = useState(false);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 3;

  const filteredAdmin = useMemo(() => {
    return admins.filter((a) =>
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.email.toLowerCase().includes(search.toLowerCase())
    );
  }, [search, admins]);

  const paginatedAdmins = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredAdmin.slice(start, start + itemsPerPage);
  }, [filteredAdmin, currentPage]);

  const totalPages = Math.ceil(filteredAdmin.length / itemsPerPage);


  const handleSave = (data) => {
    if (selected) {
      setAdmins((prev) =>
        prev.map((a) => (a.id === selected.id ? { ...a, ...data } : a))
      );
      toast.success('Admin modifié');
    } else {
      setAdmins((prev) => [...prev, { ...data, id: Date.now() }]);
      toast.success('Admin ajouté');
    }
  };
  
  

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
          <StatCard key={i} title={s.label} value={s.value} delay={i * 100} />
        ))}
      </div>

      {/* SEARCH */}
      <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
        <div className="relative flex-1">
          <TextInput
            iconLe={Search}
            className="w-full pl-9"
            value={search}
            name="search"
            iconLeft={Search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher..." />
        </div>
        <button
          onClick={() => {
            setSearch('');
          }}
          className="flex items-center gap-2 btn-secondary font-medium transition-colors  whitespace-nowrap"
        >
          <RefreshCw size={16} />Réinitialiser
        </button>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-[var(--radius-md)] shadow overflow-x-auto">
        <table className="w-full text-sm min-w-[600px]">
          <thead className="bg-[var(--color-gray-light)] text-md capitalize text-[var(--color-dark)]">
            <tr>
              <th className="p-3 text-left">Nom</th>
              <th>Email</th>
              <th>Rôle</th>
              <th>Statut</th>
              <th>Connexion</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {paginatedAdmins.map((a) => (
              <tr key={a.id} className="border-t border-t-[var(--color-gray-light)] hover:bg-[var(--color-gray-light)]">

                <td className="p-3 flex items-center gap-2">
                  <div className="w-8 h-7 bg-gray-200 lg:rounded-full lg: rounded-full flex items-center justify-center">
                    <User size={14} />
                  </div>
                  {a.name}
                </td>

                <td className='p-2'>{a.email}</td>

                <td className='p-2'>
                  <span className={`p-2 text-xs rounded-xl capitalize ${roleBadge(a.role)}`}>
                    {a.role}
                  </span>
                </td>

                <td className='p-2 whitespace-nowrap'>
                  <span className={a.status === 'Actif' ? 'text-green-600' : 'text-gray-400'}>
                    ● {a.status}
                  </span>
                </td>

                <td className='p-2 whitespace-nowrap'>{a.lastLogin}</td>
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
            ))}
            {filteredAdmin.length === 0 && (
              <div className="text-center py-10 text-[var(--color-gray)]">
                Aucun administrateurs trouvé
              </div>
            )}
          </tbody>
        </table>
      </div>

      {/* PAGINATION */}
      <div className="flex flex-col lg:flex-row justify-between items-center p-4 text-sm gap-3">
        <span className="text-[var(--color-gray)]">
          Affichage de {(currentPage - 1) * itemsPerPage + 1} à{" "}
          {Math.min(currentPage * itemsPerPage, filteredAdmin.length)} sur{" "}
          {filteredAdmin.length}
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
      {/* MODAL */}
      {openModal && (
        <AdminModal
          data={selected}
          onClose={() => setOpenModal(false)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

import { Plus, Search, Edit2, Trash2, Users, Vote, RefreshCw, UserCog, Building2 } from 'lucide-react';
import TextInput from '@components/ui/TextInput';
import toast from 'react-hot-toast';
import { useDebounce } from '@hooks/useDebounce';
import { useOrg } from '@hooks/useOrg';
import StaffModal from './StaffModal';
import OrgMemberModal from './OrgMemberModal';
import { useState, useEffect, useMemo, useCallback } from 'react';
import StatCard from '@/components/dashboard/StatCard';
import { electionsApi, staffApi, organizationsApi } from '@services/api';
import { FadeLoader } from 'react-spinners';

const MAX_ELECTIONS_FETCHED = 20;

const ROLE_LABELS = { manager: 'Gestionnaire', observer: 'Observateur', admin: 'Administrateur', member: 'Membre', viewer: 'Observateur', owner: 'Propriétaire' };
const ROLE_BADGE_CLASSES = {
  manager: 'bg-green-100 text-green-700',
  observer: 'bg-blue-100 text-blue-700',
  admin: 'bg-purple-100 text-purple-700',
  member: 'bg-gray-100 text-gray-700',
  viewer: 'bg-blue-100 text-blue-700',
  owner: 'bg-amber-100 text-amber-700',
};

const initiales = (fullName) => (fullName || '?')
  .split(' ')
  .map((p) => p[0])
  .slice(0, 2)
  .join('')
  .toUpperCase();

// ── Section A : gestionnaires/observateurs par élection ──────────────────
const StaffSection = () => {
  const { org } = useOrg();

  const [elections, setElections] = useState([]);
  const [loadingElections, setLoadingElections] = useState(true);
  const [membres, setMembres] = useState([]);
  const [loadingMembres, setLoadingMembres] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [staffToEdit, setStaffToEdit] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 400);
  const [selectedElectionFilter, setSelectedElectionFilter] = useState('');

  // Contrairement au jury, manager/observer s'appliquent à tout type d'élection.
  useEffect(() => {
    if (!org?.uuid) return;
    const fetchElections = async () => {
      setLoadingElections(true);
      try {
        const res = await electionsApi.getAll({ organization_uuid: org.uuid, per_page: 100 });
        setElections(res.data?.data ?? []);
      } catch {
        toast.error('Impossible de charger les élections.');
      } finally {
        setLoadingElections(false);
      }
    };
    fetchElections();
  }, [org?.uuid]);

  const loadMembres = useCallback(async () => {
    if (elections.length === 0) {
      setMembres([]);
      return;
    }

    setLoadingMembres(true);
    try {
      const targets = selectedElectionFilter
        ? elections.filter((e) => e.uuid === selectedElectionFilter)
        : elections.slice(0, MAX_ELECTIONS_FETCHED);

      const results = await Promise.all(
        targets.map((election) =>
          staffApi.getAll(election.uuid)
            .then((res) => (res.data?.data ?? []).map((s) => ({ ...s, electionUuid: election.uuid, electionTitle: election.title })))
            .catch(() => [])
        )
      );

      const byUuid = new Map();
      for (const staff of results.flat()) {
        const assignment = { electionUuid: staff.electionUuid, electionTitle: staff.electionTitle, role_slug: staff.role_slug, status: staff.status };
        if (byUuid.has(staff.uuid)) {
          byUuid.get(staff.uuid).assignments.push(assignment);
        } else {
          byUuid.set(staff.uuid, {
            uuid: staff.uuid,
            full_name: staff.full_name,
            email: staff.email,
            photo: staff.photo,
            assignments: [assignment],
          });
        }
      }

      setMembres(Array.from(byUuid.values()));
    } finally {
      setLoadingMembres(false);
    }
  }, [elections, selectedElectionFilter]);

  useEffect(() => {
    loadMembres();
  }, [loadMembres]);

  const scrutinsAvecStaff = useMemo(
    () => new Set(membres.flatMap((m) => m.assignments.map((a) => a.electionUuid))).size,
    [membres]
  );

  const filteredMembres = useMemo(() => {
    if (!debouncedSearch.trim()) return membres;
    const term = debouncedSearch.toLowerCase().trim();
    return membres.filter((membre) =>
      membre.full_name?.toLowerCase().includes(term) ||
      membre.email?.toLowerCase().includes(term) ||
      membre.assignments.some((a) => a.electionTitle.toLowerCase().includes(term))
    );
  }, [debouncedSearch, membres]);

  const openAddModal = () => {
    setModalMode('add');
    setStaffToEdit(null);
    setIsModalOpen(true);
  };

  const openEditModal = (membre) => {
    setModalMode('edit');
    setStaffToEdit({ userUuid: membre.uuid, email: membre.email, assignments: membre.assignments });
    setIsModalOpen(true);
  };

  const handleRemove = async (membre, assignment) => {
    if (!window.confirm(`Retirer ${membre.full_name} de "${assignment.electionTitle}" ?`)) return;
    try {
      await staffApi.delete(assignment.electionUuid, membre.uuid);
      toast.success('Membre retiré avec succès');
      loadMembres();
    } catch (error) {
      toast.error(error.response?.data?.message ?? 'Erreur lors du retrait');
    }
  };

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedElectionFilter('');
  };

  const handleModalSuccess = (message) => {
    toast.success(message);
    loadMembres();
  };

  if (loadingElections) {
    return (
      <div className="py-20 flex items-center justify-center">
        <FadeLoader color="#1e40af" cssOverride={{ display: 'block', margin: '0 auto' }} />
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
        <div className="flex-1">
          <p className="text-[var(--color-gray)] text-sm md:text-base">
            Gérez les gestionnaires et observateurs affectés à vos scrutins.
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="btn-primary flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium w-full lg:w-auto whitespace-nowrap"
        >
          <Plus size={18} />
          Affecter un membre
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 capitalize">
        <StatCard title="Total du staff" value={membres.length} icon={Users} delay={0} />
        <StatCard title="Scrutins avec staff" value={scrutinsAvecStaff} icon={Vote} delay={100} />
      </div>

      <div className="bg-[var(--color-white)] rounded-[var(--radius-md)] shadow-[var(--shadow-md)] border border-gray-100 overflow-x-auto">
        <div className="flex flex-col md:flex-row gap-4 p-2">
          <div className="flex-1">
            <label htmlFor="staff-search" className="block text-sm font-medium text-[var(--color-gray)] mb-2">RECHERCHER</label>
            <TextInput
              id="staff-search"
              type="text"
              iconLeft={Search}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Nom, email ou scrutin..."
            />
          </div>

          <div className="md:w-96">
            <label htmlFor="staff-elections" className="block text-sm font-medium text-[var(--color-gray)] mb-2">FILTRER PAR SCRUTIN</label>
            <select
              id="staff-elections"
              value={selectedElectionFilter}
              onChange={(e) => setSelectedElectionFilter(e.target.value)}
              className="w-full border border-[var(--color-gray-light)] rounded-[var(--radius-md)] px-4 py-3 focus:outline-none focus:border-[var(--color-primary)]"
            >
              <option value="">Tous les scrutins</option>
              {elections.map((election) => (
                <option key={election.uuid} value={election.uuid}>{election.title}</option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={resetFilters}
              className="flex items-center gap-2 px-5 py-3 border border-[var(--color-gray-light)] rounded-[var(--radius-md)] hover:bg-gray-50 text-[var(--color-gray)] font-medium"
            >
              <RefreshCw size={18} />
              Réinitialiser
            </button>
          </div>
        </div>

        <div className="bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px]">
              <thead>
                <tr className="border-b border-b-[var(--color-gray-light)] bg-[var(--color-gray-light)] capitalize">
                  <th className="text-left py-2 px-2 md:px-6 font-medium text-[var(--color-dark)]">MEMBRES</th>
                  <th className="text-left py-2 px-2 md:px-6 font-medium text-[var(--color-dark)]">SCRUTINS ASSIGNÉS</th>
                  <th className="text-left py-2 px-2 md:px-6 font-medium text-[var(--color-dark)]">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-gray-light)]">
                {loadingMembres ? (
                  <tr><td colSpan={3} className="text-center py-10 text-[var(--color-gray)]">Chargement...</td></tr>
                ) : filteredMembres.length === 0 ? (
                  <tr><td colSpan={3} className="text-center py-10 text-[var(--color-gray)]">Aucun membre trouvé</td></tr>
                ) : (
                  filteredMembres.map((membre) => (
                    <tr key={membre.uuid} className="hover:bg-[var(--color-background-white)] transition-colors">
                      <td className="px-2 py-2 md:px-6">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 flex items-center justify-center rounded-full text-sm font-semibold bg-blue-100 text-blue-700">
                            {initiales(membre.full_name)}
                          </div>
                          <div>
                            <p className="font-medium text-[var(--color-dark)]">{membre.full_name}</p>
                            <p className="text-sm text-[var(--color-gray)]">{membre.email}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-2 py-2 md:px-6">
                        <div className="flex flex-wrap gap-1.5">
                          {membre.assignments.map((a) => (
                            <span
                              key={a.electionUuid}
                              className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full ${ROLE_BADGE_CLASSES[a.role_slug] ?? 'bg-gray-100 text-gray-700'}`}
                              title={ROLE_LABELS[a.role_slug] ?? a.role_slug}
                            >
                              {a.electionTitle} · {ROLE_LABELS[a.role_slug] ?? a.role_slug}
                              <button
                                type="button"
                                onClick={() => handleRemove(membre, a)}
                                className="rounded-full p-0.5 -mr-1 hover:bg-red-600 hover:text-white transition-colors"
                                title="Retirer ce rôle de cette élection"
                                aria-label="Retirer ce rôle de cette élection"
                              >
                                <Trash2 size={13} />
                              </button>
                            </span>
                          ))}
                        </div>
                      </td>

                      <td className="px-2 py-2 md:px-6">
                        <button
                          onClick={() => openEditModal(membre)}
                          className="flex items-center gap-1 text-gray-600 hover:text-blue-600 transition-colors p-1"
                          title="Modifier les affectations"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <StaffModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        mode={modalMode}
        staffToEdit={staffToEdit}
        elections={elections}
        onSuccess={handleModalSuccess}
        onError={(message) => toast.error(message)}
      />
    </div>
  );
};

// ── Section B : membres de l'organisation ─────────────────────────────────
const OrgMembersSection = () => {
  const { org } = useOrg();
  const [membres, setMembres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 400);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [memberToEdit, setMemberToEdit] = useState(null);

  const loadMembres = useCallback(async () => {
    if (!org?.uuid) return;
    setLoading(true);
    try {
      const res = await organizationsApi.listUsers(org.uuid);
      setMembres(res.data?.data ?? []);
    } catch {
      toast.error("Impossible de charger les membres de l'organisation.");
    } finally {
      setLoading(false);
    }
  }, [org?.uuid]);

  useEffect(() => {
    loadMembres();
  }, [loadMembres]);

  const filteredMembres = useMemo(() => {
    if (!debouncedSearch.trim()) return membres;
    const term = debouncedSearch.toLowerCase().trim();
    return membres.filter((m) => m.full_name?.toLowerCase().includes(term) || m.email?.toLowerCase().includes(term));
  }, [debouncedSearch, membres]);

  const openAddModal = () => {
    setModalMode('add');
    setMemberToEdit(null);
    setIsModalOpen(true);
  };

  const openEditModal = (membre) => {
    setModalMode('edit');
    setMemberToEdit(membre);
    setIsModalOpen(true);
  };

  const handleRemove = async (membre) => {
    if (!window.confirm(`Retirer ${membre.full_name} de l'organisation ?`)) return;
    try {
      await organizationsApi.removeUser(org.uuid, membre.uuid);
      toast.success('Membre retiré avec succès');
      loadMembres();
    } catch (error) {
      toast.error(error.response?.data?.message ?? 'Erreur lors du retrait');
    }
  };

  const handleModalSuccess = (message) => {
    toast.success(message);
    loadMembres();
  };

  if (loading) {
    return (
      <div className="py-20 flex items-center justify-center">
        <FadeLoader color="#1e40af" cssOverride={{ display: 'block', margin: '0 auto' }} />
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
        <p className="flex-1 text-[var(--color-gray)] text-sm md:text-base">
          Gérez les membres généraux de votre organisation (administrateurs, membres, observateurs).
        </p>
        <button
          onClick={openAddModal}
          className="btn-primary flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium w-full lg:w-auto whitespace-nowrap"
        >
          <Plus size={18} />
          Ajouter un membre
        </button>
      </div>

      <div className="mb-6 md:w-96">
        <label htmlFor="member-search" className="block text-sm font-medium text-[var(--color-gray)] mb-2">RECHERCHER</label>
        <TextInput
          id="member-search"
          type="text"
          iconLeft={Search}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Nom ou email..."
        />
      </div>

      <div className="bg-[var(--color-white)] rounded-[var(--radius-md)] shadow-[var(--shadow-md)] border border-gray-100 overflow-x-auto">
        <table className="w-full min-w-[700px]">
          <thead>
            <tr className="border-b border-b-[var(--color-gray-light)] bg-[var(--color-gray-light)] capitalize">
              <th className="text-left py-2 px-2 md:px-6 font-medium text-[var(--color-dark)]">MEMBRE</th>
              <th className="text-left py-2 px-2 md:px-6 font-medium text-[var(--color-dark)]">RÔLE</th>
              <th className="text-left py-2 px-2 md:px-6 font-medium text-[var(--color-dark)]">ACTIONS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-gray-light)]">
            {filteredMembres.length === 0 ? (
              <tr><td colSpan={3} className="text-center py-10 text-[var(--color-gray)]">Aucun membre trouvé</td></tr>
            ) : (
              filteredMembres.map((membre) => {
                const isOwner = membre.role_slug === 'owner';
                return (
                  <tr key={membre.uuid} className="hover:bg-[var(--color-background-white)] transition-colors">
                    <td className="px-2 py-2 md:px-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 flex items-center justify-center rounded-full text-sm font-semibold bg-blue-100 text-blue-700">
                          {initiales(membre.full_name)}
                        </div>
                        <div>
                          <p className="font-medium text-[var(--color-dark)]">{membre.full_name}</p>
                          <p className="text-sm text-[var(--color-gray)]">{membre.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-2 py-2 md:px-6">
                      <span className={`inline-flex items-center px-3 py-1 text-xs font-medium rounded-full ${ROLE_BADGE_CLASSES[membre.role_slug] ?? 'bg-gray-100 text-gray-700'}`}>
                        {ROLE_LABELS[membre.role_slug] ?? membre.role_slug}
                      </span>
                    </td>
                    <td className="px-2 py-2 md:px-6">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => openEditModal(membre)}
                          disabled={isOwner}
                          className="flex items-center gap-1 text-gray-600 hover:text-blue-600 transition-colors p-1 disabled:opacity-30 disabled:cursor-not-allowed"
                          title={isOwner ? 'Le rôle du propriétaire ne peut pas être modifié' : 'Modifier le rôle'}
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleRemove(membre)}
                          disabled={isOwner}
                          className="flex items-center gap-1 text-gray-600 hover:text-red-600 transition-colors p-1 disabled:opacity-30 disabled:cursor-not-allowed"
                          title={isOwner ? 'Le propriétaire ne peut pas être retiré' : 'Retirer'}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <OrgMemberModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        mode={modalMode}
        memberToEdit={memberToEdit}
        onSuccess={handleModalSuccess}
        onError={(message) => toast.error(message)}
      />
    </div>
  );
};

const Equipe = () => {
  const [section, setSection] = useState('staff');

  return (
    <div className="flex-1 bg-[var(--color-background-white)] p-2">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-semibold text-[var(--color-dark)]">Équipe</h1>
        <p className="text-[var(--color-gray)] mt-1 text-sm md:text-base">
          Gérez les gestionnaires/observateurs de vos scrutins et les membres de votre organisation
        </p>
      </div>

      <div className="flex gap-2 mb-8 border-b border-[var(--color-gray-light)]">
        <button
          onClick={() => setSection('staff')}
          className={`flex items-center gap-2 px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
            section === 'staff'
              ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
              : 'border-transparent text-[var(--color-gray)] hover:text-[var(--color-dark)]'
          }`}
        >
          <UserCog size={18} />
          Staff des scrutins
        </button>
        <button
          onClick={() => setSection('org')}
          className={`flex items-center gap-2 px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
            section === 'org'
              ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
              : 'border-transparent text-[var(--color-gray)] hover:text-[var(--color-dark)]'
          }`}
        >
          <Building2 size={18} />
          Membres de l'organisation
        </button>
      </div>

      {section === 'staff' ? <StaffSection /> : <OrgMembersSection />}
    </div>
  );
};

export default Equipe;

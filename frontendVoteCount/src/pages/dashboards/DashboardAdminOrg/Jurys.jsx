import { Plus, Search, Edit2, Trash2, Users, Vote, RefreshCw } from 'lucide-react';
import TextInput from '@components/ui/TextInput';
import toast from 'react-hot-toast';
import { useDebounce } from '@hooks/useDebounce';
import { useOrg } from '@hooks/useOrg';
import JuryModal from './JuryModal';
import { useState, useEffect, useMemo, useCallback } from 'react';
import StatCard from '@/components/dashboard/StatCard';
import { electionsApi, juryApi } from '@services/api';
import { FadeLoader } from 'react-spinners';

const MAX_ELECTIONS_FETCHED = 20;

const Jurys = () => {
  const { org } = useOrg();

  const [elections, setElections] = useState([]);
  const [loadingElections, setLoadingElections] = useState(true);

  // { uuid, full_name, email, photo, assignments: [{electionUuid, electionTitle}] }
  const [membres, setMembres] = useState([]);
  const [loadingMembres, setLoadingMembres] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [juryToEdit, setJuryToEdit] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 400);
  const [selectedElectionFilter, setSelectedElectionFilter] = useState('');

  // Élections de l'organisation — sert au sélecteur de filtre et au modal.
  // Seules les élections à vote pondéré nécessitent un jury.
  useEffect(() => {
    if (!org?.uuid) return;
    const fetchElections = async () => {
      setLoadingElections(true);
      try {
        const res = await electionsApi.getAll({
          organization_uuid: org.uuid,
          per_page: 100,
          vote_type: 'weighted',
        });
        setElections(res.data?.data ?? []);
      } catch {
        toast.error('Impossible de charger les élections.');
      } finally {
        setLoadingElections(false);
      }
    };
    fetchElections();
  }, [org?.uuid]);

  // Regroupe les jurés par utilisateur (une ligne = un juré, avec toutes ses
  // affectations) à partir des listes par-élection renvoyées par l'API.
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
          juryApi.getAll(election.uuid)
            .then((res) => (res.data?.data ?? []).map((j) => ({ ...j, electionUuid: election.uuid, electionTitle: election.title })))
            .catch(() => [])
        )
      );

      const byUuid = new Map();
      for (const jury of results.flat()) {
        const assignment = { electionUuid: jury.electionUuid, electionTitle: jury.electionTitle, status: jury.status };
        if (byUuid.has(jury.uuid)) {
          byUuid.get(jury.uuid).assignments.push(assignment);
        } else {
          byUuid.set(jury.uuid, {
            uuid: jury.uuid,
            full_name: jury.full_name,
            email: jury.email,
            photo: jury.photo,
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

  const scrutinsAvecJury = useMemo(
    () => new Set(membres.flatMap((m) => m.assignments.map((a) => a.electionUuid))).size,
    [membres]
  );

  const initiales = (fullName) => (fullName || '?')
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

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
    setJuryToEdit(null);
    setIsModalOpen(true);
  };

  const openEditModal = (membre) => {
    setModalMode('edit');
    setJuryToEdit({ userUuid: membre.uuid, email: membre.email, assignments: membre.assignments });
    setIsModalOpen(true);
  };

  const handleRemove = async (membre, assignment) => {
    if (!window.confirm(`Retirer ${membre.full_name} de "${assignment.electionTitle}" ?`)) return;
    try {
      await juryApi.delete(assignment.electionUuid, membre.uuid);
      toast.success('Juré retiré avec succès');
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
      <div className="h-[calc(100vh-68px)] flex items-center justify-center">
        <FadeLoader color="#1e40af" cssOverride={{ display: 'block', margin: '0 auto' }} />
      </div>
    );
  }

  return (
    <div className="flex-1 bg-[var(--color-background-white)] p-2">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
        <div className="flex-1">
          <h1 className="text-2xl md:text-3xl font-semibold text-[var(--color-dark)]">
            Gestion des Membres du Jury
          </h1>
          <p className="text-[var(--color-gray)] mt-1 text-sm md:text-base">
            Gérez les membres de vos jurys et leurs affectations
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="btn-primary flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium w-full lg:w-auto whitespace-nowrap"
        >
          <Plus size={18} />
          Affecter un membre de jury
        </button>
      </div>

      {/* Statistiques Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 capitalize">
        <StatCard title="Total des jurés" value={membres.length} icon={Users} delay={0} />
        <StatCard title="Scrutins avec jury" value={scrutinsAvecJury} icon={Vote} delay={100} />
      </div>

      {/* Tableau */}
      <div className="bg-[var(--color-white)] rounded-[var(--radius-md)] shadow-[var(--shadow-md)] border border-gray-100 overflow-x-auto">
        <div className="flex flex-col md:flex-row gap-4 p-2">
          {/* Recherche */}
          <div className="flex-1">
            <label htmlFor='search' className="block text-sm font-medium text-[var(--color-gray)] mb-2">RECHERCHER UN JURY</label>
            <TextInput
              id='search'
              type="text"
              iconLeft={Search}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Nom, email ou scrutin..."
            />
          </div>

          {/* Filtre par Élection */}
          <div className="md:w-96">
            <label htmlFor='elections' className="block text-sm font-medium text-[var(--color-gray)] mb-2">FILTRER PAR SCRUTIN</label>
            <select
              id='elections'
              value={selectedElectionFilter}
              onChange={(e) => setSelectedElectionFilter(e.target.value)}
              className="w-full border border-[var(--color-gray-light)] rounded-[var(--radius-md)] px-4 py-3 focus:outline-none focus:border-[var(--color-primary)]"
            >
              <option value="">Tous les scrutins</option>
              {elections.map((election) => (
                <option key={election.uuid} value={election.uuid}>
                  {election.title}
                </option>
              ))}
            </select>
          </div>

          {/* Bouton Réinitialiser */}
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

        {/* Table */}
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
                  <tr><td colSpan={3} className="text-center py-10 text-[var(--color-gray)]">Aucun juré trouvé</td></tr>
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
                              className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700"
                            >
                              {a.electionTitle}
                              <button
                                type="button"
                                onClick={() => handleRemove(membre, a)}
                                className="rounded-full p-0.5 -mr-1 hover:bg-red-600 hover:text-white transition-colors"
                                title="Retirer ce juré de cette élection"
                                aria-label="Retirer ce juré de cette élection"
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

      <JuryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        mode={modalMode}
        juryToEdit={juryToEdit}
        elections={elections}
        onSuccess={handleModalSuccess}
        onError={(message) => toast.error(message)}
      />
    </div>
  );
};

export default Jurys;

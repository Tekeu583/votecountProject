import { Plus, Search, Edit2, Trash2, Users, Vote, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import TextInput from '@components/ui/TextInput';
import toast from 'react-hot-toast';
import { useDebounce } from '@hooks/useDebounce';
import JuryModal from './JuryModal';
import { useState, useMemo } from 'react';
import StatCard from "@/components/dashboard/StatCard";

const Jurys = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [juryToEdit, setJuryToEdit] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 400);
  const [selectedElectionFilter, setSelectedElectionFilter] = useState('');
  const [selectedAssignmentId, setSelectedAssignmentId] = useState({});

  const membres = useMemo(() => [
    {
      id: 1,
      initiales: 'FT',
      color: 'bg-blue-100 text-blue-700',
      nom: 'fokam',
      email: 'fokam@gmail.com',
      assignments: [
        { id: 4, election: 'Innovation 2026', status: 'Actif' },
        { id: 5, election: 'Startups Q3', status: 'Retiré' },
      ],
    },
    {
      id: 2,
      initiales: 'ML',
      color: 'bg-purple-100 text-purple-700',
      nom: 'Muriel',
      email: 'muriel@corporate.fr',
      assignments: [
        { id: 3, election: 'Assemblée Générale Extraordinaire', status: 'Actif' },
        { id: 1, election: "Élection du Comité d'Entreprise 2026", status: 'Actif' },
      ],
    },
    {
      id: 3,
      initiales: 'PL',
      color: 'bg-gray-100 text-gray-700',
      nom: 'pradier',
      email: 'pradier@gmail.com',
      assignments: [
        { id: 4, election: 'Innovation 2026', status: 'Invitation' },
      ],
    },
  ], []);

  //gestion changement election
  const handleElectionChange = (membreId, assignmentId) => {
    setSelectedAssignmentId(prev => ({
      ...prev,
      [membreId]: Number.parseInt(assignmentId)
    }));
  };
  // statut dynamique
  const getCurrentStatus = (membre) => {
    const selected = getSelectedAssignment(membre);
    if (!selected) {
      return { label: "Non assigné", color: "bg-gray-100 text-gray-600" };
    }

    switch (selected.status) {
      case "Actif":
        return { label: "Actif", color: "bg-green-100 text-green-700" };
      case "Invitation":
        return { label: "Invitation envoyée", color: "bg-orange-100 text-orange-700" };
      case "Retiré":
        return { label: "Retiré", color: "bg-red-100 text-red-700" };
      default:
        return { label: selected.status, color: "bg-gray-100 text-gray-600" };
    }
  };
  const elections = useMemo(() => [
    { id: 1, title: "Élection du Comité d'Entreprise 2026" },
    { id: 2, title: "Vote sur le Télétravail - Q3" },
    { id: 3, title: "Assemblée Générale Extraordinaire" },
    { id: 4, title: "Innovation 2026" },
    { id: 5, title: "Startups Q3" },
  ], []);

  const filteredMembres = useMemo(() => {
    let result = membres;
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      result = result.filter((membre) =>
        membre.nom.toLowerCase().includes(term) ||
        membre.email.toLowerCase().includes(term) ||
        membre.assignments.some(a => a.election.toLowerCase().includes(term))
      );
    }

    if (selectedElectionFilter) {
      result = result.filter((membre) =>
        membre.assignments.some(a => a.id === Number(selectedElectionFilter))
      );
    }

    return result;
  }, [searchTerm, selectedElectionFilter, membres]);

  const getSelectedAssignment = (membre) => {
    const selectedId = selectedAssignmentId[membre.id];
    if (selectedId) {
      return membre.assignments.find(a => a.id === selectedId);
    }
    return membre.assignments[0] || null;
  };
  const openAddModal = () => {
    setModalMode('add');
    setJuryToEdit(null);
    setIsModalOpen(true);
  };

  const openEditModal = (membre) => {
    setModalMode('edit');
    const formattedJury = {
      ...membre,
      polls: membre.assignments.map((assignment) => ({
        id: assignment.id,
        title: assignment.election,
        statut: assignment.status === 'Invitation' ? 'Invitation envoyée' : assignment.status,
      }))
    };
    setJuryToEdit(formattedJury);
    setIsModalOpen(true);
  };
  const resetFilters = () => {
    setSearchTerm('');
    setSelectedElectionFilter('');
  };

  return (
    <div className="flex-1 bg-[var(--color-background-white)] p-2">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
        <div className="flex-1">
          <h1 className="text-2xl md:text-3xl font-semibold text-[var(--color-dark)]">
            Gestion des Membres du Jury
          </h1>
          <p className="text-[var(--color-gray)] mt-1 text-sm md:text-base">
            Gérez les membres de vos jurys et leurs assignments
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="btn-primary flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium w-full lg:w-auto whitespace-nowrap"
        >
          <Plus size={18} />
          Inviter un membre de jury
        </button>
      </div>

      {/* Statistiques Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 capitalize">
        <StatCard
          title="totals des jurys"
          value="12"
          icon={Users}
          trend="+2 ce mois"
          delay={0}
        />
        <StatCard
          title="Scrutins Actifs"
          value="12"
          icon={Vote}
          delay={100}
        />
        <StatCard
          title="En attente"
          value="3"
          icon={Vote}
          className="text-orange-500"
          delay={200}
        />
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
                <option key={election.id} value={election.id}>
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
                  <th className="text-left py-2 px-2 md:px-6 font-medium text-[var(--color-dark)]">SCRUTIN ASSIGNÉS</th>
                  <th className="text-left py-2 px-2 md:px-6 font-medium text-[var(--color-dark)]">STATUT</th>
                  <th className="text-left py-2 px-2 md:px-6 font-medium text-[var(--color-dark)]">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-gray-light)]">
                {filteredMembres.map((membre) => {
                  const selectedAssignment = getSelectedAssignment(membre);
                  const status = getCurrentStatus(membre);
                  return (
                    <tr key={membre.id} className="hover:bg-[var(--color-background-white)] transition-colors">

                      <td className="px-2 py-2 md:px-6">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 flex items-center justify-center rounded-full text-sm font-semibold ${membre.color}`}>
                            {membre.initiales}
                          </div>
                          <div>
                            <p className="font-medium text-[var(--color-dark)]">{membre.nom}</p>
                            <p className="text-sm text-[var(--color-gray)]">{membre.email}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-2 py-2 md:px-6">
                        <select
                          value={selectedAssignment?.id || ''}
                          onChange={(e) => handleElectionChange(membre.id, Number(e.target.value))}
                          className="w-full px-4 py-3.5
                           bg-white border border-gray-300
                           text-base md:text-sm text-gray-700
                           rounded-[var(--radius-md)]
                           focus:outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]
                           min-h-[52px]"
                        >
                          {membre.assignments.length > 0 ? (
                            membre.assignments.map((a) => (
                              <option key={a.id} value={a.id}>
                                {a.election}
                              </option>
                            ))
                          ) : (
                            <option>Aucun scrutin assigné</option>
                          )}
                        </select>
                      </td>
                      <td className="px-2 py-2 md:px-6">
                        <span className={`inline-flex px-4 py-1.5 text-xs font-medium rounded-full ${status.color}`}>
                          {status.label}
                        </span>
                      </td>

                      <td className="px-2 py-2 md:px-6">
                        <div className="flex items-center gap-4 md:gap-6 text-sm">
                          {status.label === 'Invitation envoyée' ? (
                            <>
                              <button className="text-blue-600 hover:text-blue-700 font-medium">Renvoyer</button>
                              <button className="text-red-600 hover:text-red-700 font-medium">Annuler</button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => openEditModal(membre)}
                                className="flex items-center gap-1 text-gray-600 hover:text-blue-600 transition-colors p-1"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => toast.success("Jury retiré avec succès")}
                                className="flex items-center gap-1 text-gray-600 hover:text-red-600 transition-colors p-1"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                }
                )
                }
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        <div className="flex flex-col lg:flex-row justify-between items-center p-4 text-sm gap-3">
          <span className="text-[var(--color-gray)]">
            Affichage de 1 à {filteredMembres.length} sur {membres.length} membres
          </span>

          <div className="flex gap-2">
            <button className="px-3 py-1 border rounded"><ChevronLeft size={16} /></button>
            <button className="px-3 py-1 bg-[var(--color-primary)] text-[var(--color-white)] rounded">1</button>
            <button className="px-3 py-1 border rounded"><ChevronRight size={16} /></button>
          </div>
        </div>
      </div>
      <JuryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        mode={modalMode}
        juryToEdit={juryToEdit}
        elections={elections}
        onSuccess={(message) => toast.success(message)}
        onError={(message) => toast.error(message)}
      />
    </div>
  );
};

export default Jurys;
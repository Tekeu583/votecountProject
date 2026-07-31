import { useState, useEffect, useMemo } from "react";
import StatCard from "@components/dashboard/StatCard";
import ScrutinTable from "@components/dashboard/ScrutinTable";
import {
    BarChart3,
    Clock,
    Calendar,
    CheckCircle,
    Search,
} from "lucide-react";
import toast from "react-hot-toast";
import { candidatesApi } from "@services/api";
import { FadeLoader } from "react-spinners";
import TextInput from "@components/ui/TextInput";

const statusLabel = (status) => {
    if (status === 'ongoing') return 'EN COURS';
    if (['closed', 'completed', 'archived', 'cancelled'].includes(status)) return 'TERMINÉ';
    return 'À VENIR';
};

const STATUS_FILTERS = [
    { value: 'all', label: 'Tous' },
    { value: 'EN COURS', label: 'En cours' },
    { value: 'À VENIR', label: 'À venir' },
    { value: 'TERMINÉ', label: 'Terminés' },
];

export default function Scrutins() {
    const [candidacies, setCandidacies] = useState([]);
    const [loading, setLoading] = useState(true);

    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const res = await candidatesApi.getMine();
                setCandidacies(res.data?.data ?? []);
            } catch {
                toast.error('Impossible de charger vos scrutins.');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const allScrutins = useMemo(() => candidacies
        .filter((c) => c.election)
        .map((c) => ({
            id: c.election.uuid,
            name: c.election.title,
            status: statusLabel(c.election.status),
            rank: c.rank_label ?? '-',

            // Partage de campagne : réservé aux élections publiques, et
            // seulement tant qu'un vote reste possible (inutile de diffuser le
            // lien d'un brouillon ou d'un scrutin déjà clos).
            shareable: c.election.election_mode === 'public'
                && ['published', 'ongoing'].includes(c.election.status),
            candidateUuid: c.uuid,
            candidateName: c.full_name,
        })), [candidacies]);

    const scrutins = useMemo(() => allScrutins
        .filter((s) => statusFilter === 'all' || s.status === statusFilter)
        .filter((s) => !search.trim() || s.name.toLowerCase().includes(search.trim().toLowerCase())),
        [allScrutins, statusFilter, search]);

    const stats = useMemo(() => ({
        total: allScrutins.length,
        ongoing: allScrutins.filter((s) => s.status === 'EN COURS').length,
        upcoming: allScrutins.filter((s) => s.status === 'À VENIR').length,
        finished: allScrutins.filter((s) => s.status === 'TERMINÉ').length,
    }), [allScrutins]);

    if (loading) {
        return (
            <div className="h-[calc(100vh-68px)] flex items-center justify-center">
                <FadeLoader color="#1e40af" cssOverride={{ display: 'block', margin: '0 auto' }} />
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6 bg-gray-100 min-h-screen">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold">Mes scrutins</h1>
                <p className="text-gray-500 text-sm">
                    Suivi de votre participation aux élections
                </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title="Total scrutins" value={stats.total} icon={BarChart3} delay={0} color="bg-indigo-100 text-indigo-600" />
                <StatCard title="En cours" value={stats.ongoing} icon={Clock} color="bg-blue-100 text-blue-600" delay={100} />
                <StatCard title="À venir" value={stats.upcoming} icon={Calendar} color="bg-orange-100 text-orange-600" delay={200} />
                <StatCard title="Terminés" value={stats.finished} icon={CheckCircle} color="bg-green-100 text-green-600" delay={400} />
            </div>

            {/* Recherche + filtre statut */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 max-w-sm">
                    <TextInput
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        iconLeft={Search}
                        placeholder="Rechercher un scrutin..."
                    />
                </div>
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    {STATUS_FILTERS.map((f) => (
                        <button
                            key={f.value}
                            onClick={() => setStatusFilter(f.value)}
                            className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all
                                ${statusFilter === f.value
                                    ? 'bg-[var(--color-primary)] text-white'
                                    : 'bg-gray-100 text-gray-900 hover:bg-gray-200'}`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table */}
            <ScrutinTable data={scrutins} />
        </div>
    );
}

import { useState, useEffect, useMemo } from "react";
import CandidatureTable from "@components/dashboard/CandidatureTable";
import { FileText, Search } from "lucide-react";
import toast from "react-hot-toast";
import { candidatesApi } from "@services/api";
import { FadeLoader } from "react-spinners";
import TextInput from "@components/ui/TextInput";

const STATUS_LABELS = {
    pending: 'EN ATTENTE',
    approved: 'ACCEPTÉ',
    rejected: 'REJETÉ',
};

const STATUS_FILTERS = [
    { value: 'all', label: 'Tous' },
    { value: 'EN ATTENTE', label: 'En attente' },
    { value: 'ACCEPTÉ', label: 'Acceptées' },
    { value: 'REJETÉ', label: 'Rejetées' },
];

export default function Candidatures() {
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
                toast.error('Impossible de charger vos candidatures.');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const candidatures = useMemo(() => candidacies
        .filter((c) => c.election)
        .map((c) => ({
            id: c.uuid,
            election: c.election.title,
            electionUuid: c.election.uuid,
            status: STATUS_LABELS[c.status] ?? 'EN ATTENTE',
        }))
        .filter((c) => statusFilter === 'all' || c.status === statusFilter)
        .filter((c) => !search.trim() || c.election.toLowerCase().includes(search.trim().toLowerCase())),
        [candidacies, statusFilter, search]);

    if (loading) {
        return (
            <div className="h-[calc(100vh-68px)] flex items-center justify-center">
                <FadeLoader color="#1e40af" cssOverride={{ display: 'block', margin: '0 auto' }} />
            </div>
        );
    }

    return (
        <div className="p-6 bg-gray-100 space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="bg-blue-100 text-blue-600 p-3 rounded-lg">
                    <FileText size={20} />
                </div>
                <div>
                    <h1 className="text-2xl font-bold">Mes candidatures</h1>
                    <p className="text-gray-500 text-sm">
                        Suivi de vos demandes de participation aux scrutins
                    </p>
                </div>
            </div>

            {/* Recherche + filtre statut */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 max-w-sm">
                    <TextInput
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        iconLeft={Search}
                        placeholder="Rechercher une élection..."
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
            <CandidatureTable data={candidatures} />
        </div>
    );
}

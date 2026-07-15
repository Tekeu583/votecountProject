import { useState, useEffect, useMemo } from "react";
import StatCard from "@components/dashboard/StatCard";
import ScrutinTable from "@components/dashboard/ScrutinTable";
import {
    BarChart3,
    Clock,
    Calendar,
    CheckCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import { candidatesApi } from "@services/api";
import { FadeLoader } from "react-spinners";

const statusLabel = (status) => {
    if (status === 'ongoing') return 'EN COURS';
    if (['closed', 'completed', 'archived', 'cancelled'].includes(status)) return 'TERMINÉ';
    return 'À VENIR';
};

export default function Scrutins() {
    const [candidacies, setCandidacies] = useState([]);
    const [loading, setLoading] = useState(true);

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

    const scrutins = useMemo(() => candidacies
        .filter((c) => c.election)
        .map((c) => ({
            id: c.election.uuid,
            name: c.election.title,
            status: statusLabel(c.election.status),
            rank: c.rank_label ?? '-',
        })), [candidacies]);

    const stats = useMemo(() => ({
        total: scrutins.length,
        ongoing: scrutins.filter((s) => s.status === 'EN COURS').length,
        upcoming: scrutins.filter((s) => s.status === 'À VENIR').length,
        finished: scrutins.filter((s) => s.status === 'TERMINÉ').length,
    }), [scrutins]);

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

            {/* Table */}
            <ScrutinTable data={scrutins} />
        </div>
    );
}

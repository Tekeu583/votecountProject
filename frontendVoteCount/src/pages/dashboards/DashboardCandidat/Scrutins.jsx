import StatCard from "@components/dashboard/StatCard";
import ScrutinTable from "@components/dashboard/ScrutinTable";
import {
    BarChart3,
    Clock,
    Calendar,
    CheckCircle,
} from "lucide-react";

export default function Scrutins() {
    // Simule API (a remplacer plus tard avec Axios)
    const stats = {
        total: 12,
        ongoing: 4,
        upcoming: 3,
        finished: 5,
    };

    const scrutins = [
        {
            id: 1,
            name: "Élection Présidentielle Universitaire",
            status: "EN COURS",
            rank: "1er",
        },
        {
            id: 2,
            name: "Vote Délégué Faculté",
            status: "TERMINÉ",
            rank: "2e",
        },
        {
            id: 3,
            name: "Élection Club Informatique",
            status: "À VENIR",
            rank: "-",
        },
    ];

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
                <StatCard title="En cours" value={stats.ongoing} icon={Clock}color="bg-blue-100 text-blue-600" delay={100} />
                <StatCard title="À venir" value={stats.upcoming} icon={Calendar} color="bg-orange-100 text-orange-600" delay={200} />
                <StatCard title="Terminés" value={stats.finished} icon={CheckCircle} color="bg-green-100 text-green-600" delay={400} />
            </div>

            {/* Table */}
            <ScrutinTable data={scrutins} />
        </div>
    );
}
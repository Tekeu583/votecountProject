import { useState, useMemo } from "react";
import { Map, User, Percent, Trophy, Star } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import VoteChart from "@components/dashboard/VoteChart";
import RankingTable from "@components/dashboard/RankingTable";
import VoteCenterTable from "@components/dashboard/VoteCenterTable";
import StatCard from "@components/dashboard/StatCard";

const electionsData = [
    {
        id: 1,
        title: "Élection Bureau 2026",

        stats: {
            totalVotes: "14,250",
            percent: "38.5%",
            position: "1er",
            juryScore: "92/100",
        },

        chart: [
            { name: "Vous (A)", value: 38.5 },
            { name: "Candidat B", value: 29.2 },
            { name: "Autres", value: 32.3 },
        ],

        ranking: [
            { id: 1, name: "Muriel", votes: "14,250", percent: 38.5 },
            { id: 2, name: "Audrey", votes: "10,800", percent: 29.2 },
            { id: 3, name: "Gertrude", votes: "7,120", percent: 19.3 },
            { id: 4, name: "Muriel", votes: "14,250", percent: 38.5 },
            { id: 5, name: "Audrey", votes: "10,800", percent: 29.2 },
            { id: 6, name: "Gertrude", votes: "7,120", percent: 19.3 },
        ],

        centers: [
            {
                name: "Centre Ville - Mairie A",
                votes: "1,245",
                percent: 72.4,
                status: "VALIDÉ",
            },
            {
                name: "Quartier Nord - École B",
                votes: "892",
                percent: 45.8,
                status: "EN COURS",
            },
        ],
    },

    {
        id: 2,
        title: "Élection du président du Conseil électoral Administration",

        stats: {
            totalVotes: "8,120",
            percent: "52.1%",
            position: "2e",
            juryScore: "78/100",
        },

        chart: [
            { name: "Vous (A)", value: 52.1 },
            { name: "Candidat B", value: 30 },
            { name: "Autres", value: 17.9 },
        ],

        ranking: [
            { id: 1, name: "Audrey", votes: "9,000", percent: 55 },
            { id: 2, name: "Muriel", votes: "8,120", percent: 52.1 },
            { id: 3, name: "Audrey", votes: "9,000", percent: 55 },
            { id: 4, name: "Muriel", votes: "8,120", percent: 52.1 },
            { id: 5, name: "Audrey", votes: "9,000", percent: 55 },
            { id: 6, name: "Muriel", votes: "8,120", percent: 52.1 },
        ],

        centers: [
            {
                name: "Centre Ville - Mairie A",
                votes: "1,245",
                percent: 72.4,
                status: "VALIDÉ",
            },
            {
                name: "Quartier Nord - École B",
                votes: "892",
                percent: 45.8,
                status: "EN COURS",
            },
        ],
    },
    {
        id: 3,
        title: "Conseil electoral Administration",

        stats: {
            totalVotes: "9,120",
            percent: "55.1%",
            position: "3e",
            juryScore: "80/100",
        },

        chart: [
            { name: "Vous (A)", value: 60.1 },
            { name: "Candidat B", value: 30 },
            { name: "Autres", value: 17.9 },
        ],

        ranking: [
            { id: 1, name: "Audrey", votes: "9,000", percent: 55 },
            { id: 2, name: "Muriel", votes: "8,120", percent: 52.1 },
            { id: 3, name: "tekeu", votes: "9,000", percent: 55 },
            { id: 4, name: "tonny", votes: "8,120", percent: 52.1 },
            { id: 5, name: "leo", votes: "9,000", percent: 55 },
            { id: 6, name: "Muriel", votes: "8,120", percent: 52.1 },
        ],

        centers: [],
    },
    {
        id: 4,
        title: "election du bureau Administration",

        stats: {
            totalVotes: "120",
            percent: "40.1%",
            position: "4e",
            juryScore: "50/100",
        },

        chart: [
            { name: "Vous (A)", value: 52.1 },
            { name: "Candidat B", value: 30 },
            { name: "Autres", value: 17.9 },
        ],

        ranking: [
            { id: 1, name: "Audrey", votes: "9,000", percent: 55 },
            { id: 2, name: "Muriel", votes: "8,120", percent: 52.1 },
            { id: 3, name: "Audrey", votes: "9,000", percent: 55 },
            { id: 4, name: "Muriel", votes: "8,120", percent: 52.1 },
            { id: 5, name: "Audrey", votes: "9,000", percent: 55 },
            { id: 6, name: "Muriel", votes: "8,120", percent: 52.1 },
        ],

        centers: [
            {
                name: "Centre Ville - Mairie A",
                votes: "1,245",
                percent: 72.4,
                status: "VALIDÉ",
            },
            {
                name: "Quartier Nord - École B",
                votes: "892",
                percent: 45.8,
                status: "EN COURS",
            },
        ],
    },
];
export default function Resultats() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [selectedId, setSelectedId] = useState(id ? Number(id) : electionsData[0].id);

    const selectedElection = useMemo(() => {
        return electionsData.find(e => e.id === selectedId);
    }, [selectedId]);

    if (!selectedElection) return <p>Chargement...</p>;

    return (
        <main className="p-4 space-y-6">

            {/* HEADER */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between ">

                <div>
                    <h1 className="text-2xl font-bold">Résultats</h1>
                    <p className="text-gray-500 text-sm">
                        {selectedElection.title}
                    </p>
                </div>

                {/* FILTRE */}
                <select
                    value={selectedId}
                    onChange={(e) => setSelectedId(Number(e.target.value))}
                    className="px-4 py-2 border border-[var(--color-gray-light)] rounded-md truncate focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent text-sm"
                >
                    {electionsData.map(e => (
                        <option className="truncate" key={e.id} value={e.id}>
                            {e.title}
                        </option>
                    ))}
                </select>

                <button
                    onClick={() => navigate(`/candidat/results/${selectedId}/centers`)}
                    className="btn-primary flex gap-2 items-center">
                    <Map size={18} />
                    Détails
                </button>
            </div>

            {/* STATS */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard icon={User} title="Total des voix" value={selectedElection.stats.totalVotes} color="bg-blue-50" delay={0} />
                <StatCard icon={Percent} title="Pourcentage global %" value={selectedElection.stats.percent} color="bg-indigo-50" delay={100} />
                <StatCard icon={Trophy} title="Position actuelle" value={selectedElection.stats.position} color="bg-blue-50" delay={200} />
                <StatCard icon={Star} title="Score Jury" value={selectedElection.stats.juryScore} color="bg-purple-50" delay={300} />
            </div>

            {/* CONTENT */}
            <div className="grid lg:grid-cols-3 gap-4">
                <VoteChart data={selectedElection.chart} />
                <div className="lg:col-span-2">
                    <RankingTable data={selectedElection.ranking} />
                </div>
            </div>

            <VoteCenterTable data={selectedElection.centers} />
        </main>
    );
}

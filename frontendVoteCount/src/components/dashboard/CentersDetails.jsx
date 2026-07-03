import { useParams } from "react-router-dom";
import { useState, useMemo } from "react";
import {
    Search,
    ChevronLeft,
    ChevronRight,
    MapPin,
    CheckCircle,
    Clock,
    ChevronDown,
    RefreshCcw
} from "lucide-react";

import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
    Legend
} from "recharts";

import TextInput from "../ui/TextInput";

export default function CentersDetails() {
    const { id } = useParams();

    // ================= CONFIG =================
    const TOP_LIMIT = 5;
    const COLORS = ["#2563EB", "#7C3AED", "#059669", "#F59E0B", "#DC2626", "#94A3B8"];

    // ================= DATA =================
    const centersData = useMemo(() => [
        {
            id: 1,
            name: "Mairie Douala 1",
            status: "VALIDÉ",
            totalVotes: 1245,
            participation: 72,
            results: [
                { name: "Vous", votes: 600 },
                { name: "Candidat B", votes: 400 },
                { name: "Candidat C", votes: 245 },
                { name: "Candidat D", votes: 100 },
                { name: "Candidat E", votes: 80 },
                { name: "Candidat F", votes: 50 },
            ]
        },
        {
            id: 2,
            name: "Lycée Akwa",
            status: "EN COURS",
            totalVotes: 892,
            participation: 45,
            results: [
                { name: "Vous", votes: 300 },
                { name: "Candidat B", votes: 400 },
                { name: "Candidat C", votes: 192 },
                { name: "Candidat D", votes: 120 },
                { name: "Candidat E", votes: 60 },
            ]
        }
    ], []);

    // ================= STATE =================
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [page, setPage] = useState(1);
    const [openRow, setOpenRow] = useState(null);
    const perPage = 5;
    const computeWinner = (results) =>
        results.reduce((a, b) => (a.votes > b.votes ? a : b));

    const filteredData = useMemo(() => {
        return centersData.filter((c) => {
            const matchSearch = c.name.toLowerCase().includes(search.toLowerCase());
            const matchStatus = statusFilter === "ALL" || c.status === statusFilter;
            return matchSearch && matchStatus;
        });
    }, [search, statusFilter, centersData]);


    const totalPages = Math.ceil(filteredData.length / perPage);

    const paginated = useMemo(() => {
        const start = (page - 1) * perPage;
        return filteredData.slice(start, start + perPage);
    }, [filteredData, page]);

    const aggregatedCandidates = useMemo(() => {
        const map = {};

        filteredData.forEach(center => {
            center.results.forEach(r => {
                if (!map[r.name]) map[r.name] = 0;
                map[r.name] += r.votes;
            });
        });

        return Object.entries(map)
            .map(([name, votes]) => ({ name, votes }))
            .sort((a, b) => b.votes - a.votes);

    }, [filteredData]);

    const topCandidates = useMemo(() => {
        if (aggregatedCandidates.length <= TOP_LIMIT) return aggregatedCandidates;

        const top = aggregatedCandidates.slice(0, TOP_LIMIT);

        const othersVotes = aggregatedCandidates
            .slice(TOP_LIMIT)
            .reduce((sum, c) => sum + c.votes, 0);

        return [
            ...top,
            { name: "Autres", votes: othersVotes }
        ];
    }, [aggregatedCandidates]);

    const chartData = useMemo(() => {
        return filteredData.map(center => {
            const obj = { name: center.name };

            topCandidates.forEach(tc => {
                if (tc.name === "Autres") {
                    const othersVotes = center.results
                        .filter(r => !topCandidates.some(t => t.name === r.name))
                        .reduce((sum, r) => sum + r.votes, 0);

                    obj["Autres"] = othersVotes;
                } else {
                    const found = center.results.find(r => r.name === tc.name);
                    obj[tc.name] = found ? found.votes : 0;
                }
            });

            return obj;
        });
    }, [filteredData, topCandidates]);

    return (
        <main className="p-4 md:p-6 space-y-6">

            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <MapPin className="text-blue-600" />
                        Analyse des centres
                    </h1>
                    <p className="text-gray-500 text-sm">
                        Élection #{id}
                    </p>
                </div>
            </div>

            {/* FILTERS */}
            <div className="bg-white p-4 rounded-xl shadow flex flex-col md:flex-row gap-4">

                <TextInput
                    placeholder="Rechercher un centre..."
                    value={search}
                    onChange={(e) => {
                        setSearch(e.target.value);
                        setPage(1);
                    }}
                    iconLeft={Search}
                />

                <select
                    value={statusFilter}
                    onChange={(e) => {
                        setStatusFilter(e.target.value);
                        setPage(1);
                    }}
                    className="px-4 py-2 border rounded-md"
                >
                    <option value="ALL">Tous</option>
                    <option value="VALIDÉ">Validé</option>
                    <option value="EN COURS">En cours</option>
                </select>

                <button
                    onClick={() => {
                        setSearch("");
                        setStatusFilter("ALL");
                        setPage(1);
                    }}
                    className="btn-secondary flex items-center gap-2"
                >
                    <RefreshCcw size={16} />
                    Reset
                </button>
            </div>

            {/* CHART */}
            <div className="bg-white p-5 rounded-xl shadow">
                <h3 className="font-semibold mb-4">
                    Top candidats (auto) + Others
                </h3>

                <div className="w-full h-72">
                    <ResponsiveContainer>
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" hide />
                            <YAxis />
                            <Tooltip />
                            <Legend />

                            {topCandidates.map((c, index) => (
                                <Bar
                                    key={c.name}
                                    dataKey={c.name}
                                    stackId="a"
                                    fill={COLORS[index % COLORS.length]}
                                />
                            ))}
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* TABLE */}
            <div className="bg-white rounded-xl shadow overflow-hidden">

                <div className="p-4">
                    <h3 className="font-semibold">Centres</h3>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-[700px] w-full text-sm">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left">Centre</th>
                                <th className="px-4 py-3 text-center">Votes</th>
                                <th className="px-4 py-3">Participation</th>
                                <th className="px-4 py-3 text-center">Gagnant</th>
                                <th className="px-4 py-3">Statut</th>
                                <th></th>
                            </tr>
                        </thead>

                        <tbody>
                            {paginated.map((c) => {
                                const winner = computeWinner(c.results);

                                return (
                                    <>
                                        <tr key={c.id} className="border-t hover:bg-gray-50">
                                            <td className="px-4 py-3 font-medium">{c.name}</td>
                                            <td className="px-4 py-3 text-center">{c.totalVotes}</td>

                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-full h-2 bg-gray-200 rounded">
                                                        <div
                                                            className="h-full bg-blue-600"
                                                            style={{ width: `${c.participation}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-xs">
                                                        {c.participation}%
                                                    </span>
                                                </div>
                                            </td>

                                            <td className="text-blue-600 font-semibold text-center">
                                                {winner.name}
                                            </td>

                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-1 rounded text-xs flex items-center gap-1
                                                    ${c.status === "VALIDÉ"
                                                        ? "bg-green-100 text-green-600"
                                                        : "bg-orange-100 text-orange-600"
                                                    }`}>
                                                    {c.status === "VALIDÉ"
                                                        ? <CheckCircle size={14} />
                                                        : <Clock size={14} />}
                                                    {c.status}
                                                </span>
                                            </td>

                                            <td>
                                                <button onClick={() =>
                                                    setOpenRow(openRow === c.id ? null : c.id)
                                                }>
                                                    <ChevronDown className={`${openRow === c.id ? "rotate-180" : ""}`} />
                                                </button>
                                            </td>
                                        </tr>

                                        {/* EXPANSION */}
                                        {openRow === c.id && (
                                            <tr className="bg-gray-50">
                                                <td colSpan="6" className="p-4">
                                                    {c.results.map((r, i) => {
                                                        const percent = Math.round((r.votes / c.totalVotes) * 100);

                                                        return (
                                                            <div key={i} className="mb-2">
                                                                <div className="flex justify-between text-sm">
                                                                    <span>{r.name}</span>
                                                                    <span>{percent}%</span>
                                                                </div>

                                                                <div className="w-full h-2 bg-gray-200 rounded">
                                                                    <div
                                                                        className="h-full bg-blue-600"
                                                                        style={{ width: `${percent}%` }}
                                                                    />
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </td>
                                            </tr>
                                        )}
                                    </>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* PAGINATION */}
                <div className="flex justify-between items-center p-4 text-sm">
                    <span>
                        {(page - 1) * perPage + 1} -{" "}
                        {Math.min(page * perPage, filteredData.length)} /{" "}
                        {filteredData.length}
                    </span>

                    <div className="flex gap-2">
                        <button onClick={() => setPage(p => p - 1)} disabled={page === 1}>
                            <ChevronLeft size={16} />
                        </button>

                        <span className="px-3 py-1 bg-blue-600 text-white rounded">
                            {page}/{totalPages || 1}
                        </span>

                        <button onClick={() => setPage(p => p + 1)} disabled={page === totalPages}>
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            </div>
        </main>
    );
}
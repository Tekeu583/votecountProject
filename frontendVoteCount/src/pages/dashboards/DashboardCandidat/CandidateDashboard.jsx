import { useMemo } from 'react';
import {
    User, Trophy, Percent, Star, Bell, Download, RefreshCcw, ChevronDown
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import StatCard from '@components/dashboard/StatCard';
import { useAuth } from '@hooks/useAuth';


const CandidateDashboard = () => {
    const {user}= useAuth();

    const results = useMemo(() => [
        { rank: 1, name: "Gertrude", votes: "15,200", share: "22%", prog: "75%", color: "text-yellow-600 bg-yellow-50" },
        { rank: 2, name: "Muriel", votes: "12,450", share: "18.5%", prog: "60%", self: true },
        { rank: 3, name: "Audrey", votes: "9,800", share: "14%", prog: "45%" },
        { rank: 4, name: "Gertrude", votes: "15,200", share: "22%", prog: "75%", color: "text-yellow-600 bg-yellow-50" },
        { rank: 5, name: "Muriel", votes: "12,450", share: "18.5%", prog: "60%", self: true },
        { rank: 6, name: "Audrey", votes: "9,800", share: "14%", prog: "45%" },
        { rank: 7, name: "Gertrude", votes: "15,200", share: "22%", prog: "75%", color: "text-yellow-600 bg-yellow-50" },
        { rank: 8, name: "Muriel", votes: "12,450", share: "18.5%", prog: "60%", self: true },
        { rank: 9, name: "Audrey", votes: "9,800", share: "14%", prog: "45%" },
    ], []);
    return (
        <main className="flex-1 md:px-2 lg:px-2 bg-[var(--color-background-white)]">

            {/* HEADER */}
            <header className="flex flex-col lg:flex-row lg:items-center gap-4 justify-between items-center mb-8">
                <div className='p-1'>
                    <h2 className="text-2xl font-bold text-gray-800 capitalize ">Bienvenue, {user.name} </h2>
                    <div className="flex gap-6 mt-4 border-b border-gray-200">
                        <button className="text-blue-600 border-b-2 border-blue-600 pb-2 font-medium text-sm">Tableau de bord</button>
                        <NavLink to="/candidat/results" className="text-gray-500 pb-2 font-medium text-sm">Résultats détaillés</NavLink>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <span className="bg-green-100 text-green-600 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span> EN DIRECT
                    </span>
                    <button className="p-2 bg-white border rounded-full text-gray-400 hover:bg-gray-50">
                        <Bell size={20} />
                    </button>
                </div>
            </header>

            {/* STATS GRID */}
            <div className="grid grid-cols-1  sm:grid-cols-2 xl:grid-cols-4  gap-4 mb-8">
                <StatCard icon={User} title="Votes reçus" value="12,450" trend="+12% vs hier" color="bg-blue-50" delay={0} />
                <StatCard icon={Trophy} title="Classement actuel" value="2ème" trend="Sur 15 candidats" color="bg-indigo-50" delay={100} />
                <StatCard icon={Percent} title="Pourcentage total" value="18.5%" trend="Barre de progression" color="bg-blue-50" delay={200} />
                <StatCard icon={Star} title="Score Jury" value="88/100" trend="Mise à jour: il y a 2h" color="bg-purple-50" delay={300} />
            </div>

            {/* RANKING TABLE */}
            <section className="bg-[--color-white] rounded-xl shadow-sm border border-gray-100 mb-8 overflow-hidden">
                <div className="p-4 md:p-6 border-b border-gray-50 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <h3 className="font-bold text-sm sm:text-base md:text-lg text-[var(--color-dark)]">Classement général en temps réel du top 10</h3>
                    <div className="flex flex-wrap gap-2 md:flex-nowrap w-full md:w-auto">
                        <button className="flex justify-center btn-secondary gap-2 md:px-4 md:text-sm ">
                            <Download size={16} /> Exporter PDF
                        </button>
                        <button className="flex justify-center btn-primary gap-2 md:px-4 md:text-sm ">
                            <RefreshCcw size={16} /> Actualiser
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-[500px] w-full text-left">
                        <thead>
                            <tr className="text-[var(--color-dark)] bg-[var(--color-gray-light)] text-xs border-b border-b-[var(--color-gray-light)] uppercase tracking-wider">
                                <th className="p-2 font-semibold">Rang</th>
                                <th className="p-2 font-semibold">Candidat</th>
                                <th className="p-2 font-semibold">Votes</th>
                                <th className="p-2 font-semibold">Part de voix</th>
                                <th className="p-2 font-semibold">Progression</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--color-gray-light)]">
                            {results.map((row, i) => (
                                <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="p-1 text-xs md:text-sm">
                                        <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold ${row.color || 'bg-gray-100 text-gray-600'}`}>
                                            {row.rank}
                                        </span>
                                    </td>
                                    <td className="p-1 text-xs md:text-sm">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-[var(--color-gray-light)]"></div>
                                            <span className="font-semibold text-sm text-[var(--color-dark)]">{row.name}</span>
                                            {row.self && <span className="bg-[var(--color-primary)] text-[var(--color-white)] text-[10px] px-2 py-0.5 rounded-full uppercase font-bold">vous</span>}
                                        </div>
                                    </td>
                                    <td className="p-1 text-xs md:text-sm font-bold text-sm text-[var(--color-primary)]">{row.votes}</td>
                                    <td className="p-1 text-xs md:text-sm">
                                        <span className="bg-blue-50 text-[var(--color-primary)] px-3 py-1 rounded-full text-xs font-bold">{row.share}</span>
                                    </td>
                                    <td className="p-1 text-xs md:text-sm">
                                        <div className="w-full max-w-[120px] h-2 bg-gray-100 rounded-full overflow-hidden">
                                            <div className="bg-[var(--color-primary)] h-full" style={{ width: row.prog }}></div>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <button className="w-full py-4  text-center text-[var(--color-primary)] text-sm font-medium hover:bg-gray-50 flex  flex-wrap items-center justify-center gap-2 border-t border-gray-50">
                    Voir tous les candidats <ChevronDown size={16} />
                </button>
            </section>

        </main>
    );
};

export default CandidateDashboard;
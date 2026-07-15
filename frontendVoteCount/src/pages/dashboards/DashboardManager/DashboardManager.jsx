import { useState, useEffect } from 'react';
import { Vote, Users, Clock, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import StatCard from '@components/dashboard/StatCard';
import { staffApi, candidatesApi } from '@services/api';
import { FadeLoader } from 'react-spinners';

const MAX_ELECTIONS_FETCHED = 20;

const statusLabel = (status) => {
    if (status === 'ongoing') return 'En cours';
    if (['closed', 'completed', 'archived', 'cancelled'].includes(status)) return 'Terminé';
    return 'En attente';
};

const STATUS_STYLES = {
    'En cours': 'bg-blue-100 text-blue-700',
    'En attente': 'bg-gray-100 text-gray-600',
    'Terminé': 'bg-emerald-100 text-emerald-700',
};

const DashboardManager = () => {
    const navigate = useNavigate();
    const [elections, setElections] = useState([]);
    const [pendingByElection, setPendingByElection] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const res = await staffApi.getMyElections();
                const myElections = res.data?.data ?? [];
                setElections(myElections);

                const targets = myElections.slice(0, MAX_ELECTIONS_FETCHED);
                const results = await Promise.all(
                    targets.map((election) =>
                        candidatesApi.getAll(election.uuid, { status: 'pending' })
                            .then((r) => [election.uuid, r.data?.meta?.total ?? (r.data?.data ?? []).length])
                            .catch(() => [election.uuid, 0])
                    )
                );
                setPendingByElection(Object.fromEntries(results));
            } catch {
                toast.error('Impossible de charger votre tableau de bord.');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const totalPending = Object.values(pendingByElection).reduce((sum, n) => sum + n, 0);
    const ongoingCount = elections.filter((e) => e.status === 'ongoing').length;

    if (loading) {
        return (
            <div className="h-[calc(100vh-68px)] flex items-center justify-center">
                <FadeLoader color="#1e40af" cssOverride={{ display: 'block', margin: '0 auto' }} />
            </div>
        );
    }

    return (
        <div className="flex-1 bg-[var(--color-background-white)] p-4">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8 lg:mb-10">
                    <h1 className="text-2xl lg:text-3xl font-bold text-[var(--color-dark)]">Tableau de bord Gestionnaire</h1>
                    <p className="text-gray-600 mt-1">Scrutins dont vous assurez la gestion.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6 mb-8 lg:mb-10">
                    <StatCard icon={Vote} title="SCRUTINS GÉRÉS" value={elections.length} />
                    <StatCard icon={Clock} title="EN COURS" value={ongoingCount} borderColor="[var(--color-primary)]" delay={150} />
                    <StatCard icon={Users} title="CANDIDATS EN ATTENTE" value={totalPending} borderColor="[var(--color-warning)]" delay={250} />
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[700px]">
                            <thead className="bg-gray-50 border-b border-b-[var(--color-gray-light)]">
                                <tr className="text-xs uppercase text-[var(--color-dark)]">
                                    <th className="text-left px-3 py-2 font-medium">SCRUTIN</th>
                                    <th className="text-left px-3 py-2 font-medium">STATUT</th>
                                    <th className="text-center px-3 py-2 font-medium">CANDIDATS EN ATTENTE</th>
                                    <th className="text-right px-3 py-2 font-medium">ACTION</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--color-gray-light)]">
                                {elections.map((election) => (
                                    <tr key={election.uuid} className="hover:bg-[var(--color-gray-light)] transition-colors">
                                        <td className="px-3 py-2 font-medium text-gray-900">{election.title}</td>
                                        <td className="px-3 py-2">
                                            <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${STATUS_STYLES[statusLabel(election.status)]}`}>
                                                {statusLabel(election.status)}
                                            </span>
                                        </td>
                                        <td className="px-3 py-2 text-center">{pendingByElection[election.uuid] ?? 0}</td>
                                        <td className="px-3 py-2 text-right">
                                            <button
                                                onClick={() => navigate(`/manager/candidats/${election.uuid}`)}
                                                className="btn-secondary text-sm font-medium inline-flex items-center gap-2"
                                            >
                                                <Eye size={16} /> Gérer
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {elections.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="text-center py-10 text-gray-500">
                                            Aucun scrutin géré pour le moment.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardManager;

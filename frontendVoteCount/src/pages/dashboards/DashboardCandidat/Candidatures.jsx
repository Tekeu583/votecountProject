import { useState, useEffect, useMemo } from "react";
import CandidatureTable from "@components/dashboard/CandidatureTable";
import { FileText } from "lucide-react";
import toast from "react-hot-toast";
import { candidatesApi } from "@services/api";
import { FadeLoader } from "react-spinners";

const STATUS_LABELS = {
    pending: 'EN ATTENTE',
    approved: 'ACCEPTÉ',
    rejected: 'REJETÉ',
};

export default function Candidatures() {
    const [candidacies, setCandidacies] = useState([]);
    const [loading, setLoading] = useState(true);

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
        })), [candidacies]);

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

            {/* Table */}
            <CandidatureTable data={candidatures} />
        </div>
    );
}

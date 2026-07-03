import CandidatureTable from "@components/dashboard/CandidatureTable";
import { FileText } from "lucide-react";

export default function Candidatures() {
    // 👉 Simule API (remplacer avec Axios)
    const candidatures = [
        {
            id: 1,
            election: "Élection Présidentielle Universitaire",
            status: "ACCEPTÉ",
        },
        {
            id: 2,
            election: "Vote Délégué Faculté",
            status: "EN ATTENTE",
        },
        {
            id: 3,
            election: "Élection Club Informatique",
            status: "REJETÉ",
        },
        {
            id: 4,
            election: "Élection Association Étudiante",
            status: "BLOQUÉ",
        },
    ];

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
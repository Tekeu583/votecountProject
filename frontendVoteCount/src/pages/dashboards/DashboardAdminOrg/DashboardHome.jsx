import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { FadeLoader } from "react-spinners";
import StatCard from "@/components/dashboard/StatCard";
import ScrutinsTable from "@/components/dashboard/ScrutinsTable";
import TopCandidates from "@/components/dashboard/TopCandidates";
import ProgressCard from "@/components/dashboard/ProgressCard";
import ActivityFeed from "@/components/dashboard/ActivityFeed";
import { useOrg } from "@hooks/useOrg";
import { analyticsApi, electionsApi, resultsApi } from "@services/api";

import {
  BarChart3,
  Vote,
  Percent,
  BadgeDollarSign,
} from "lucide-react";

export default function DashboardHome() {
  const { org } = useOrg();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [elections, setElections] = useState([]);
  const [topCandidates, setTopCandidates] = useState([]);

  useEffect(() => {
    if (!org?.uuid) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const [statsRes, electionsRes] = await Promise.all([
          analyticsApi.dashboard({ organization_uuid: org.uuid }),
          electionsApi.getAll({ organization_uuid: org.uuid, per_page: 6 }),
        ]);
        setStats(statsRes.data?.data ?? null);
        const electionsList = electionsRes.data?.data ?? [];
        setElections(electionsList);

        // "Top candidats" : pas d'agrégat dédié côté backend — on prend les
        // résultats de la dernière élection clôturée de l'organisation.
        const lastClosed = electionsList.find((e) => ['closed', 'completed'].includes(e.status));
        if (lastClosed) {
          try {
            const [finalRes, electionDetailRes] = await Promise.all([
              resultsApi.final(lastClosed.uuid),
              electionsApi.get(lastClosed.uuid),
            ]);
            const results = finalRes.data?.data?.results ?? [];
            const candidatesByUuid = Object.fromEntries(
              (electionDetailRes.data?.data?.candidates ?? []).map((c) => [c.uuid, c])
            );
            setTopCandidates(
              results
                .slice()
                .sort((a, b) => (b.percentage ?? 0) - (a.percentage ?? 0))
                .slice(0, 3)
                .map((r) => ({
                  uuid: r.candidate_uuid,
                  name: candidatesByUuid[r.candidate_uuid]?.full_name ?? '—',
                  percentage: Math.round(r.percentage ?? 0),
                }))
            );
          } catch {
            setTopCandidates([]);
          }
        } else {
          setTopCandidates([]);
        }
      } catch {
        toast.error('Erreur de chargement du tableau de bord');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [org?.uuid]);

  if (loading) {
    return (
      <div className="h-[calc(100vh-68px)] flex items-center justify-center">
        <FadeLoader color="#1e40af" cssOverride={{ display: 'block', margin: '0 auto' }} />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-2 bg-[var(--color-background-white)]">

      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Vue Globale
        </h1>
      </div>

      {/* STATS */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">

        <StatCard
          title="Scrutins Actifs"
          value={stats?.active_elections ?? 0}
          icon={Vote}
          delay={0}
        />

        <StatCard
          title="Votes Totaux"
          value={stats?.total_votes ?? 0}
          icon={BarChart3}
          delay={100}
        />

        <StatCard
          title="Taux de Participation"
          value={`${stats?.participation_rate ?? 0}%`}
          icon={Percent}
          delay={200}
        />

        <StatCard
          title="Revenus"
          value={`${Number(stats?.total_revenue ?? 0).toLocaleString('fr-FR')} XAF`}
          icon={BadgeDollarSign}
          delay={300}
        />

      </div>

      {/* MAIN GRID */}
      <div className="grid gap-6 xl:grid-cols-3">

        {/* TABLE */}
        <div className="xl:col-span-2 overflow-x-auto">
          <ScrutinsTable elections={elections} />
        </div>

        {/* RIGHT */}
        <div className="xl:col-span-1">
          <TopCandidates candidates={topCandidates} />
        </div>
      </div>

      {/* BOTTOM */}
      <div className="grid gap-6 xl:grid-cols-2">
        <ProgressCard electionsByStatus={stats?.elections_by_status} />
        <ActivityFeed activities={stats?.recent_activity} />
      </div>

    </div>
  );
}

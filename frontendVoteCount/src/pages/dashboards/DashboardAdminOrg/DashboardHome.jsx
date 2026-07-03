import StatCard from "@/components/dashboard/StatCard";
import ScrutinsTable from "@/components/dashboard/ScrutinsTable";
import TopCandidates from "@/components/dashboard/TopCandidates";
import ProgressCard from "@/components/dashboard/ProgressCard";
import ActivityFeed from "@/components/dashboard/ActivityFeed";

import {
  BarChart3,
  Vote,
  Percent,
  Euro,
} from "lucide-react";

export default function DashboardHome() {
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
          value="12"
          icon={Vote}
          trend="+2 ce mois"
          delay={0}
        />

        <StatCard
          title="Votes Totaux"
          value="4,852"
          icon={BarChart3}
          trend="+12%"
          delay={100}
        />

        <StatCard
          title="Taux de Participation"
          value="78.4%"
          icon={Percent}
          delay={200}
        />

        <StatCard
          title="Revenus Mensuels"
          value="485 200 CFA"
          icon={Euro}
          delay={300}
        />

      </div>

      {/* MAIN GRID */}
      <div className="grid gap-6 xl:grid-cols-3">

        {/* TABLE */}
        <div className="xl:col-span-2 overflow-x-auto">
          <ScrutinsTable />
        </div>

        {/* RIGHT */}
        <div className="xl:col-span-1">
          <TopCandidates />
        </div>
      </div>

      {/* BOTTOM */}
      <div className="grid gap-6 xl:grid-cols-2">
        <ProgressCard />
        <ActivityFeed />
      </div>

    </div>
  );
}
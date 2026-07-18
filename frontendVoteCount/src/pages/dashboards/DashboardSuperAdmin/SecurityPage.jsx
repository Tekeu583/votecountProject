import { useState, useEffect, useCallback } from "react";
import {
  AlertTriangle,
  ShieldCheck,
  CheckCircle,
  Search,
} from "lucide-react";
import toast from 'react-hot-toast';

import SecurityModal from "./SecurityModal";
import TextInput from "@components/ui/TextInput";
import { securityApi } from "@services/api";
import { useDebounce } from '@hooks/useDebounce';

const badgeColor = (severity) => {
  switch (severity) {
    case "critical":
      return "bg-red-100 text-red-600";
    case "high":
      return "bg-orange-100 text-orange-600";
    case "medium":
      return "bg-yellow-100 text-yellow-600";
    default:
      return "bg-blue-100 text-blue-600";
  }
};

const timeAgo = (iso) => {
  if (!iso) return '—';
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "à l'instant";
  if (minutes < 60) return `il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `il y a ${hours}h`;
  return `il y a ${Math.floor(hours / 24)}j`;
};

export default function SecurityPage() {
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search);
  const [severityFilter, setSeverityFilter] = useState('all');
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ total: 0, unresolved: 0, critical: 0, high: 0 });

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await securityApi.getAlerts({
        per_page: 10,
        resolved: false,
        ...(debouncedSearch ? { search: debouncedSearch } : {}),
        ...(severityFilter !== 'all' ? { severity: severityFilter } : {}),
      });
      setAlerts(res.data?.data ?? []);
    } catch (error) {
      toast.error(error.response?.data?.message ?? 'Impossible de charger les alertes de sécurité');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, severityFilter]);

  const fetchStats = useCallback(() => {
    securityApi.getStats()
      .then(res => setStats(res.data?.data ?? stats))
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { fetchAlerts(); }, [fetchAlerts]);
  useEffect(() => { fetchStats(); }, [fetchStats]);

  const openModal = (item) => setSelected(item);
  const closeModal = () => setSelected(null);

  const riskLevel = stats.critical > 0 ? 'Critique' : (stats.high > 0 ? 'Élevé' : 'Faible');

  return (
    <div className="p-2 space-y-6">

      {/* HEADER */}
      <div className="grid md:grid-cols-2 gap-4 items-center">
        <h1 className="text-xl font-semibold">
          Alertes de sécurité
        </h1>

        <div className="flex items-center gap-3">
          <div className="relative">
            <TextInput
              type="text"
              placeholder="Rechercher ip, evenement..."
              iconLeft={Search}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="input"
          >
            <option value="all">Toutes sévérités</option>
            <option value="critical">Critique</option>
            <option value="high">Élevée</option>
            <option value="medium">Moyenne</option>
            <option value="low">Faible</option>
          </select>
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        <div className="bg-white p-4 rounded-[var(--radius-md)] shadow flex justify-between">
          <div>
            <p className="text-sm text-[var(--color-gray)]">Alertes non résolues</p>
            <p className="text-2xl font-bold">{stats.unresolved}</p>
          </div>
          <AlertTriangle className="text-red-500" />
        </div>

        <div className="bg-white p-4 rounded-[var(--radius-md)] shadow flex justify-between">
          <div>
            <p className="text-sm text-[var(--color-gray)]">Niveau de risque</p>
            <p className="text-2xl font-bold text-[var(--color-danger)]">{riskLevel}</p>
          </div>
          <ShieldCheck className="text-[var(--color-danger)]" />
        </div>

        <div className="bg-white p-4 rounded-[var(--radius-md)] shadow flex justify-between">
          <div>
            <p className="text-sm text-[var(--color-gray)]">Total des alertes</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </div>
          <ShieldCheck className="text-green-500" />
        </div>

      </div>

      {/* CONTENT */}
      <div>
        <h2 className="font-semibold mb-4">Incidents non résolus</h2>

        <div className="space-y-4">
          {loading && <p className="text-sm text-[var(--color-gray)]">Chargement...</p>}
          {!loading && alerts.length === 0 && (
            <p className="text-sm text-[var(--color-gray)]">Aucune alerte de sécurité non résolue.</p>
          )}
          {!loading && alerts.map((item) => (
            <div
              key={item.uuid}
              className="bg-white p-4 rounded-[var(--radius-md)] shadow flex justify-between items-center"
            >
              <div>
                <p className="font-medium">{item.type}</p>
                <p className="text-sm text-[var(--color-gray)]">
                  Source : {item.ip_address ?? '—'} • {item.election?.title ?? 'Élection inconnue'}
                </p>
              </div>

              <div className="text-right">
                <span className={`text-xs px-2 py-1 rounded ${badgeColor(item.severity)}`}>
                  {item.severity_label}
                </span>

                <p className="text-xs text-[var(--color-gray)] mt-1">{timeAgo(item.created_at)}</p>

                <button
                  onClick={() => openModal(item)}
                  className="text-blue-600 text-sm mt-1 hover:underline flex items-center gap-1 justify-end w-full"
                >
                  <CheckCircle size={14} />
                  Analyser
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MODAL */}
      {selected && (
        <SecurityModal
          data={selected}
          onClose={closeModal}
          onResolved={() => { fetchAlerts(); fetchStats(); }}
        />
      )}
    </div>
  );
}

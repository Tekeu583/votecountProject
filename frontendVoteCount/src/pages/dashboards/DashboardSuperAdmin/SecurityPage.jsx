import { useState } from "react";
import {
  AlertTriangle,
  ShieldCheck,
  Ban,
  Search,
} from "lucide-react";

import SecurityModal from "./SecurityModal";
import TextInput from "@components/ui/TextInput";

const incidentsMock = [
  {
    id: 1,
    title: "Tentative Brute Force - SSH",
    source: "192.168.1.45",
    target: "Serveur Prod-01",
    time: "il y a 3 min",
    level: "critique",
  },
  {
    id: 2,
    title: "Scan de Ports Suspect",
    source: "45.78.112.9",
    target: "Russie",
    time: "il y a 12 min",
    level: "moyen",
  },
  {
    id: 3,
    title: "Connexion inhabituelle Admin",
    source: "jdupont",
    target: "Appareil inconnu",
    time: "il y a 45 min",
    level: "info",
  },
];

export default function SecurityPage() {
  const [selected, setSelected] = useState(null);

  const openModal = (item) => setSelected(item);
  const closeModal = () => setSelected(null);

  const badgeColor = (level) => {
    switch (level) {
      case "critique":
        return "bg-red-100 text-red-600";
      case "moyen":
        return "bg-yellow-100 text-yellow-600";
      default:
        return "bg-blue-100 text-blue-600";
    }
  };

  return (
    <div className="p-2 space-y-6">

      {/* HEADER */}
      <div className="flex justify-between items-center grid md:grid-cols-2 gap-4">
        <h1 className="text-xl font-semibold">
          Alertes de sécurité
          <span className="ml-2 text-xs bg-[var(--color-danger)] text-white px-2 py-1 rounded-xl">
            LIVE
          </span>
        </h1>

        <div className="flex items-center gap-3">
          <div className="relative">
            <TextInput
              type="text"
              placeholder="Rechercher ip, evenement..."
              iconLeft={Search}
            />
          </div>
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        <div className="bg-white p-4 rounded-[var(--radius-md)] shadow flex justify-between">
          <div>
            <p className="text-sm text-[var(--color-gray)]">Alertes Actives</p>
            <p className="text-2xl font-bold">24</p>
          </div>
          <AlertTriangle className="text-red-500" />
        </div>

        <div className="bg-white p-4 rounded-[var(--radius-md)] shadow flex justify-between">
          <div>
            <p className="text-sm text-[var(--color-gray)]">Niveau de risque</p>
            <p className="text-2xl font-bold text-[var(--color-danger)]">Élevé</p>
          </div>
          <ShieldCheck className="text-[var(--color-danger)]" />
        </div>

        <div className="bg-white p-4 rounded-[var(--radius-md)] shadow flex justify-between">
          <div>
            <p className="text-sm text-[var(--color-gray)]">IPs bloquées</p>
            <p className="text-2xl font-bold">152</p>
          </div>
          <Ban className="text-green-500" />
        </div>

      </div>

      {/* CONTENT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* INCIDENTS */}
        <div className="lg:col-span-2 space-y-4">

          <h2 className="font-semibold">Incidents détectés</h2>

          {incidentsMock.map((item) => (
            <div
              key={item.id}
              className="bg-white p-4 rounded-[var(--radius-md)] shadow flex justify-between items-center"
            >
              <div>
                <p className="font-medium">{item.title}</p>
                <p className="text-sm text-[var(--color-gray)]">
                  Source: {item.source} • {item.target}
                </p>
              </div>

              <div className="text-right">
                <span className={`text-xs px-2 py-1 rounded ${badgeColor(item.level)}`}>
                  {item.level}
                </span>

                <p className="text-xs text-[var(--color-gray)] mt-1">{item.time}</p>

                <button
                  onClick={() => openModal(item)}
                  className="text-blue-600 text-sm mt-1 hover:underline"
                >
                  Analyser
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* ACTIONS */}
        <div className="space-y-4">

          <div className="bg-white p-4 rounded-[var(--radius-md)] shadow">
            <h3 className="font-semibold mb-2">Actions recommandées</h3>

            <div className="bg-blue-50 p-3 rounded mb-2">
              <p className="text-sm font-medium">Mettre à jour le pare-feu</p>
              <button className="text-blue-600 text-sm mt-1">
                Appliquer
              </button>
            </div>
          </div>

          {/* MAP */}
          <div className="bg-gray-800 text-white p-4 rounded-[var(--radius-md)] h-40 flex items-end">
            <p className="text-sm">
              Institut Universitaire de Technologie de Douala (IUT)
            </p>
          </div>

        </div>
      </div>

      {/* MODAL */}
      <SecurityModal data={selected} onClose={closeModal} />
    </div>
  );
}
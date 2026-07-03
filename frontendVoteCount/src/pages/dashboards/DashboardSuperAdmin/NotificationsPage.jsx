import { useState, useMemo } from "react";
import {
  Search,
  Plus,
  Undo2,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from "lucide-react";

import NotificationModal from "./NotificationModal";
import { toastSuccess, toastError } from "@services/toastService";
import TextInput from "@components/ui/TextInput";

export default function NotificationsPage() {

  const [notifications, setNotifications] = useState([
    {
      id: 1,
      name: "Admin",
      created_at: "2026-03-24, 14:20",
      email: "admin@votecount.fr",
      destinataire: "service@votecount.fr",
      subject: "Nouvelle tentative de connexion suspecte",
      message: "Le compte admin a essayé de se connecter",
      status: "non-lu",
      read_at: "2026-03-24, 14:20",
    },
    {
      id: 2,
      name: "VoteCount",
      created_at: "2026-03-24, 13:05",
      email: "service@votecount.fr",
      destinataire: "service@votecount.fr",
      subject: "Alerte SMS: Maintenance système",
      message: "Le service SMS est en cours de maintenance",
      status: "lu",
      read_at: "2026-03-24, 13:05",
    },
    {
      id: 3,
      name: "Syndicat A",
      created_at: "2026-03-23, 18:45",
      email:"contact@syndicat-a.org",
      destinataire: "service@votecount.fr",
      subject: "Confirmation d'abonnement premium",
      message: "Merci pour votre abonnement premium",
      status: "lu",
      read_at: "2026-03-23, 18:45",
    },
    {
      id: 4,
      name: "User 99",
      created_at: "2026-03-23, 11:20",
      email: "user-99@gmail.com",
      destinataire: "service@votecount.fr",
      subject: "Réinitialisation de mot de passe",
      message: "Votre mot de passe a été changé",
      status: "non-lu",
    },
    {
      id: 5,
      name: "VoteCount",
      created_at: "2026-03-22, 09:00",
      email: "service@votecount.fr",
      destinataire: "superadmin@votecount.fr",
      subject: "Rapport hebdomadaire disponible",
      message: "Le rapport hebdomadaire est disponible",
      status: "non-lu",

    },
    {
      id: 6,
      name: "VoteCount",
      created_at: "2026-03-21, 16:30",
      email: "service@votecount.fr",
      destinataire: "superadmin@votecount.fr",
      subject: "Alerte quota disque 85% atteint",
      message: "Le quota de disque est atteint",
      status: "lu",
    },
  ]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [open, setOpen] = useState(false);
  const [dateFilter, setDateFilter] = useState("");

  // pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 3;

  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {

      const matchSearch =
        n.destinataire.toLowerCase().includes(search.toLowerCase()) ||
        n.subject.toLowerCase().includes(search.toLowerCase()) ||
        n.name.toLowerCase().includes(search.toLowerCase());

      const matchDate = dateFilter
        ? n.created_at.startsWith(dateFilter)
        : true;

      return matchSearch && matchDate;
    });
  }, [search, dateFilter, notifications]);

  const paginatedNotifications = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredNotifications.slice(start, start + itemsPerPage);
  }, [filteredNotifications, currentPage]);

  const totalPages = Math.ceil(filteredNotifications.length / itemsPerPage);

  const handleResetFilters = () => {
    setSearch("");
    setDateFilter("");
    setCurrentPage(1);
  };

  const openModal = (notif) => {
  //marquer comme lu immediatement
  setNotifications((prev) =>
    prev.map((n) =>
      n.id === notif.id
        ? { ...n, status: "lu" }
        : n
    )
  );

  setSelected({ ...notif, status: "lu" });
  setOpen(true);
};
  const closeModal = () => {
    setOpen(false);
    setSelected(null);
  };

  // 🔹 envoyer réponse (LOGIQUE MÉTIER CENTRALISÉE)
  const handleSend = () => {
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === selected.id ? { ...n, reponse: "répondu" } : n
      )
    );

    closeModal();
  };

  const badgeStatus = (s) => {
    if (s === "lu") return "bg-green-100 text-green-600";
    if (s === "non-lu") return "bg-blue-100 text-blue-600";
    return "bg-gray-100 text-gray-600";
  };

  return (
    <div className="p-2 space-y-6">
      <div className="flex flex-col lg:flex-row justify-between gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold">
            Gestion des notifications
          </h1>
          <p className="text-sm text-gray-500">
            Gérez les notifications système
          </p>
        </div>

        <button
          onClick={() => {
            setSelected(null);
            setOpen(true);
          }}
          className="btn-primary flex items-center gap-2 h-10"
        >
          <Plus size={16} />
          Envoyer un message
        </button>
      </div>
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:flex-wrap lg:flex-nowrap">

        {/* SEARCH */}
        <div className="relative w-full md:flex-1">
          <TextInput
            className="pl-9 w-full"
            type="text"
            name="search"
            id="search"
            value={search}
            iconLeft={Search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Rechercher..."
          />
        </div>
        <div className="w-full md:w-auto">
          <TextInput
            name="created_at"
            type="date"
            id="date"
            value={dateFilter}
            onChange={(e) => {
              setDateFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full md:w-[180px]"
          />
        </div>
        <div className="w-full md:w-auto">
          <button
            onClick={handleResetFilters}
            className="flex items-center justify-center gap-2 w-full md:w-auto btn-secondary whitespace-nowrap group"
          >
            <RefreshCw
              size={16}
              className="transition-transform duration-300 group-hover:rotate-180"
            />
            Réinitialiser
          </button>
        </div>

      </div>

      {/* TABLE */}
      <div className="bg-white rounded shadow overflow-x-auto">
        <table className="min-w-[700px] w-full text-sm">
          <thead className="bg-[var(--color-gray-light)] capitalize">
            <tr>
              <th className="p-2 text-left">Nom</th>
              <th className="p-2 text-left">Email</th>
              <th className="p-2 text-left">Date</th>
              <th className="p-2 text-left">Destinataire</th>
              <th className="p-2 text-left">subject</th>
              <th className="p-2 text-left">Status</th>
              <th className="p-2 text-left">Actions</th>
            </tr>
          </thead>

          <tbody>
            {paginatedNotifications.map((n) => (
              <tr key={n.id} className="border-t border-t-[var(--color-gray-light)] hover:bg-[var(--color-gray-light)]">
                <td className="p-2">{n.name}</td>
                <td className="p-2">{n.email}</td>
                <td className="p-2 whitespace-nowrap ">{n.created_at}</td>
                <td className="p-2">{n.destinataire}</td>
                <td className="p-2">{n.subject}</td>

                <td className="p-2">
                  <span className={`px-2 py-1 rounded-xl whitespace-nowrap ${badgeStatus(n.status)}`}>
                    {n.status}
                  </span>
                </td>
                <td className="p-2">
                  <button
                    onClick={() => {
                      openModal(n);
                    }}
                    className="btn-primary flex items-center gap-2"
                  >
                    <Undo2 size={14} />
                    Répondre
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* PAGINATION */}
      <div className="flex flex-col lg:flex-row justify-between items-center p-4 text-sm gap-3">
        <span className="text-[var(--color-gray)]">
          Affichage de {(currentPage - 1) * itemsPerPage + 1} à{" "}
          {Math.min(currentPage * itemsPerPage, filteredNotifications.length)} sur{" "}
          {filteredNotifications.length}
        </span>

        <div className="flex gap-2">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => p - 1)}
            className="px-3 py-1 border rounded"><ChevronLeft size={16} /></button>
          <span className="px-3 py-1 bg-[var(--color-primary)] text-white rounded">
            {currentPage} / {totalPages}
          </span>
          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => p + 1)}
            className="px-3 py-1 border rounded"><ChevronRight size={16} /></button>
        </div>
      </div>

      {/* MODAL */}
      {open && (
        <NotificationModal
          data={selected}
          onClose={() => closeModal()}
          onSuccess={(data) => {
            toastSuccess("Réponse envoyée avec succès", data);

            // refresh UI
            handleSend();
          }}

          onError={(message) => {
            toastError(message || "Erreur lors de l'envoi");
          }}
        />
      )}
    </div>
  );
}
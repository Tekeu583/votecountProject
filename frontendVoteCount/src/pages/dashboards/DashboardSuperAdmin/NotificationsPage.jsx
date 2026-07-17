import { useState, useEffect, useCallback } from "react";
import {
  Search,
  Plus,
  Eye,
  Trash2,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import toast from 'react-hot-toast';

import NotificationModal from "./NotificationModal";
import TextInput from "@components/ui/TextInput";
import { notificationsApi } from "@services/api";

// Empêche un appel API à chaque frappe : attend 400ms d'inactivité.
function useDebounce(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

const EMPTY_PAGE = {
  data: [],
  meta: { current_page: 1, last_page: 1, per_page: 15, total: 0, from: 0, to: 0 },
};

export default function NotificationsPage() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search);
  const [selected, setSelected] = useState(null);
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  const [notifications, setNotifications] = useState(EMPTY_PAGE);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await notificationsApi.getAll({
        page,
        per_page: itemsPerPage,
        ...(debouncedSearch ? { search: debouncedSearch } : {}),
      });
      setNotifications({
        data: res.data?.data ?? [],
        meta: res.data?.meta ?? EMPTY_PAGE.meta,
      });
    } catch (error) {
      toast.error(error.response?.data?.message ?? 'Impossible de charger les notifications');
      setNotifications(EMPTY_PAGE);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch]);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);
  useEffect(() => { setPage(1); }, [debouncedSearch]);

  const handleResetFilters = () => {
    setSearch("");
    setPage(1);
  };

  const openView = async (notif) => {
    setSelected(notif);
    setOpen(true);
    if (!notif.is_read) {
      try {
        await notificationsApi.markAsRead(notif.uuid);
        fetchNotifications();
      } catch {
        // non bloquant
      }
    }
  };

  const handleDelete = async (uuid) => {
    if (!window.confirm('Supprimer cette notification ?')) return;
    try {
      await notificationsApi.delete(uuid);
      toast.success('Notification supprimée');
      fetchNotifications();
    } catch (error) {
      toast.error(error.response?.data?.message ?? 'Impossible de supprimer cette notification');
    }
  };

  const closeModal = () => {
    setOpen(false);
    setSelected(null);
  };

  const badgeStatus = (isRead) =>
    isRead ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600';

  const { data: items, meta } = notifications;

  return (
    <div className="p-2 space-y-6">
      <div className="flex flex-col lg:flex-row justify-between gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold">
            Gestion des notifications
          </h1>
          <p className="text-sm text-gray-500">
            Notifications in-app envoyées aux utilisateurs
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
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher (titre, message)..."
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
              <th className="p-2 text-left">Destinataire</th>
              <th className="p-2 text-left">Titre</th>
              <th className="p-2 text-left">Date</th>
              <th className="p-2 text-left">Statut</th>
              <th className="p-2 text-left">Actions</th>
            </tr>
          </thead>

          <tbody>
            {loading && (
              <tr><td colSpan={5} className="p-6 text-center text-[var(--color-gray)]">Chargement...</td></tr>
            )}
            {!loading && items.map((n) => (
              <tr key={n.uuid} className="border-t border-t-[var(--color-gray-light)] hover:bg-[var(--color-gray-light)]">
                <td className="p-2">{n.user?.full_name ?? '—'}<br /><span className="text-xs text-gray-500">{n.user?.email}</span></td>
                <td className="p-2">{n.title}</td>
                <td className="p-2 whitespace-nowrap">{n.created_at ? new Date(n.created_at).toLocaleString('fr-FR') : '—'}</td>

                <td className="p-2">
                  <span className={`px-2 py-1 rounded-xl whitespace-nowrap ${badgeStatus(n.is_read)}`}>
                    {n.is_read ? 'lue' : 'non-lue'}
                  </span>
                </td>
                <td className="p-2 flex gap-2">
                  <button
                    onClick={() => openView(n)}
                    className="btn-secondary flex items-center gap-2"
                    title="Voir"
                  >
                    <Eye size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(n.uuid)}
                    className="btn-secondary flex items-center gap-2 text-[var(--color-danger)]"
                    title="Supprimer"
                  >
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
            {!loading && items.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center py-10 text-[var(--color-gray)]">
                  Aucune notification trouvée
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {/* PAGINATION */}
      {!loading && meta.total > 0 && (
        <div className="flex flex-col lg:flex-row justify-between items-center p-4 text-sm gap-3">
          <span className="text-[var(--color-gray)]">
            Affichage de {meta.from} à {meta.to} sur {meta.total}
          </span>

          <div className="flex gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-3 py-1 border rounded disabled:opacity-50"><ChevronLeft size={16} /></button>
            <span className="px-3 py-1 bg-[var(--color-primary)] text-white rounded">
              {meta.current_page} / {meta.last_page}
            </span>
            <button
              disabled={page === meta.last_page}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1 border rounded disabled:opacity-50"><ChevronRight size={16} /></button>
          </div>
        </div>
      )}

      {/* MODAL */}
      {open && (
        <NotificationModal
          data={selected}
          onClose={closeModal}
          onSuccess={(message) => {
            toast.success(message);
            closeModal();
            fetchNotifications();
          }}
          onError={(message) => toast.error(message || "Erreur lors de l'envoi")}
        />
      )}
    </div>
  );
}

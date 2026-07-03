import React, { useState, useEffect, useCallback } from 'react';
import {
    Plus, Search, Upload, Edit2, ChevronLeft, ChevronRight,
    Trash2, Mail, Loader2, CheckSquare, Square, RefreshCw,
} from 'lucide-react';
import TextInput from '@components/ui/TextInput';
import toast from 'react-hot-toast';
import ElecteursModal from './ElecteursModal';
import { electorsApi, electionsApi } from '@services/api';
import { useOrg } from '@hooks/useOrg';
import { useDebounce } from '@hooks/useDebounce';
import { FadeLoader } from 'react-spinners';

const PER_PAGE = 15;

const Electeurs = () => {
    const { org } = useOrg();

    const [electeurs, setElecteurs]     = useState([]);
    const [elections, setElections]     = useState([]);
    const [loading, setLoading]         = useState(false);
    const [loadingElec, setLoadingElec] = useState(true);
    const [sendingCodes, setSendingCodes] = useState(false);

    // Filtres
    const [searchTerm, setSearchTerm]         = useState('');
    const debouncedSearch                     = useDebounce(searchTerm, 400);
    const [statusFilter, setStatusFilter]     = useState('all');
    const [electionFilter, setElectionFilter] = useState('');

    // Pagination
    const [page, setPage]         = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [total, setTotal]       = useState(0);

    // Sélection multiple — pour l'envoi ciblé des codes
    const [selectedIds, setSelectedIds] = useState(new Set());

    // Modal
    const [openModal, setOpenModal] = useState(false);
    const [selected, setSelected]   = useState(null);

    // ── 1. Charger les élections de l'org ────────────────────────
    useEffect(() => {
        if (!org?.uuid) return;
        const load = async () => {
            setLoadingElec(true);
            try {
                const res = await electionsApi.getAll({
                    organization_uuid: org.uuid,
                    per_page: 100,
                });
                const list = res.data?.data ?? [];
                setElections(list);
                // Pré-sélectionne la première élection privée par défaut
                const firstPrivate = list.find(e => e.election_mode === 'private');
                if (firstPrivate) setElectionFilter(firstPrivate.uuid);
                else if (list.length > 0) setElectionFilter(list[0].uuid);
            } catch {
                toast.error('Impossible de charger les élections.');
            } finally {
                setLoadingElec(false);
            }
        };
        load();
    }, [org?.uuid]);

    const currentElection = elections.find(e => e.uuid === electionFilter);

    // ── 2. Charger les électeurs ──────────────────────────────────
    const loadElecteurs = useCallback(async (p = 1) => {
        if (!electionFilter) return;
        setLoading(true);
        try {
            const res = await electorsApi.getAll(electionFilter, {
                status:   statusFilter !== 'all' ? statusFilter : undefined,
                search:   debouncedSearch || undefined,
                page:     p,
                per_page: PER_PAGE,
            });
            setElecteurs(res.data?.data ?? []);
            setTotal(res.data?.meta?.total ?? 0);
            setLastPage(res.data?.meta?.last_page ?? 1);
            setSelectedIds(new Set()); // reset sélection au rechargement
        } catch (err) {
            toast.error(err.response?.data?.message ?? 'Erreur de chargement.');
            setElecteurs([]);
        } finally {
            setLoading(false);
        }
    }, [electionFilter, statusFilter, debouncedSearch]);

    useEffect(() => {
        setPage(1);
        loadElecteurs(1);
    }, [electionFilter, statusFilter, debouncedSearch]);

    useEffect(() => {
        if (page === 1) return;
        loadElecteurs(page);
    }, [page]);

    // ── Sélection ────────────────────────────────────────────────
    const toggleSelect = (uuid) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            next.has(uuid) ? next.delete(uuid) : next.add(uuid);
            return next;
        });
    };

    const toggleSelectAll = () => {
        if (selectedIds.size === electeurs.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(electeurs.map(e => e.uuid)));
        }
    };

    // ── Envoi des voter_code ────────────────────────────────────
    // Si des électeurs sont sélectionnés → envoi ciblé.
    // Sinon → envoi à TOUS les électeurs actifs de l'élection.
    const handleSendVoterCodes = async () => {
        if (!currentElection) return;

        if (currentElection.election_mode !== 'private') {
            toast.error('Cette élection n\'est pas privée — aucun code à envoyer.');
            return;
        }

        const targetUuids = selectedIds.size > 0 ? Array.from(selectedIds) : null;
        const label = targetUuids
            ? `${targetUuids.length} électeur(s) sélectionné(s)`
            : 'TOUS les électeurs actifs';

        if (!window.confirm(`Envoyer le code d'accès à ${label} ?`)) return;

        setSendingCodes(true);
        try {
            const res = await electorsApi.sendVoterCodes(electionFilter, targetUuids);
            toast.success(res.data?.message ?? 'Codes envoyés avec succès.');
            setSelectedIds(new Set());
        } catch (err) {
            toast.error(err.response?.data?.message ?? 'Erreur lors de l\'envoi.');
        } finally {
            setSendingCodes(false);
        }
    };

    // ── Import CSV/Excel ───────────────────────────────────────────
    const handleImport = () => {
        if (!electionFilter) {
            toast.error('Sélectionnez une élection avant d\'importer.');
            return;
        }
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.csv,.xlsx,.xls';
        input.onchange = async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            const toastId = toast.loading('Import en cours...');
            try {
                await electorsApi.import(electionFilter, file);
                toast.success('Import lancé — les électeurs recevront leur code automatiquement.', { id: toastId });
                loadElecteurs(1);
            } catch (err) {
                toast.error(err.response?.data?.message ?? 'Erreur d\'import.', { id: toastId });
            }
        };
        input.click();
    };

    const handleDelete = async (electeur) => {
        if (!window.confirm(`Supprimer ${electeur.full_name} ?`)) return;
        try {
            await electorsApi.delete(electionFilter, electeur.uuid);
            toast.success('Électeur supprimé.');
            loadElecteurs(page);
        } catch (err) {
            toast.error(err.response?.data?.message ?? 'Erreur lors de la suppression.');
        }
    };

    const resetFilters = () => {
        setSearchTerm('');
        setStatusFilter('all');
        setPage(1);
    };

    return (
        <div className="bg-[var(--color-background-white)] p-2">

            {/* Header */}
            <div className="mb-8">
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                    <div className="flex-1">
                        <h1 className="text-2xl md:text-3xl font-semibold text-[var(--color-dark)]">
                            Gestion des Électeurs
                        </h1>
                        <p className="text-[var(--color-gray)] mt-2 text-sm md:text-base">
                            Gérez la liste électorale et suivez la participation en temps réel.
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                        <button
                            onClick={handleImport}
                            className="flex items-center justify-center gap-2 px-5 py-3 bg-[var(--color-white)] border border-gray-300 rounded-[var(--radius-md)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors font-medium whitespace-nowrap"
                        >
                            <Upload size={16} />
                            <span className="hidden sm:inline">Importer une liste (CSV/Excel)</span>
                            <span className="sm:hidden">Importer</span>
                        </button>
                        <button
                            onClick={() => { setSelected(null); setOpenModal(true); }}
                            disabled={loadingElec || !electionFilter}
                            className="flex items-center justify-center gap-2 px-6 py-3 btn-primary text-[var(--color-white)] rounded-[var(--radius-md)] hover:bg-[var(--color-primary)] transition-all font-medium whitespace-nowrap w-full sm:w-auto disabled:opacity-50"
                        >
                            <Plus size={16} /> Ajouter un électeur
                        </button>
                    </div>
                </div>
            </div>

            {/* Bandeau envoi codes — visible seulement si élection privée */}
            {currentElection?.election_mode === 'private' && (
                <div className="bg-blue-50 border border-blue-200 rounded-[var(--radius-md)] p-4 mb-6 flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-2 text-sm text-blue-800">
                        <Mail size={16} />
                        <span>
                            Code d'accès de cette élection : <span className="font-mono font-bold">{currentElection.voter_code}</span>
                        </span>
                    </div>
                    <button
                        onClick={handleSendVoterCodes}
                        disabled={sendingCodes}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-[var(--radius-md)] text-sm font-medium disabled:opacity-50 transition"
                    >
                        {sendingCodes
                            ? <><Loader2 size={14} className="animate-spin" /> Envoi en cours...</>
                            : <><Mail size={14} /> {selectedIds.size > 0
                                ? `Envoyer à ${selectedIds.size} sélectionné(s)`
                                : 'Envoyer à tous les électeurs'}</>
                        }
                    </button>
                </div>
            )}

            {/* Barre de recherche et filtres */}
            <div className="bg-[var(--color-white)] rounded-[var(--radius-md)] shadow-[var(--shadow-sm)] border border-gray-100 p-5 md:p-6 mb-6">
                <div className="flex flex-col lg:flex-row gap-4 lg:items-end">
                    <div className="flex-1 relative">
                        <TextInput
                            type="text"
                            placeholder="Rechercher par nom ou email..."
                            value={searchTerm}
                            iconLeft={Search}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full"
                        />
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
                        {/* Filtre Élection */}
                        <div className="flex flex-col w-full sm:w-auto min-w-[200px]">
                            <span className="text-xs text-[var(--color-gray)] mb-1.5 hidden sm:block">Élection</span>
                            <select
                                value={electionFilter}
                                onChange={(e) => setElectionFilter(e.target.value)}
                                className="w-full input truncate"
                                disabled={loadingElec}
                            >
                                {loadingElec
                                    ? <option>Chargement...</option>
                                    : elections.map(e => (
                                        <option key={e.uuid} value={e.uuid}>
                                            {e.title} {e.election_mode === 'private' ? '🔒' : ''}
                                        </option>
                                    ))
                                }
                            </select>
                        </div>

                        {/* Filtre Statut */}
                        <div className="flex flex-col min-w-[160px]">
                            <span className="text-xs text-[var(--color-gray)] mb-1.5 hidden sm:block">Statut</span>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="w-full input"
                            >
                                <option value="all">Tous les statuts</option>
                                <option value="active">Actif</option>
                                <option value="blocked">Bloqué</option>
                            </select>
                        </div>

                        <button
                            onClick={() => loadElecteurs(page)}
                            className="flex items-center gap-1 btn-secondary font-medium whitespace-nowrap self-end"
                        >
                            <RefreshCw size={14} /> Actualiser
                        </button>
                    </div>
                </div>
            </div>

            {/* Tableau */}
            <div className="bg-[var(--color-white)] rounded-[var(--radius-md)] shadow-[var(--shadow-sm)] border border-gray-100 overflow-x-auto">

                {(loadingElec || loading) ? (
                    <div className="flex items-center justify-center py-20">
                        <FadeLoader color="#1e40af" cssOverride={{ display: 'block', margin: '0 auto' }} />
                    </div>
                ) : electeurs.length === 0 ? (
                    <div className="text-center py-16 text-[var(--color-gray)]">
                        Aucun électeur trouvé pour cette élection.
                    </div>
                ) : (
                    <table className="w-full">
                        <thead>
                            <tr className="bg-[var(--color-gray-light)] border-b border-[var(--color-gray-light)] capitalize">
                                <th className="px-4 py-2 w-10">
                                    <button onClick={toggleSelectAll} className="text-[var(--color-gray)] hover:text-[var(--color-primary)]">
                                        {selectedIds.size === electeurs.length
                                            ? <CheckSquare size={16} />
                                            : <Square size={16} />}
                                    </button>
                                </th>
                                <th className="text-left px-4 py-2 font-medium text-[var(--color-dark)]">Nom complet</th>
                                <th className="text-left px-4 py-2 font-medium text-[var(--color-dark)]">Email</th>
                                <th className="text-left px-4 py-2 font-medium text-[var(--color-dark)]">Statut</th>
                                <th className="text-left px-4 py-2 font-medium text-[var(--color-dark)]">A voté</th>
                                <th className="text-left px-4 py-2 font-medium text-[var(--color-dark)]">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--color-gray-light)]">
                            {electeurs.map((electeur) => (
                                <tr key={electeur.uuid} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-4 py-2">
                                        <button onClick={() => toggleSelect(electeur.uuid)} className="text-[var(--color-gray)] hover:text-[var(--color-primary)]">
                                            {selectedIds.has(electeur.uuid)
                                                ? <CheckSquare size={16} className="text-[var(--color-primary)]" />
                                                : <Square size={16} />}
                                        </button>
                                    </td>
                                    <td className="px-4 py-2 font-medium text-[var(--color-dark)]">{electeur.full_name}</td>
                                    <td className="px-4 py-2 text-[var(--color-gray)]">{electeur.email}</td>
                                    <td className="px-4 py-2">
                                        <span className={`inline-flex px-2 py-1.5 text-xs font-medium rounded-full ${
                                            electeur.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                        }`}>
                                            {electeur.status === 'active' ? 'Actif' : 'Bloqué'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-2">
                                        <span className={`inline-flex px-2 py-1.5 text-xs font-medium rounded-full ${
                                            electeur.has_voted ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                        }`}>
                                            {electeur.has_voted ? 'Voté' : 'Non voté'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-2 flex gap-2">
                                        <button
                                            onClick={() => { setSelected(electeur); setOpenModal(true); }}
                                            title="Modifier"
                                            className="hover:text-[var(--color-primary)] transition-colors"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(electeur)}
                                            title="Supprimer"
                                            className="hover:text-[var(--color-danger)] transition-colors"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}

                {/* Pagination */}
                {!loading && lastPage > 1 && (
                    <div className="p-2 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
                        <p className="text-sm text-[var(--color-gray)]">
                            Page {page} sur {lastPage} — {total} électeur(s)
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="p-2 rounded-[var(--radius-md)] hover:bg-[var(--color-gray-light)] transition-colors disabled:opacity-50"
                            >
                                <ChevronLeft size={16} />
                            </button>
                            <button
                                onClick={() => setPage(p => Math.min(lastPage, p + 1))}
                                disabled={page === lastPage}
                                className="p-2 rounded-[var(--radius-md)] hover:bg-[var(--color-gray-light)] transition-colors disabled:opacity-50"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal */}
            {openModal && (
                <ElecteursModal
                    data={selected}
                    electionUuid={electionFilter}
                    onClose={() => setOpenModal(false)}
                    onSuccess={(message) => {
                        toast.success(message);
                        setOpenModal(false);
                        loadElecteurs(page);
                    }}
                    onError={(message) => toast.error(message)}
                />
            )}
        </div>
    );
};

export default Electeurs;
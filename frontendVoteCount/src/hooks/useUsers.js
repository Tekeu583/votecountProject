// src/hooks/useUsers.js
import { useState, useEffect, useCallback } from 'react';
import { usersApi } from '@services/api';
import toast from 'react-hot-toast';

/**
 * Hook pour gérer la liste des utilisateurs avec pagination et filtres.
 *
 * @param {Object}  options
 * @param {number}  options.initialPage - Page de départ (défaut : 1)
 * @param {number}  options.limit       - Éléments par page (défaut : 15)
 * @param {boolean} options.autoFetch   - Fetch au montage (défaut : true)
 */
export const useUsers = (options = {}) => {
    const { initialPage = 1, limit = 15, autoFetch = true } = options;

    const [users, setUsers]           = useState([]);
    const [stats, setStats]           = useState(null);
    const [loading, setLoading]       = useState(false);
    const [error, setError]           = useState(null);
    const [currentPage, setCurrentPage] = useState(initialPage);
    const [totalPages, setTotalPages] = useState(0);
    const [totalUsers, setTotalUsers] = useState(0);
    const [filters, setFilters]       = useState({ search: '', role: '', status: '' });

    // -- FETCH USERS ----------------------------------------------─

    const fetchUsers = useCallback(async (page = 1) => {
        setLoading(true);
        setError(null);
        try {
            const response = await usersApi.getAll(page, limit, filters);
            const payload = response.data;

            // Shape Laravel : { success, data: { data: [...], pagination: {...} } }
            const list       = payload?.data?.data       ?? payload?.data ?? [];
            const lastPage   = payload?.data?.pagination?.last_page ?? payload?.meta?.last_page ?? 1;
            const total      = payload?.data?.pagination?.total     ?? payload?.meta?.total     ?? 0;

            setUsers(list);
            setTotalPages(lastPage);
            setTotalUsers(total);
            setCurrentPage(page);
        } catch (err) {
            const message = err.response?.data?.message || err.message || 'Erreur lors de la récupération des utilisateurs';
            setError(message);
            toast.error(message);
        } finally {
            setLoading(false);
        }
    }, [limit, filters]);

    const fetchStats = useCallback(async () => {
        try {
            const response = await usersApi.getStats();
            setStats(response.data?.data ?? response.data);
        } catch (err) {
            if (import.meta.env.DEV) {
                console.error('[useUsers] fetchStats erreur :', err);
            }
        }
    }, []);

    // -- EFFETS ----------------------------------------------------

    // Fetch initial
    useEffect(() => {
        if (autoFetch) {
            fetchUsers(1);
            fetchStats();
        }
    }, [autoFetch]); // eslint-disable-line react-hooks/exhaustive-deps
    // Note : on ignore fetchUsers/fetchStats ici intentionnellement —
    // ce useEffect ne doit s'exécuter qu'au montage (autoFetch ne change pas).

    // CORRECTION : re-fetch automatique quand les filtres changent
    useEffect(() => {
        fetchUsers(1);
    }, [filters]); // eslint-disable-line react-hooks/exhaustive-deps
    // Note : fetchUsers est stable (useCallback sur [limit, filters]),
    // mais on surveille filters directement pour clarté.

    // -- ACTIONS --------------------------------------------------─

    const refresh = useCallback(async () => {
        await Promise.all([fetchUsers(1), fetchStats()]);
        toast.success('Données actualisées');
    }, [fetchUsers, fetchStats]);

    // CORRECTION : applyFilters déclenche le re-fetch via le useEffect sur filters
    const applyFilters = useCallback((newFilters) => {
        setFilters(newFilters);
        setCurrentPage(1);
    }, []);

    const clearFilters = useCallback(() => {
        setFilters({ search: '', role: '', status: '' });
        setCurrentPage(1);
    }, []);

    const goToPage = useCallback((page) => {
        if (page > 0 && page <= totalPages) {
            fetchUsers(page);
        }
    }, [totalPages, fetchUsers]);

    return {
        users,
        stats,
        loading,
        error,
        currentPage,
        totalPages,
        totalUsers,
        filters,
        fetchUsers,
        fetchStats,
        refresh,
        applyFilters,
        clearFilters,
        goToPage,
    };
};

export default useUsers;
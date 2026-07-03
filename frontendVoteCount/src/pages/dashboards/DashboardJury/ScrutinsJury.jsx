import React, { useState, useMemo } from 'react';
import {
    Search,
    Calendar,
    Eye,
    BarChart3,
    RefreshCw,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';
import TextInput from '@components/ui/TextInput';
import { useNavigate } from 'react-router-dom';

const MesScrutinsAssignes = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('Tous');
    const [dateFilter, setDateFilter] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;
    const navigate = useNavigate();

    // Données simulées
    const scrutins = useMemo(() => [
        {
            id:1,
            code: 'SCR-2024-001',
            titre: "Prix de l'Innovation Tech 2024",
            organisation: 'CCI France',
            dateLimite: '2024-10-15',
            candidats: 12,
            status: 'À évaluer',
            statusColor: 'bg-yellow-100 text-yellow-700',
            action: 'Commencer',
            actionType: 'primary',
        },
        {
            id:2,
            code: 'SCR-2024-042',
            titre: 'Bourse Excellence Académique',
            organisation: 'Fondation Académique',
            dateLimite: '2024-10-20',
            candidats: 8,
            status: 'En cours',
            statusColor: 'bg-blue-100 text-blue-700',
            progress: 60,
            action: 'Reprendre',
            actionType: 'primary',
        },
        {
            id:3,
            code: 'SCR-2024-089',
            titre: 'Grand Prix Entrepreneuriat',
            organisation: "Ministère de l'Économie",
            dateLimite: '2024-11-05',
            candidats: 25,
            status: 'En attente',
            statusColor: 'bg-gray-100 text-gray-600',
            action: 'Détails',
            actionType: 'secondary',
        },
        {
            id:4,
            code: 'SCR-2024-112',
            titre: 'Concours Startup Durable',
            organisation: 'Région Île-de-France',
            dateLimite: '2024-09-30',
            candidats: 15,
            status: 'Terminé',
            statusColor: 'bg-emerald-100 text-emerald-700',
            action: 'Résultats',
            actionType: 'secondary',
        },
    ], []);

    // Filtrage avancé
    const filteredScrutins = useMemo(() => {
        return scrutins.filter((scrutin) => {
            const matchesSearch =
                scrutin.titre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                scrutin.organisation.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesStatus =
                statusFilter === 'Tous' || scrutin.status === statusFilter;

            const matchesDate = !dateFilter || scrutin.dateLimite === dateFilter;

            return matchesSearch && matchesStatus && matchesDate;
        });
    }, [searchTerm, statusFilter, dateFilter, scrutins]);

    const totalPages = Math.ceil(filteredScrutins.length / itemsPerPage);
    const paginatedScrutins = filteredScrutins.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const resetFilters = () => {
        setSearchTerm('');
        setStatusFilter('Tous');
        setDateFilter('');
        setCurrentPage(1);
    };

    const handleAction = (scrutin) => {
        if (scrutin.status === 'Terminé') {
            console.log('Naviguer vers les résultats de', scrutin.id);
            navigate(`/jury/results/${scrutin.id}`);
        } else {
            console.log('Naviguer vers les candidats de', scrutin.id);
            navigate(`/jury/candidats/${scrutin.id}`);
        }
    };

    return (
        <div className="flex-1 bg-[var(--color-background-white)] p-4">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Mes Scrutins Assignés</h1>
                        <p className="text-gray-600 mt-1">
                            Gérez vos évaluations et délibérations pour la session actuelle.
                        </p>
                    </div>

                    <div className="flex gap-3">
                        <div className="bg-white px-5 py-3 rounded-2xl shadow-sm border border-gray-100 text-center">
                            <p className="text-xs text-gray-500">TOTAL</p>
                            <p className="text-2xl font-semibold text-gray-900">{scrutins.length}</p>
                        </div>
                        <div className="bg-white px-5 py-3 rounded-2xl shadow-sm border border-gray-100 text-center">
                            <p className="text-xs text-gray-500">EN COURS</p>
                            <p className="text-2xl font-semibold text-blue-600">{scrutins.filter((scrutin) => scrutin.status === 'En cours').length}</p>
                        </div>
                    </div>
                </div>

                {/* Filtres */}
                <div className="bg-white p-4 rounded-2xl shadow-sm mb-6 flex flex-col lg:flex-row gap-4 lg:items-end">
                    <div className="flex-1">
                        <TextInput
                            iconLeft={Search}
                            placeholder="Rechercher par titre ou organisation..."
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(1);
                            }}
                        />
                    </div>

                    <div className="w-full lg:w-56">
                        <label className="block text-xs font-medium text-gray-500 mb-1">STATUT</label>
                        <select
                            value={statusFilter}
                            onChange={(e) => {
                                setStatusFilter(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-600"
                        >
                            <option value="Tous">Tous les statuts</option>
                            <option value="À évaluer">À évaluer</option>
                            <option value="En cours">En cours</option>
                            <option value="En attente">En attente</option>
                            <option value="Terminé">Terminé</option>
                        </select>
                    </div>

                    <div className="w-full lg:w-56">
                        <label className="block text-xs font-medium text-gray-500 mb-1">DATE LIMITE</label>
                        <TextInput
                            type="date"
                            value={dateFilter}
                            onChange={(e) => {
                                setDateFilter(e.target.value);
                                setCurrentPage(1);
                            }}
                        />
                    </div>

                    <button
                        onClick={resetFilters}
                        className="flex items-center gap-2 btn-secondary text-sm font-medium whitespace-nowrap"
                    >
                        <RefreshCw size={18} />
                        Réinitialiser
                    </button>
                </div>

                {/* Tableau */}
                <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[950px]">
                            <thead className="bg-gray-50 border-b border-b-[var(--color-gray-light)]">
                                <tr className="text-xs uppercase text-[var(--color-dark)]">
                                    <th className="text-left px-3 py-2 font-medium">TITRE DU SCRUTIN</th>
                                    <th className="text-left px-3 py-2 font-medium">ORGANISATION</th>
                                    <th className="text-left px-3 py-2 font-medium">DATE LIMITE</th>
                                    <th className="text-left px-3 py-2 font-medium">CANDIDATS</th>
                                    <th className="text-left px-3 py-2 font-medium">STATUT</th>
                                    <th className="text-left px-3 py-2 font-medium">ACTION</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--color-gray-light)]">
                                {paginatedScrutins.map((scrutin) => (
                                    <tr key={scrutin.id} className="hover:bg-[var(--color-gray-light)] transition-colors">
                                        <td className="px-3 py-2">
                                            <div>
                                                <p className="font-semibold text-gray-900">{scrutin.titre}</p>
                                                <p className="text-xs text-gray-500 mt-1">code: {scrutin.code}</p>
                                            </div>
                                        </td>
                                        <td className="px-3 py-2 text-gray-600">{scrutin.organisation}</td>
                                        <td className="px-3 py-2">
                                            <div className="flex items-center gap-2 text-red-600">
                                                <Calendar size={16} />
                                                <span className="font-medium">{scrutin.dateLimite}</span>
                                            </div>
                                        </td>
                                        <td className="px-3 py-2 text-center">
                                            <span className="inline-flex items-center gap-1 bg-gray-100 px-3 py-1 rounded-full text-sm">
                                                👥 {scrutin.candidats}
                                            </span>
                                        </td>
                                        <td className="px-3 py-2 text-center">
                                            <span className={`inline-flex px-4 py-1 text-xs font-medium rounded-full ${scrutin.statusColor}`}>
                                                {scrutin.status}
                                            </span>
                                        </td>
                                        <td className="px-3 py-2 text-right">
                                            <button
                                                onClick={() => handleAction(scrutin)}
                                                className={`px-5 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 ${scrutin.actionType === 'primary'
                                                    ? 'btn-primary text-white'
                                                    : 'btn-secondary text-gray-700'
                                                    }`}
                                            >
                                                {scrutin.action}
                                                {scrutin.status === 'En cours' && <span>↻</span>}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="flex flex-col lg:flex-row justify-between items-center px-3 py-2 text-sm gap-3">
                        <span className="text-[var(--color-gray)]">
                            Affichage de {(currentPage - 1) * itemsPerPage + 1} à{" "}
                            {Math.min(currentPage * itemsPerPage, filteredScrutins.length)} sur{" "}
                            {filteredScrutins.length}
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
                </div>

                {/* Info Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
                    <div className="bg-white p-6 rounded-2xl border border-gray-100">
                        <div className="flex gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                                <Eye className="text-blue-600" size={24} />
                            </div>
                            <div>
                                <p className="font-medium">Comment évaluer ?</p>
                                <p className="text-sm text-gray-600 mt-1">
                                    Sélectionnez un scrutin puis parcourez les dossiers des candidats.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-gray-100">
                        <div className="flex gap-3">
                            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                                <Calendar className="text-amber-600" size={24} />
                            </div>
                            <div>
                                <p className="font-medium">Dates Limites</p>
                                <p className="text-sm text-gray-600 mt-1">
                                    Assurez-vous de valider vos votes avant la date limite indiquée.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-gray-100">
                        <div className="flex gap-3">
                            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                                <BarChart3 className="text-emerald-600" size={24} />
                            </div>
                            <div>
                                <p className="font-medium">Rapports de Synthèse</p>
                                <p className="text-sm text-gray-600 mt-1">
                                    Une fois le vote clos, vous pourrez télécharger le récapitulatif des délibérations en PDF.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MesScrutinsAssignes;
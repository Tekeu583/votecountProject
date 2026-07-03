import React, { useState, useMemo } from 'react';
import {
    Search,
    Trash2,
    RotateCw,
    FileText,
    Users,
    AlertCircle,
    ChevronLeft,
    ChevronRight,
    RefreshCw,
} from 'lucide-react';
import toast from 'react-hot-toast';
import TextInput from '@components/ui/TextInput';

const Corbeille = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedItems, setSelectedItems] = useState([]);

    // Données d'exemple (à remplacer par les données venant de l'API plus tard)
    const deletedItems = useMemo(() => [
        {
            id: 1,
            name: 'Élections Municipales 2026 - Test',
            type: 'Scrutin',
            deletedAt: '12 Mai 2026',
            remainingDays: 3,
            icon: FileText,
            color: 'bg-blue-100 text-blue-600',
            idRef: 'SCR-8921-23',
        },
        {
            id: 2,
            name: 'Arsene Tekeu',
            type: 'Candidat',
            deletedAt: '15 Mai 2026',
            remainingDays: 12,
            icon: Users,
            color: 'bg-purple-100 text-purple-600',
            idRef: 'CAN-4412-09',
        },
        {
            id: 3,
            name: 'Rapport Annuel Audit_V2.pdf',
            type: 'Document',
            deletedAt: '20 Mai 2026',
            remainingDays: 23,
            icon: FileText,
            color: 'bg-amber-100 text-amber-600',
            idRef: 'DOC-9002-XX',
        },
        {
            id: 4,
            name: 'Liste Électeurs - Secteur Ouest',
            type: 'Liste',
            deletedAt: '25 Mai 2026',
            remainingDays: 28,
            icon: Users,
            color: 'bg-emerald-100 text-emerald-600',
            idRef: 'ELEC-1122-88',
        },
    ], []);

    // Filtrage
    const filteredItems = useMemo(() => {
        if (!searchTerm.trim()) return deletedItems;
        const term = searchTerm.toLowerCase();
        return deletedItems.filter(item =>
            item.name.toLowerCase().includes(term) ||
            item.type.toLowerCase().includes(term) ||
            item.idRef.toLowerCase().includes(term)
        );
    }, [searchTerm, deletedItems]);
    const toggleSelect = (id) => {
        setSelectedItems(prev =>
            prev.includes(id)
                ? prev.filter(item => item !== id)
                : [...prev, id]
        );
    };

    const toggleSelectAll = () => {
        if (selectedItems.length === filteredItems.length) {
            setSelectedItems([]);
        } else {
            setSelectedItems(filteredItems.map(item => item.id));
        }
    };

    const handleRestoreSelected = () => {
        if (selectedItems.length === 0) {
            toast.error("Aucun élément sélectionné");
            return;
        }

        toast.success(`${selectedItems.length} éléments restaurés`);

        // 👉 appel API ici
        // await api.restoreMany(selectedItems)

        setSelectedItems([]);
    };
    const handleRestore = (id) => {
        toast.success(`Élément restauré avec succès ${id}`, { duration: 3000 });
        // Ici tu feras l'appel API pour restaurer
    };

    const handleRestoreAll = () => {
        if (deletedItems.length === 0) {
            toast.error("La corbeille est vide");
            return;
        }
        toast.success(`${deletedItems.length} éléments restaurés avec succès`, { duration: 3000 });
        // Appel API pour tout restaurer
    };
    const handleDeleteSelected = () => {
        if (selectedItems.length === 0) {
            toast.error("Aucun élément sélectionné");
            return;
        }

        toast.success(`${selectedItems.length} éléments supprimés définitivement`);

        // 👉 appel API ici
        // await api.deleteMany(selectedItems)

        setSelectedItems([]);
    };
    const getRemainingColor = (days) => {
        if (days <= 5) return 'text-red-600';
        if (days <= 15) return 'text-orange-600';
        return 'text-emerald-600';
    };

    return (
        <div className="flex-1 bg-[var(--color-background-white)] p-4 lg:p-6 min-h-screen">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl lg:text-3xl font-semibold text-[var(--color-dark)]">Corbeille</h1>
                    <p className="text-[var(--color-gray)] mt-1">Éléments supprimés récemment</p>
                </div>

                <button
                    onClick={handleRestoreAll}
                    className="btn-primary flex items-center gap-2 px-6 py-3 rounded-xl font-medium"
                >
                    <RotateCw size={18} />
                    Restaurer tout
                </button>
            </div>

            {/* Info Banner */}
            <div className="bg-blue-50 border border-blue-200 rounded-[var(--radius-md)] p-4 mb-8 flex items-start gap-4">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <AlertCircle size={20} className="text-blue-600" />
                </div>
                <div>
                    <p className="font-medium text-blue-900">Rétention automatique</p>
                    <p className="text-sm text-blue-700 mt-1">
                        Les éléments supprimés sont conservés pendant <strong>30 jours</strong> avant d'être définitivement effacés de nos serveurs sécurisés.
                    </p>
                </div>
            </div>

            {/* Search Bar */}
            <div className="bg-white rounded-[var(--radius-md)] shadow-sm p-4 mb-6 flex items-center gap-4">
                <div className="text-sm text-[var(--color-gray)] whitespace-nowrap">
                    {filteredItems.length} éléments trouvés
                </div>
                <div className="flex-1 relative">
                    <TextInput
                        iconLeft={Search}
                        placeholder="Rechercher dans la corbeille..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full"
                    />
                </div>
                <div className="flex items-end">
                    <button
                        onClick={()=>{
                            setSearchTerm('');
                            setSelectedItems('');
                        }}
                        className="flex items-center gap-2 px-5 py-3 btn-secondary  font-medium"
                    >
                        <RefreshCw size={18} />
                        Réinitialiser
                    </button>
                </div>

            </div>
            {selectedItems.length > 0 && (
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-[var(--color-gray-light)] text-[var(--color-dark)] px-4 md:px-6 py-3 rounded-md mb-4">
                    <span>{selectedItems.length} élément(s) sélectionné(s)</span>

                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full md:w-auto">
                        <button
                            onClick={handleRestoreSelected}
                            className="bg-white text-[var(--color-primary)] btn-secondary px-4 py-1 rounded w-full sm:w-auto"
                        >
                            Restaurer
                        </button>

                        <button
                            onClick={handleDeleteSelected}
                            className="bg-red-600 px-4 py-1 rounded text-[var(--color-white)] min-h-10 w-full sm:w-auto"
                        >
                            Supprimer définitivement
                        </button>
                    </div>
                </div>
            )}

            {/* Table */}
            <div className="bg-white rounded-[var(--radius-md)] shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                    <h2 className="font-semibold text-lg text-[var(--color-dark)]">Historique des suppressions</h2>
                    <span className="text-xs bg-gray-100 px-3 py-1 rounded-full text-gray-600">
                        {filteredItems.length} éléments
                    </span>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full min-w-[900px]">
                        <thead>
                            <tr className="border-b border-[var(--color-gray-light)] bg-gray-50 text-xs uppercase tracking-wider text-[var(--color-dark)]">
                                <th className="text-left p-4 font-medium">NOM DE L'ÉLÉMENT</th>
                                <th className="text-left p-4 font-medium">TYPE</th>
                                <th className="text-left p-4 font-medium">SUPPRIMÉ LE</th>
                                <th className="text-left p-4 font-medium">DÉLAI RESTANT</th>
                                <th className="text-left p-4 font-medium pr-8">ACTIONS</th>
                                <th className=" text-left p-4">
                                    <input
                                        type="checkbox"
                                        checked={
                                            filteredItems.length > 0 &&
                                            selectedItems.length === filteredItems.length
                                        }
                                        onChange={toggleSelectAll}
                                    />
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--color-gray-light)]">
                            {filteredItems.map((item) => {
                                const Icon = item.icon;
                                return (
                                    <tr key={item.id} className="hover:bg-[var(--color-gray-light)] transition-colors">
                                        <td className="px-3 py-2">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${item.color}`}>
                                                    <Icon size={20} />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-[var(--color-dark)]">{item.name}</p>
                                                    <p className="text-xs text-gray-500">ID: {item.idRef}</p>
                                                </div>
                                            </div>
                                        </td>

                                        <td className="px-3 py-2">
                                            <span className="inline-flex px-3 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">
                                                {item.type}
                                            </span>
                                        </td>

                                        <td className="px-3 py-2 text-sm text-gray-600">{item.deletedAt}</td>

                                        <td className="px-3 py-2">
                                            <div className="flex items-center gap-2">
                                                <div className={`text-xs font-medium ${getRemainingColor(item.remainingDays)}`}>
                                                    {item.remainingDays} jours restants
                                                </div>
                                                <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden max-w-[120px]">
                                                    <div
                                                        className="h-full bg-emerald-500 rounded-full transition-all"
                                                        style={{ width: `${Math.max(10, item.remainingDays)}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </td>

                                        <td className="px-3 py-2 text-right pr-8">
                                            <button
                                                onClick={() => handleRestore(item.id)}
                                                className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors"
                                            >
                                                <RotateCw size={16} />
                                                Restaurer
                                            </button>
                                        </td>
                                        <td className="px-3 py-2">
                                            <input
                                                type="checkbox"
                                                checked={selectedItems.includes(item.id)}
                                                onChange={() => toggleSelect(item.id)}
                                            />
                                        </td>
                                    </tr>
                                );
                            })}

                            {filteredItems.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="p-16 text-center">
                                        <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                            <Trash2 size={32} className="text-gray-400" />
                                        </div>
                                        <p className="text-gray-500">Aucun élément trouvé dans la corbeille</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between text-sm text-[var(--color-gray)]">
                    <span>Affichage 1-4 de 12 éléments</span>
                    <div className="flex items-center gap-2">
                        <button className="p-2 hover:bg-gray-100 rounded"><ChevronLeft size={18} /></button>
                        <button className="px-4 py-1 bg-[var(--color-primary)] text-white rounded">1</button>
                        <button className="px-4 py-1 border rounded hover:bg-gray-100">2</button>
                        <button className="px-4 py-1 border rounded hover:bg-gray-100">3</button>
                        <button className="p-2 hover:bg-gray-100 rounded"><ChevronRight size={18} /></button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Corbeille;
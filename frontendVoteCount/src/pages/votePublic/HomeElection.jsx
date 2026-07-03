// src/pages/HomeElection.jsx
import React, { useState, useEffect, useCallback } from 'react';
import MarqueeCarousel from '@components/MarqueeCarousel.jsx';
import CampaignCard from '@components/CampaignCard.jsx';
import { Search, Filter, Users, Clock, RefreshCw, X, Gem, ChevronLeft, ChevronRight } from 'lucide-react';
import { FadeLoader } from 'react-spinners';
import TextInput from '@components/ui/TextInput.jsx';
import { electionsApi } from '@services/api';
import { Link } from 'react-router-dom';
import { useDebounce } from '@hooks/useDebounce';
export default function HomeElection() {
    const [activeFilter, setActiveFilter] = useState('all'); // Filtre actif
    const [loading, setLoading] = useState(true);
    const [query, setQuery] = useState({
        page: 1,
        search: '',
        status: 'all',
    });
    const [elections, setElections] = useState([]);
    const [meta, setMeta] = useState({});

    const filters = [
        { label: 'Toutes', value: 'all' },
        { label: 'À venir', value: 'published' },
        { label: 'En cours', value: 'ongoing' },
        { label: 'Terminées', value: 'closed' },
        { label: 'Clôturées', value: 'completed' },
    ];

    // recuperer tout les elections qui sont publiques depuis l'API

    useEffect(() => {
        const fetchElections = async () => {
            try {
                setLoading(true);
                const response = await electionsApi.getPublic(
                    {
                        page: query.page,
                        search: query.search || undefined,
                        status: query.status !== 'all' ? query.status : undefined,
                        per_page: 15,
                    }
                );
                const list = response.data?.data ?? [];
                const pagination = response.data?.meta ?? {};
                setElections(list);
                setMeta(pagination);
                console.log('Elections:', list);
            } catch (error) {
                console.error('Error:', error);
                setElections([]);
            } finally {
                setLoading(false);
            }
        };

        fetchElections();
    }, [query.page, query.search, query.status]);

    const [searchInput, setSearchInput] = useState('');
    const debouncedSearch = useDebounce(searchInput, 1000);
    useEffect(() => {
        setQuery(prev => ({ ...prev, page: 1, search: debouncedSearch }));
    }, [debouncedSearch]);

    const handleSearch = useCallback((e) => {
        setSearchInput(e.target.value);
    }, []);


    const handleReset = () => {
        setActiveFilter('all');
        setSearchInput('');
        setQuery({ page: 1, search: '', status: 'all' });
    };
    return (
        <div className="bg-gray-50 min-h-screen">

            {/* Hero Section */}
            <div className="bg-gradient-to-br from-[#0A1428] via-blue-950 to-[#0A1428] pt-16 pb-10 text-white">
                <div className="max-w-5xl mx-auto text-center px-6">
                    <h1 className="text-xl md:text-2xl font-bold tracking-tighter leading-none mb-6">
                        Découvrez les campagnes, elections<br />en cours
                    </h1>
                </div>

                <MarqueeCarousel />

                {/* Barre de recherche améliorée */}
                <div className="max-w-3xl mx-auto px-6 relative z-10 mt-8">
                    <div className="bg-white rounded-2xl text-[var(--color-dark)] shadow-2xl p-2 flex items-center">
                        <div className="flex-1">
                            <TextInput
                                type="text"
                                value={searchInput}
                                onChange={handleSearch}
                                placeholder="Rechercher une elections..."
                                iconLeft={Search}
                                className="w-full bg-transparent border-0 focus:ring-0 text-lg"
                            />
                        </div>

                        {(query.search || query.status !== 'all') && (
                            <div >
                                <button
                                    onClick={handleReset}
                                    className="flex items-center btn-primary gap-1 rounded-xl transition shrink-0"
                                >
                                    <RefreshCw size={18} className='text-[var(--color-primary)]' /> Réinitialiser
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Filtres */}
            <div className="max-w-7xl mx-auto px-6 py-8">
                <div className="flex flex-wrap gap-3">
                    {filters.map((filter) => (
                        <button
                            key={filter.value}
                            onClick={() => {
                                setActiveFilter(filter.value);
                                setQuery(prev => ({ ...prev, page: 1, status: filter.value }));
                            }}
                            className={`px-8 py-3 rounded-xl font-medium transition-all ${activeFilter === filter.value
                                ? 'border-b-4 border-b-[var(--color-primary)] text-[var(--color-primary)]'
                                : 'bg-white hover:bg-gray-100 text-gray-600 border border-gray-200'
                                }`}
                        >
                            {filter.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Grid des Campagnes */}
            <div className="max-w-7xl mx-auto px-6 pb-20">
                {(() => {
                    if (loading) {
                        return (
                            <div className="h-[calc(100vh-68px)] flex items-center justify-center">
                                <div className="text-center">
                                    <FadeLoader color="#1e40af" size={48} cssOverride={{ display: "block", margin: "0 auto", }} />
                                    <p className="mt-4 text-gray-600">
                                        Chargement de l'élection...
                                    </p>
                                </div>
                            </div>
                        );
                    }
                    if (elections.length === 0) {
                        return (
                            <div className="text-center py-24">
                                <div className="flex justify-center mb-4">
                                    <Gem size={32} color="var(--color-primary)" />
                                </div>
                                <p className="text-gray-600 text-lg font-medium">
                                    {query.search
                                        ? `Aucune élection trouvée pour "${query.search}"`
                                        : `Aucune élection dans cette catégorie.`}
                                </p>
                                <button
                                    onClick={handleReset}
                                    className="mt-4 text-sm text-[var(--color-primary)] hover:underline whitespace-nowrap"
                                >
                                    Voir toutes les élections
                                </button>
                            </div>
                        );
                    }
                    return (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {elections.map((election) => (
                                <div key={election.uuid} className="campaign-card bg-white rounded-xl overflow-hidden shadow-xl group">
                                    <div className="relative">
                                        <img
                                            src={election.banner}
                                            alt={election.title}
                                            className="w-full h-56 object-cover bg-primary/50"
                                        />
                                    </div>

                                    <div className="p-6">
                                        <h3 className="font-semibold text-xl leading-tight mb-3 line-clamp-2">{election.title}</h3>
                                        <p className="text-gray-600 text-sm line-clamp-2 mb-6">{election.description}</p>

                                        <div className="flex justify-between items-end mb-6">
                                            <div className="text-left">
                                                <div className="flex items-center justify-end gap-1.5 text-sm text-gray-500 mb-1">
                                                    <Users className="w-4 h-4" /> {election.statistics.total_votes ?? 0} votes
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="flex items-center gap-1 text-xs text-amber-600">
                                                    <Clock className="w-3.5 h-3.5" />
                                                    {election.statistics.remaining_time ?? '-'}
                                                </div>
                                            </div>
                                        </div>

                                        <Link
                                            to={`/elections/${election.uuid}`}
                                            className="block w-full py-3 text-center bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)]
                                            text-white font-semibold rounded-[var(--radius-md)] transition-all active:scale-[0.985] whitespace-nowrap"
                                        >
                                            Voir l'election
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )
                })()}
                {/* pagination */}
                {!loading && meta.last_page > 1 && (
                    <div className="flex items-center justify-between mt-10">
                        <p className="text-sm text-[var(--color-gray)]">
                            Page {meta.current_page} sur {meta.last_page} — {meta.total} résultat(s)
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setQuery(prev => ({ ...prev, page: meta.current_page - 1 }))}
                                disabled={meta.current_page === 1}
                                className="flex items-center gap-1 px-3 py-2 border border-gray-200 rounded-[var(--radius-md)] text-sm disabled:opacity-50 hover:bg-gray-50 transition-colors"
                            >
                                <ChevronLeft size={16} /> Précédent
                            </button>
                            <button
                                onClick={() => setQuery(prev => ({ ...prev, page: meta.current_page + 1 }))}
                                disabled={meta.current_page === meta.last_page}
                                className="flex items-center gap-1 px-3 py-2 border border-gray-200 rounded-[var(--radius-md)] text-sm disabled:opacity-50 hover:bg-gray-50 transition-colors"
                            >
                                Suivant <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
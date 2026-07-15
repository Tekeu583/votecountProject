// src/pages/votePublic/ElectionsOpenForCandidacy.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Search, Users, Clock, RefreshCw, Gem, ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { FadeLoader } from 'react-spinners';
import TextInput from '@components/ui/TextInput.jsx';
import { electionsApi } from '@services/api';
import { useNavigate } from 'react-router-dom';
import { useDebounce } from '@hooks/useDebounce';

export default function ElectionsOpenForCandidacy() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [query, setQuery] = useState({ page: 1, search: '' });
    const [elections, setElections] = useState([]);
    const [meta, setMeta] = useState({});

    useEffect(() => {
        const fetchElections = async () => {
            try {
                setLoading(true);
                const response = await electionsApi.openForCandidacy({
                    page: query.page,
                    search: query.search || undefined,
                    per_page: 15,
                });
                setElections(response.data?.data ?? []);
                setMeta(response.data?.meta ?? {});
            } catch (error) {
                console.error('Error:', error);
                setElections([]);
            } finally {
                setLoading(false);
            }
        };

        fetchElections();
    }, [query.page, query.search]);

    const [searchInput, setSearchInput] = useState('');
    const debouncedSearch = useDebounce(searchInput, 1000);
    useEffect(() => {
        setQuery(prev => ({ ...prev, page: 1, search: debouncedSearch }));
    }, [debouncedSearch]);

    const handleSearch = useCallback((e) => {
        setSearchInput(e.target.value);
    }, []);

    const handleReset = () => {
        setSearchInput('');
        setQuery({ page: 1, search: '' });
    };

    return (
        <div className="bg-gray-50 min-h-screen">
            <div className="bg-gradient-to-br from-[#0A1428] via-blue-950 to-[#0A1428] pt-16 pb-10 text-white">
                <div className="max-w-5xl mx-auto text-center px-6">
                    <h1 className="text-xl md:text-2xl font-bold tracking-tighter leading-none mb-6">
                        Élections en attente de candidature
                    </h1>
                    <p className="text-sm text-blue-100">
                        Postulez pour représenter votre candidature dans l'une de ces élections.
                    </p>
                </div>

                <div className="max-w-3xl mx-auto px-6 relative z-10 mt-8">
                    <div className="bg-white rounded-2xl text-[var(--color-dark)] shadow-2xl p-2 flex items-center">
                        <div className="flex-1">
                            <TextInput
                                type="text"
                                value={searchInput}
                                onChange={handleSearch}
                                placeholder="Rechercher une élection..."
                                iconLeft={Search}
                                className="w-full bg-transparent border-0 focus:ring-0 text-lg"
                            />
                        </div>
                        {query.search && (
                            <button
                                onClick={handleReset}
                                className="flex items-center btn-primary gap-1 rounded-xl transition shrink-0"
                            >
                                <RefreshCw size={18} className='text-[var(--color-primary)]' /> Réinitialiser
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-12">
                {(() => {
                    if (loading) {
                        return (
                            <div className="h-[calc(100vh-68px)] flex items-center justify-center">
                                <div className="text-center">
                                    <FadeLoader color="#1e40af" cssOverride={{ display: 'block', margin: '0 auto' }} />
                                    <p className="mt-4 text-gray-600">Chargement...</p>
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
                                        : `Aucune élection n'attend de candidature pour le moment.`}
                                </p>
                            </div>
                        );
                    }
                    return (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {elections.map((election) => (
                                <div key={election.uuid} className="bg-white rounded-xl overflow-hidden shadow-xl group">
                                    <img
                                        src={election.banner || 'https://via.placeholder.com/600x300'}
                                        alt={election.title}
                                        loading="lazy"
                                        className="w-full h-56 object-cover"
                                    />
                                    <div className="p-6">
                                        <h3 className="font-semibold text-xl leading-tight mb-2 line-clamp-2">{election.title}</h3>
                                        <p className="text-sm text-gray-500 mb-4">{election.organization?.name}</p>

                                        <div className="flex items-center gap-1.5 text-sm text-amber-600 mb-6">
                                            <Clock className="w-4 h-4" />
                                            Candidatures jusqu'au {election.candidacy_end_at ? new Date(election.candidacy_end_at).toLocaleDateString('fr-FR') : 'N/A'}
                                        </div>

                                        <button
                                            onClick={() => navigate(`/elections/${election.uuid}/candidates`)}
                                            className="w-full flex items-center justify-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-primary)] px-4 py-3 text-white font-semibold transition hover:bg-[var(--color-primary)]/85"
                                        >
                                            Candidater <ArrowRight size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    );
                })()}

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

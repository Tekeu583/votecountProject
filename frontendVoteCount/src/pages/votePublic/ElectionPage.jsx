// src/pages/votePublic/ElectionPage.jsx
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { electionsApi } from '@services/api';
import { FadeLoader } from 'react-spinners';
import toast from 'react-hot-toast';

export default function ElectionPage() {
    const { electionUuid } = useParams();
    const [loading, setLoading] = useState(true);
    const [election, setElection] = useState(null);
    const [categories, setCategories] = useState([]);

    useEffect(() => {
        const fetchElectionData = async () => {
            try {
                setLoading(true);
                const response = await electionsApi.getElectionWithCategories(electionUuid);
                setElection(response.data.election);
                setCategories(response.data.categories);
            } catch (error) {
                console.error('Error:', error);
                toast.error('Erreur de chargement des catégories');
            } finally {
                setLoading(false);
            }
        };
        fetchElectionData();
    }, [electionUuid]);

    if (loading) {
        return (
            <div className="h-[calc(100vh-68px)] flex items-center justify-center">
                <div className="text-center">
                    <FadeLoader color="#1e40af" cssOverride={{ display: 'block', margin: '0 auto' }} />
                    <p className="mt-4 text-gray-600">Chargement des catégories...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="pt-24 pb-16">
            <div
                className="relative h-64 bg-cover bg-center"
                style={{ backgroundImage: election?.banner ? `url(${election.banner})` : undefined }}
            >
                <div className="absolute inset-0 bg-black/50" />
                <div className="relative z-10 flex flex-col items-center justify-center h-full text-white px-6 text-center">
                    <h1 className="text-3xl md:text-4xl font-bold">{election?.title}</h1>
                    <p className="mt-2 text-lg opacity-90">Choisissez une catégorie pour voter</p>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-6 py-10">
                {categories.length === 0 ? (
                    <p className="text-center text-gray-500 py-12">Aucune catégorie pour cette élection.</p>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {categories.map(cat => (
                            <Link
                                key={cat.uuid}
                                to={`/elections/${electionUuid}/categories/${cat.uuid}`}
                                className="group rounded-xl overflow-hidden border border-gray-100 shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl bg-white"
                            >
                                <div
                                    className="h-32 bg-cover bg-center"
                                    style={{
                                        backgroundColor: cat.color || 'var(--color-primary)',
                                        backgroundImage: cat.banner ? `url(${cat.banner})` : undefined,
                                    }}
                                />
                                <div className="p-5">
                                    <h3 className="font-semibold text-lg flex items-center gap-2">
                                        {cat.icon && <img src={cat.icon} alt="" className="w-5 h-5" />}
                                        {cat.name}
                                    </h3>
                                    {cat.description && (
                                        <p className="text-sm text-gray-500 mt-1 line-clamp-2">{cat.description}</p>
                                    )}
                                    <p className="text-sm text-[var(--color-primary)] mt-3 font-medium">
                                        {cat.candidates_count} candidat{cat.candidates_count > 1 ? 's' : ''}
                                    </p>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

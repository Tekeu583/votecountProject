// pages/ElectionPage.jsx
import { useState, useEffect } from 'react';
import { electionsApi } from '@services/api';

export default function ElectionPage ({ electionUuid }) {
    const [election, setElection] = useState(null);
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(null);

    useEffect(() => {
        const fetchElectionData = async () => {
            const response = await electionsApi.get(electionUuid);
            setElection(response.data.election);
            setCategories(response.data.categories);
        };
        fetchElectionData();
    }, [electionUuid]);



    return (
        <div>
            {/* Banner de la catégorie sélectionnée OU banner de l'élection */}
            <div className="relative h-64 bg-cover bg-center" style={{
                backgroundImage: selectedCategory?.banner
                    ? `url(${selectedCategory.banner})`
                    : `url(${election?.banner})`
            }}>
                <div className="absolute inset-0 bg-black/40" />
                <div className="relative z-10 flex flex-col items-center justify-center h-full text-white">
                    <h1 className="text-4xl font-bold">
                        {selectedCategory?.name || election?.title}
                    </h1>
                    {selectedCategory?.description && (
                        <p className="mt-2 text-lg">{selectedCategory.description}</p>
                    )}
                </div>
            </div>

            {/* Sélecteur de catégorie */}
            <div className="flex gap-4 p-4 overflow-x-auto">
                {categories.map(cat => (
                    <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-6 py-3 rounded-lg transition-all ${selectedCategory?.id === cat.id
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 hover:bg-gray-200'
                            }`}
                        style={selectedCategory?.id === cat.id ? { backgroundColor: cat.color } : {}}
                    >
                        {cat.icon && <img src={cat.icon} alt="" className="w-5 h-5 inline mr-2" />}
                        {cat.name}
                        <span className="ml-2 text-sm opacity-75">({cat.candidates_count})</span>
                    </button>
                ))}
            </div>

            {/* Liste des candidats de la catégorie sélectionnée */}
            {selectedCategory && (
                <div className="grid md:grid-cols-3 gap-6 p-6">
                    {selectedCategory.candidates.map(candidate => (
                        <CandidateCard key={candidate.id} candidate={candidate} />
                    ))}
                </div>
            )}
        </div>
    );
};
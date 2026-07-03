// pages/ElectionCategoryVotePage.jsx
import { useParams } from 'react-router-dom';
import ElectionCategoryBanner from '../components/ElectionCategoryBanner';
import CandidateCard from '../components/CandidateCard';
import { useState, useEffect } from 'react';
import { api } from '@services/api';

export default function ElectionCategoryVotePage() {
    const { electionUuid, categoryUuid } = useParams();
    const [election, setElection] = useState(null);
    const [category, setCategory] = useState(null);
    const [candidates, setCandidates] = useState([]);

    useEffect(() => {
        const fetchCategoryDetails = async () => {
            const response = await api.get(`/elections/${electionUuid}/categories/${categoryUuid}`);
            setElection(response.data.election);
            setCategory(response.data.category);
            setCandidates(response.data.candidates);
        };
        fetchCategoryDetails();
    }, [electionUuid, categoryUuid]);



    return (
        <div>
            {/* Banner spécifique à la catégorie */}
            <ElectionCategoryBanner
                election={election}
                category={category}
                candidatesCount={candidates.length}
            />

            {/* Liste des candidats de cette catégorie */}
            <div className="max-w-7xl mx-auto px-4 py-12">
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {candidates.map(candidate => (
                        <CandidateCard
                            key={candidate.id}
                            candidate={candidate}
                            categoryColor={category?.color}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};
// src/pages/votePublic/ElectionCategoryVotePage.jsx
import { useParams, useNavigate } from 'react-router-dom';
import ElectionCategoryBanner from '@components/ElectionCategoryBanner';
import CandidateCard from '@components/CandidatCard';
import { useState, useEffect } from 'react';
import { electionsApi, votesApi } from '@services/api';
import { FadeLoader } from 'react-spinners';
import toast from 'react-hot-toast';

export default function ElectionCategoryVotePage() {
    const { electionUuid, categoryUuid } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [election, setElection] = useState(null);
    const [category, setCategory] = useState(null);
    const [candidates, setCandidates] = useState([]);
    const [selectedCandidateId, setSelectedCandidateId] = useState(null);
    const [voting, setVoting] = useState(false);

    useEffect(() => {
        const fetchCategoryDetails = async () => {
            try {
                setLoading(true);
                const response = await electionsApi.getCategoryDetails(electionUuid, categoryUuid);
                setElection(response.data.election);
                setCategory(response.data.category);
                setCandidates(response.data.candidates);
            } catch (error) {
                console.error('Error:', error);
                toast.error('Erreur de chargement de la catégorie');
            } finally {
                setLoading(false);
            }
        };
        fetchCategoryDetails();
    }, [electionUuid, categoryUuid]);

    const submitFreeVote = async (uuid, candidate) => {
        try {
            setVoting(true);
            await votesApi.submitPublic(uuid, {
                items: [{ candidate_id: candidate.uuid }],
                idempotency_key: crypto.randomUUID(),
            });
            toast.success(`Votre vote pour ${candidate.full_name} a été enregistré !`);
            navigate(`/vote/success/${uuid}`, {
                state: { candidate: { full_name: candidate.full_name, photo: candidate.photo }, electionTitle: election?.title, electionUuid: uuid },
            });
        } catch (error) {
            const message = error.response?.data?.message ?? 'Erreur lors du vote. Veuillez réessayer.';
            toast.error(message);
            setSelectedCandidateId(null);
        } finally {
            setVoting(false);
        }
    };

    const handleVote = (uuid, candidate) => {
        if (voting) return;
        setSelectedCandidateId(candidate.uuid);
        submitFreeVote(uuid, candidate);
    };

    const viewCandidateDetails = (uuid, candidate) => {
        navigate(`/details/candidat/election/${uuid}/candidate/${candidate.uuid}`, {
            state: { election: { uuid, title: election?.title, candidateUuid: candidate.uuid } },
        });
    };

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

    return (
        <div className="pt-24 pb-16">
            <div className="max-w-7xl mx-auto px-6">
                <ElectionCategoryBanner
                    election={election}
                    category={category}
                    candidatesCount={candidates.length}
                />

                <div className="py-12">
                    {candidates.length === 0 ? (
                        <p className="text-center text-gray-500 py-12">Aucun candidat approuvé dans cette catégorie pour le moment.</p>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {candidates.map(candidate => (
                                <CandidateCard
                                    key={candidate.uuid}
                                    candidate={candidate}
                                    electionUuid={electionUuid}
                                    isSelected={selectedCandidateId === candidate.uuid}
                                    onVote={handleVote}
                                    viewCandidateDetails={viewCandidateDetails}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

import React, { useState, useEffect, useMemo } from "react";
import {
    Star,
    MessageSquare,
    Send,
} from "lucide-react";
import toast from 'react-hot-toast';
import TextInput from "@components/ui/TextInput";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { juryApi } from '@services/api';
import { FadeLoader } from 'react-spinners';

const JuryEvaluation = () => {
    const { electionId, candidateId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();

    const [candidate, setCandidate] = useState(location.state?.candidate ?? null);
    const [criteria, setCriteria] = useState([]);
    // { [criteriaUuid]: score }
    const [scores, setScores] = useState({});
    const [comment, setComment] = useState("");
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!electionId || !candidateId) return;

        const fetchData = async () => {
            setLoading(true);
            try {
                const [criteriaRes, scoresRes] = await Promise.all([
                    juryApi.getCriteria(electionId),
                    juryApi.getCandidateScores(electionId, candidateId),
                ]);

                const criteriaList = criteriaRes.data?.data ?? [];
                setCriteria(criteriaList);

                const existingScores = scoresRes.data?.data ?? [];
                if (existingScores.length > 0) {
                    const prefilled = {};
                    let lastComment = "";
                    existingScores.forEach((s) => {
                        prefilled[s.criteria_id] = String(s.score);
                        if (s.comment) lastComment = s.comment;
                    });
                    setScores(prefilled);
                    setComment(lastComment);
                }

                if (!candidate) {
                    const candidatesRes = await juryApi.getCandidates(electionId);
                    const found = (candidatesRes.data?.data ?? []).find((c) => c.uuid === candidateId);
                    if (found) setCandidate(found);
                }
            } catch {
                toast.error("Impossible de charger le formulaire d'évaluation.");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
        // candidate volontairement absent des deps : ne pas refetch si déjà fourni par navigate(state)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [electionId, candidateId]);

    const handleChange = (criteriaUuid, value) => {
        setScores((prev) => ({ ...prev, [criteriaUuid]: value }));
    };

    const isValid = useMemo(() => {
        if (criteria.length === 0) return false;
        return criteria.every((c) => {
            const v = scores[c.uuid];
            return v !== undefined && v !== '' && Number(v) >= 0 && Number(v) <= c.max_score;
        });
    }, [criteria, scores]);

    const handleSubmit = async () => {
        if (!isValid) {
            toast.error('Veuillez renseigner une note valide pour chaque critère.');
            return;
        }

        setSubmitting(true);
        try {
            await juryApi.submitScore(electionId, {
                candidate_id: candidateId,
                scores: criteria.map((c) => ({ criteria_id: c.uuid, score: Number(scores[c.uuid]) })),
                comment: comment || null,
            });
            toast.success('Évaluation enregistrée avec succès');
            navigate(`/jury/candidats/${electionId}`);
        } catch (error) {
            toast.error(error.response?.data?.message ?? "Erreur lors de l'enregistrement");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="h-[calc(100vh-68px)] flex items-center justify-center">
                <FadeLoader color="#1e40af" cssOverride={{ display: 'block', margin: '0 auto' }} />
            </div>
        );
    }

    return (

        <div className="flex p-4 bg-[var(--color-background-white)]">
            {/* MAIN */}
            < div className="flex-1" >
                {/* HEADER */}
                <div className="flex flex-col lg:flex-row justify-between gap-4 mb-6" >
                    <div>
                        <h2 className="text-xl font-semibold">Évaluez {candidate ? candidate.full_name : ""}</h2>
                        {candidate?.candidate_number && (
                            <p className="text-gray-500 text-sm">Candidat n°{candidate.candidate_number}</p>
                        )}
                    </div>
                </div>

                {criteria.length === 0 ? (
                    <div className="bg-white p-6 rounded-xl shadow-sm text-center text-gray-500">
                        Aucun critère de notation n'a encore été configuré pour cette élection.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                        {/* LEFT CONTENT */}
                        <div className="lg:col-span-2 space-y-6">

                            {/* CRITERES */}
                            <div className="bg-white p-6 rounded-xl shadow-sm">
                                <div className="flex items-center gap-2 mb-6">
                                    <Star size={18} />
                                    <h3 className="font-semibold">Critères d'évaluation</h3>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {criteria.map((c) => (
                                        <div key={c.uuid}>
                                            <label className="text-sm text-gray-600">
                                                {c.name} <span className="text-gray-400">(/{c.max_score})</span>
                                            </label>
                                            <TextInput
                                                type="number"
                                                min="0"
                                                max={c.max_score}
                                                value={scores[c.uuid] ?? ''}
                                                onChange={(e) => handleChange(c.uuid, e.target.value)}
                                                placeholder={`0 - ${c.max_score}`}
                                                className="mt-1 w-full px-3 py-2"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* COMMENT */}
                            <div className="bg-white p-6 rounded-xl shadow-sm">
                                <div className="flex items-center gap-2 mb-4">
                                    <MessageSquare size={18} />
                                    <h3 className="font-semibold">Commentaire</h3>
                                </div>

                                <textarea
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    rows={5}
                                    placeholder="Votre évaluation..."
                                    className="w-full border border-[var(--color-gray-light)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent rounded-lg px-3 py-2"
                                />
                            </div>
                        </div>

                        {/* RIGHT PANEL */}
                        <div className="space-y-6">
                            {/* SUBMIT */}
                            <button
                                onClick={handleSubmit}
                                disabled={submitting || !isValid}
                                className="w-full btn-primary py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                <Send size={18} />
                                {submitting ? 'Enregistrement...' : "Valider l'évaluation"}
                            </button>
                        </div>
                    </div>
                )}
            </div >
        </div>
    );
};

export default JuryEvaluation;

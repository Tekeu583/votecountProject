// src/pages/VotePrivate/CandidateDetails.jsx

import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    ArrowLeft, Vote, CheckCircle2, Trophy, Medal,
    Loader2, Users, Star,
} from 'lucide-react';
const CandidateDetails = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const {
        candidate,
        election,
        sessionToken,
        electorName,
    } = location.state ?? {};

    const [voting, setVoting] = useState(false);

    // Redirection si accès direct sans session
    useEffect(() => {
        if (!candidate || !election || !sessionToken) {
            navigate('/vote', { replace: true });
        }
    }, [candidate, election, sessionToken, navigate]);

    if (!candidate || !election) return null;

    const handleVote = () => {
        if (voting) return;
        setVoting(true);

        navigate(`/vote/private/${election.uuid}/confirm`, {
            state: {
                sessionToken,
                candidate: { uuid: candidate.uuid, full_name: candidate.full_name, photo: candidate.photo },
                electionTitle: election.title,
            },
        });
    };


    // Manifeste : peut être une string ou un tableau (selon les données)
    const manifestoLines = Array.isArray(candidate.manifesto)
        ? candidate.manifesto
        : candidate.manifesto
            ? [candidate.manifesto]
            : [];

    return (
        <div className="bg-[var(--color-background-white)] pt-18 min-h-screen pb-16 px-4 md:px-6">

            {/* Bouton retour */}
            <div className="max-w-6xl mx-auto pt-4 mb-6">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-[var(--color-gray)] hover:text-[var(--color-dark)] font-medium transition"
                >
                    <ArrowLeft size={20} />
                    Retour aux candidats
                </button>
            </div>

            <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* ── Colonne principale ───────────────────────── */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Photo + infos principales */}
                    <div className="bg-[var(--color-white)] rounded-2xl p-5 shadow-sm flex flex-col md:flex-row gap-6">

                        {/* Photo */}
                        <div className="relative w-full md:w-64 h-64 md:h-auto flex-shrink-0 rounded-xl overflow-hidden bg-gray-100">
                            <img
                                src={candidate.photo}
                                alt={candidate.full_name}
                                className="w-full h-full object-cover"
                            />

                            {/* Badge numéro candidat */}
                            <div className="absolute top-3 left-3 bg-[var(--color-primary)] text-white px-3 py-1 rounded-[var(--radius-md)] font-bold text-sm shadow">
                                N°{candidate.candidate_number}
                            </div>

                            {/* Badge rang (si disponible) */}
                            {candidate.rank && candidate.rank <= 3 && (
                                <div className="absolute top-3 right-3 bg-yellow-400 p-2 rounded-full shadow-lg">
                                    {candidate.rank === 1
                                        ? <Trophy size={16} className="text-yellow-900" />
                                        : <Medal size={16} className="text-yellow-900" />
                                    }
                                </div>
                            )}
                        </div>

                        {/* Infos + bouton vote */}
                        <div className="flex flex-col justify-between gap-4 flex-1">
                            <div>
                                {/* Catégorie si disponible */}
                                {candidate.category?.name && (
                                    <p className="text-[var(--color-primary)] text-sm font-semibold mb-1">
                                        {candidate.category.name}
                                    </p>
                                )}
                                <h1 className="text-2xl md:text-3xl font-bold text-[var(--color-dark)]">
                                    {candidate.full_name}
                                </h1>
                                <p className="text-[var(--color-gray)] mt-1 text-sm">
                                    {election.title}
                                </p>
                                {candidate.slogan && (
                                    <p className="mt-3 italic text-[var(--color-gray)] text-sm border-l-4 border-[var(--color-primary)] pl-3">
                                        "{candidate.slogan}"
                                    </p>
                                )}
                            </div>

                            {/* Bouton voter */}
                            <button
                                onClick={handleVote}
                                disabled={voting}
                                className="bg-[var(--color-primary)] text-white flex items-center justify-center gap-3 px-6 py-3 rounded-xl font-bold hover:bg-blue-800 transition disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {voting
                                    ? <><Loader2 size={18} className="animate-spin" /> Envoi du code...</>
                                    : <><Vote size={20} /> Voter pour {candidate.full_name.split(' ')[0]}</>
                                }
                            </button>
                        </div>
                    </div>

                    {/* Biographie */}
                    {candidate.bio && (
                        <div className="bg-[var(--color-white)] p-5 rounded-xl shadow-sm">
                            <h2 className="text-xl font-bold mb-4 text-[var(--color-dark)]">Biographie</h2>
                            <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                                {candidate.bio}
                            </p>
                        </div>
                    )}

                    {/* Manifeste / Programme */}
                    {manifestoLines.length > 0 && (
                        <div className="bg-[var(--color-white)] p-5 rounded-xl shadow-sm mb-5">
                            <h2 className="text-xl font-bold mb-4 text-[var(--color-dark)]">Programme</h2>
                            <div className="space-y-3">
                                {manifestoLines.map((line, i) => (
                                    <p key={i} className="text-gray-700 flex items-start gap-3">
                                        <CheckCircle2 size={20} className="text-[var(--color-success)] flex-shrink-0 mt-0.5" />
                                        {line}
                                    </p>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* ── Colonne statistiques ────────────────────── */}
                <div className="space-y-6">

                    {/* Stats */}
                    <div className="bg-[var(--color-white)] p-6 rounded-2xl shadow-sm space-y-4">
                        <h3 className="font-bold text-[var(--color-gray)] uppercase tracking-wider text-sm">
                            Statistiques en temps réel
                        </h3>

                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
                                <Users size={18} className="text-[var(--color-primary)]" />
                                <div>
                                    <p className="text-xs text-[var(--color-gray)]">Votes reçus</p>
                                    <p className="text-xl font-bold text-[var(--color-primary)]">
                                        {(candidate.statistics?.vote_count ?? 0).toLocaleString('fr-FR')}
                                    </p>
                                </div>
                            </div>

                            {candidate.rank && (
                                <div className="flex items-center gap-3">
                                    <Star size={18} className="text-yellow-500" />
                                    <div>
                                        <p className="text-xs text-[var(--color-gray)]">Classement</p>
                                        <p className="text-xl font-bold text-[var(--color-primary)]">
                                            {candidate.rank_label ?? `${candidate.rank}e`}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* CTA vote */}
                    <div className="bg-[var(--color-primary)] p-6 rounded-2xl text-white">
                        <h3 className="text-xl font-bold mb-2">Faites le bon choix</h3>
                        <p className="text-white/80 mb-4 text-sm">Votre voix compte dans cette élection.</p>
                        <button
                            onClick={handleVote}
                            disabled={voting}
                            className="w-full bg-white text-[var(--color-primary)] font-bold py-2.5 rounded-lg hover:bg-gray-50 transition disabled:opacity-60"
                        >
                            {voting ? 'Envoi du code...' : 'Voter maintenant'}
                        </button>
                    </div>

                    {/* Indication électeur */}
                    {electorName && (
                        <div className="bg-gray-50 border border-[var(--color-gray-light)] rounded-xl p-4 text-sm text-[var(--color-gray)]">
                            Vous votez en tant que <strong className="text-[var(--color-dark)]">{electorName}</strong>.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CandidateDetails;
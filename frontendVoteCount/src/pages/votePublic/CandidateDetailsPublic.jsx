import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Medal, Trophy, ArrowLeft, Vote, CheckCircle2, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { FadeLoader } from 'react-spinners';
import { candidatesApi, electionsApi, votesApi } from '@services/api';

const CandidateDetailsPublic = () => {
    const { electionUuid, candidateUuid } = useParams();
    const navigate = useNavigate();
    const { state } = useLocation();
    const [searchParams] = useSearchParams();

    // Visiteur arrivé par un lien de campagne partagé (WhatsApp, Facebook...) :
    // son onglet n'a aucun historique, `navigate(-1)` le ferait sortir du site.
    // On le renvoie donc vers la liste des élections publiques.
    const fromShare = searchParams.get('from') === 'share';
    const goBack = () => (fromShare ? navigate('/elections') : navigate(-1));

    const [loadingPage, setLoadingPage] = useState(false);
    const [voting, setVoting] = useState(false);

    const [election, setElection] = useState(state?.election ?? null);
    const [candidate, setCandidate] = useState(state?.candidate ?? null);

    // ── Charger l'élection si non passée en state ─────────────────
    useEffect(() => {
        if (state?.election) return;
        electionsApi.getPublicShow(electionUuid)
            .then(res => setElection(res.data?.data ?? null))
            .catch(() => toast.error('Erreur de chargement de l\'élection.'));
    }, [electionUuid, state]);

    // ── Charger le candidat ────────────────────────────────────────
    useEffect(() => {
        if (!electionUuid || !candidateUuid) {
            toast.error('Election ou candidat non trouvé');
            return;
        }
        const fetch = async () => {
            setLoadingPage(true);
            try {
                const res = await candidatesApi.get(electionUuid, candidateUuid);
                setCandidate(res.data?.data ?? null);
            } catch (err) {
                if (err.response?.status === 401) {
                    navigate('/unauthorized');
                    return;
                }
                toast.error('Erreur de chargement du candidat.', { duration: 5000 });
            } finally {
                setLoadingPage(false);
            }
        };
        fetch();
    }, [electionUuid, candidateUuid, navigate]);

    // ── Logique de vote adaptée au type d'élection ────────────────
    const handleVote = async () => {
        if (!election || !candidate) return;

        const electionMode = election.election_mode;
        const paymentType = election.payment_type;

        // ── Élection PRIVÉE → rediriger vers le portail d'accès privé
        if (electionMode === 'private') {
            navigate(`/vote/private/${electionUuid}/access`, {
                state: { electionTitle: election.title },
            });
            return;
        }

        // ── Élection PUBLIQUE PAYANTE → rediriger vers le paiement
        if (paymentType === 'paid') {
            navigate(`/vote/payement/${electionUuid}/candidate/${candidateUuid}`, {
                state: {
                    election: {
                        uuid: election.uuid,
                        title: election.title,
                        payment_type: election.payment_type,
                        vote_price: election.vote_price,
                        currency: election.currency,
                        vote_type: election.vote_type,
                    },
                    candidate: {
                        uuid: candidate.uuid,
                        full_name: candidate.full_name,
                        photo: candidate.photo,
                        candidate_number: candidate.candidate_number,
                    },
                },
            });
            return;
        }

        // ── Élection PUBLIQUE GRATUITE → vote direct
        await submitFreeVote();
    };

    const submitFreeVote = async () => {
        setVoting(true);
        try {
            await votesApi.submitPublic(electionUuid, {
                items: [{ candidate_id: candidate.uuid }],
                idempotency_key: crypto.randomUUID(),
            });
            toast.success(`Votre vote pour ${candidate.full_name} a été enregistré !`);
            navigate(`/vote/success/${electionUuid}`, {
                state: {
                    candidate: {
                        full_name: candidate.full_name,
                        photo: candidate.photo,
                    },
                },
            });
        } catch (err) {
            const message = err.response?.data?.message ?? 'Erreur lors du vote. Veuillez réessayer.';
            toast.error(message);
        } finally {
            setVoting(false);
        }
    };

    // ── Label du bouton selon le type d'élection ──────────────────
    const voteButtonLabel = () => {
        if (voting) return (
            <><Loader2 size={18} className="animate-spin" /> Vote en cours...</>
        );
        if (election?.election_mode === 'private') return (
            <><Vote size={20} /> Accéder au vote privé</>
        );
        if (election?.payment_type === 'paid') return (
            <><Vote size={20} /> Voter ({election?.vote_price} {election?.currency})</>
        );
        return <><Vote size={20} /> Voter pour {candidate?.full_name}</>;
    };

    // ── Rendu ──────────────────────────────────────────────────────
    if (loadingPage) {
        return (
            <div className="h-[calc(100vh-68px)] flex items-center justify-center">
                <FadeLoader color="#1e40af" cssOverride={{ display: 'block', margin: '0 auto' }} />
            </div>
        );
    }

    if (!candidate) {
        return (
            <div className="h-[calc(100vh-68px)] flex items-center justify-center">
                <p className="text-gray-600">Candidat non trouvé</p>
            </div>
        );
    }

    // Afficher le bouton vote seulement si l'élection est en cours (ongoing)
    const canVote = election?.status === 'ongoing';

    return (
        <div className="bg-[var(--color-background-white)] pt-18 px-6">
            <div className="gap-2 mb-6">
                <button
                    onClick={goBack}
                    className="flex items-center gap-2 text-gray-900 hover:text-gray-900 font-medium"
                >
                    <ArrowLeft size={20} /> Retour
                </button>
            </div>

            <div className="mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* ── Colonne Principale ── */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-[var(--color-white)] rounded-2xl p-4 shadow-sm flex flex-col md:flex-row gap-6">

                        {/* Photo */}
                        <div className="relative w-full h-full rounded-xl overflow-hidden bg-[var(--color-dark)]">
                            <img
                                src={candidate.photo}
                                alt={candidate.full_name}
                                className="w-full h-full object-cover"
                            />
                            {candidate.rank && (
                                <div className="bg-[var(--color-primary)] absolute backdrop-blur-md px-4 py-2 rounded-[var(--radius-md)] font-bold text-[var(--color-white)] shadow top-3 left-3">
                                    Rang : {candidate.rank_label}
                                </div>
                            )}
                            {candidate.rank && candidate.rank <= 3 && (
                                <div className="absolute top-3 right-3 bg-yellow-400 p-2 rounded-full shadow-lg">
                                    {candidate.rank === 1
                                        ? <Trophy size={16} className="text-yellow-900" />
                                        : <Medal size={16} className="text-yellow-900" />}
                                </div>
                            )}
                        </div>

                        {/* Infos + bouton */}
                        <div className="flex flex-col justify-between gap-4">
                            <div>
                                {candidate?.party && (
                                    <p className="text-blue-600 font-semibold">{candidate.party}</p>
                                )}
                                <h1 className="text-3xl font-bold mt-1">{candidate.full_name}</h1>
                                {election && (
                                    <p className="text-gray-600 mt-2">{election.title}</p>
                                )}

                                {/* Badge type d'élection */}
                                <div className="mt-3 flex gap-2 flex-wrap">
                                    {election?.election_mode === 'private' && (
                                        <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full font-medium">
                                            Vote privé
                                        </span>
                                    )}
                                    {election?.payment_type === 'paid' && (
                                        <span className="text-xs px-2 py-1 bg-amber-100 text-amber-700 rounded-full font-medium">
                                            Vote payant — {election.vote_price} {election.currency}
                                        </span>
                                    )}
                                    {election?.payment_type === 'free' && election?.election_mode !== 'private' && (
                                        <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full font-medium">
                                            Vote gratuit
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Bouton vote — adapté au type */}
                            {canVote ? (
                                <button
                                    onClick={handleVote}
                                    disabled={voting}
                                    className="bg-[var(--color-primary)] text-[var(--color-white)] flex items-center gap-3 px-6 py-3 rounded-xl font-bold hover:bg-blue-800 transition disabled:opacity-60"
                                >
                                    {voteButtonLabel()}
                                </button>
                            ) : (
                                <p className="text-sm text-gray-500 italic">
                                    {election?.status === 'published'
                                        ? 'L\'élection n\'a pas encore commencé.'
                                        : 'L\'élection est terminée.'}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Bio */}
                    {candidate.bio && (
                        <div className="bg-[var(--color-white)] p-4 rounded-xl shadow-sm">
                            <h2 className="text-xl font-bold mb-4">Biographie</h2>
                            <p className="text-gray-700 leading-relaxed">{candidate.bio}</p>
                        </div>
                    )}

                    {/* Programme / Manifesto */}
                    {(candidate?.manifesto || candidate?.program) && (
                        <div className="bg-[var(--color-white)] p-4 mb-5 rounded-xl shadow-sm">
                            <h2 className="text-xl font-bold mb-4">Programme</h2>
                            <p className="text-gray-700 flex leading-relaxed pb-3">
                                <CheckCircle2 size={20} className="text-[var(--color-success)] mr-3 shrink-0" />
                                {candidate.manifesto ?? candidate.program}
                            </p>
                        </div>
                    )}
                </div>

                {/* ── Colonne Statistiques ── */}
                <div className="space-y-6 px-4">
                    <div className="bg-[var(--color-white)] p-6 rounded-2xl shadow-sm space-y-6">
                        <h3 className="font-bold text-gray-400 uppercase tracking-wider text-sm">
                            Statistiques en temps réel
                        </h3>
                        <div className="space-y-2">
                            <p className="text-xl text-[var(--color-dark)]">
                                Voix reçues :{' '}
                                <span className="text-xl font-semibold text-[var(--color-primary)]">
                                    {candidate.statistics?.vote_count ?? 0}
                                </span>
                            </p>
                            <p className="text-xl text-[var(--color-dark)]">
                                Classement :{' '}
                                <span className="text-[var(--color-primary)] text-xl font-semibold">
                                    {candidate.rank_label ?? (candidate.position ? `${candidate.position}e` : '—')}
                                </span>
                            </p>
                            {/* Pourcentage si disponible */}
                            {candidate.statistics?.percentage != null && (
                                <div className="mt-3">
                                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                                        <span>Part des votes</span>
                                        <span>{candidate.statistics.percentage}%</span>
                                    </div>
                                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-[var(--color-primary)] rounded-full transition-all duration-700"
                                            style={{ width: `${candidate.statistics.percentage}%` }}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* CTA vote */}
                    {canVote && (
                        <div className="bg-[var(--color-primary)] p-6 rounded-2xl text-[var(--color-white)]">
                            <h3 className="text-xl font-bold mb-2">Faites le bon choix</h3>
                            <p className="text-[var(--color-white)] mb-4 opacity-90">Chaque voix compte.</p>
                            <button
                                onClick={handleVote}
                                disabled={voting}
                                className="w-full btn-secondary bg-[var(--color-white)] disabled:opacity-60"
                            >
                                {voting ? 'Vote en cours...' : 'Voter maintenant'}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CandidateDetailsPublic;
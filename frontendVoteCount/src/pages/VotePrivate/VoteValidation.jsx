import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, ShieldCheck, RefreshCw, Info, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import TextInput from '@components/ui/TextInput';
import { votesApi } from '@services/api';
import { useVoterSession } from '@hooks/useVoterSession';

const VoteValidation = () => {
    const { electionUuid } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { voterSession, hasActiveSession, endSession } = useVoterSession();

    const { candidate, electionTitle: stateElectionTitle } = location.state ?? {};
    const sessionToken = location.state?.sessionToken ?? voterSession?.sessionToken;
    const electionTitle = stateElectionTitle ?? voterSession?.electionTitle;

    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [isLoading, setIsLoading] = useState(false);
    const [canResend, setCanResend] = useState(false);
    const [requesting, setRequesting] = useState(true);
    const inputRefs = useRef([]);

    // Garde-fou : sans sessionToken/candidate, impossible de continuer ici.
    useEffect(() => {
        if (!sessionToken || !candidate) {
            toast.error('Session expirée. Veuillez recommencer.');
            navigate(
                hasActiveSession(electionUuid)
                    ? `/vote/private/${electionUuid}/candidates`
                    : '/vote',
                { replace: true }
            );
        }
    }, [sessionToken, candidate, electionUuid]);

    // Demande automatique du premier OTP pour ce candidat, au montage.
    useEffect(() => {
        if (!sessionToken || !candidate) return;

        const requestInitialOtp = async () => {
            setRequesting(true);
            try {
                await votesApi.requestOtp(electionUuid, {
                    session_token: sessionToken,
                    candidate_uuid: candidate.uuid,
                });
                inputRefs.current[0]?.focus();
            } catch (error) {
                const message = error.response?.data?.message ?? 'Erreur lors de l\'envoi du code.';
                toast.error(message);
                navigate(`/vote/private/${electionUuid}/candidates`, { replace: true });
            } finally {
                setRequesting(false);
                setCanResend(false);
                setTimeout(() => setCanResend(true), 30000);
            }
        };

        requestInitialOtp();
    }, []);

    const handleOtpChange = (index, value) => {
        if (value.length > 1) return;

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const code = otp.join('');

        if (code.length !== 6) {
            toast.error('Veuillez entrer un code de 6 chiffres');
            return;
        }

        setIsLoading(true);

        try {
            const res = await votesApi.submitPrivate(electionUuid, {
                session_token: sessionToken,
                otp_code: code,
                idempotency_key: crypto.randomUUID(),
            });

            const remaining = res.data?.meta?.remaining_votes ?? 0;
            const freshLiveScores = res.data?.meta?.live_scores ?? null;

            if (remaining > 0) {
                toast.success(`Vote enregistré !`, {
                    icon: <CheckCircle size={20} className="text-green-500" />,
                    duration: 5000,
                });

                navigate(`/vote/private/${electionUuid}/candidates`, {
                    replace: true,
                    state: { liveScoresInitial: freshLiveScores },
                });
                return;
            }
            toast.success('Vote validé avec succès ! Merci pour votre participation.', {
                icon: <CheckCircle size={20} className="text-green-500" />,
                duration: 5000,
            });
            endSession();

            navigate(`/vote/success/${electionUuid}`, {
                state: { candidate: { full_name: candidate.full_name, photo: candidate.photo } },
            });

        } catch (error) {
            const message = error.response?.data?.message ?? 'Code invalide.';
            toast.error(message);
            setOtp(['', '', '', '', '', '']);
            inputRefs.current[0]?.focus();
        } finally {
            setIsLoading(false);
        }
    };

    const resendCode = async () => {
        if (!canResend) return;

        setCanResend(false);
        try {
            await votesApi.requestOtp(electionUuid, {
                session_token: sessionToken,
                candidate_uuid: candidate.uuid,
            });
            toast.success('Code de validation renvoyé par email');
        } catch (error) {
            const message = error.response?.data?.message ?? 'Impossible de renvoyer le code.';
            toast.error(message);
        } finally {
            setTimeout(() => setCanResend(true), 30000);
        }
    };

    if (!sessionToken || !candidate) return null;

    return (
        <div className="bg-[var(--color-background-white)] flex items-center justify-center pt-18 min-h-screen">
            <div className="max-w-md w-full">
                <div className="bg-white rounded-xl shadow-[var(--shadow-md)] p-8 md:p-10">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-gray-900 hover:text-blue-900"
                    >
                        <ArrowLeft size={20} />
                        Retour
                    </button>
                    <div className="flex justify-center mb-8 mt-4">
                        <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center">
                            <ShieldCheck className="w-9 h-9 text-blue-600" />
                        </div>
                    </div>

                    <h1 className="text-3xl font-bold text-center text-gray-900 mb-3">
                        Validation de votre vote
                    </h1>
                    <p className="text-gray-600 text-center mb-2">
                        Vote pour <span className="font-semibold">{candidate.full_name}</span>
                    </p>
                    <p className="text-gray-600 text-center mb-10">
                        {requesting
                            ? 'Envoi du code de confirmation en cours...'
                            : 'Un code de validation a été envoyé à votre adresse email.'}
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div className="flex justify-center gap-3">
                            {otp.map((digit, index) => (
                                <TextInput
                                    key={index}
                                    ref={el => inputRefs.current[index] = el}
                                    type="text"
                                    maxLength="1"
                                    value={digit}
                                    required
                                    disabled={requesting}
                                    placeholder="x"
                                    onChange={(e) => handleOtpChange(index, e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(index, e)}
                                    className="w-12 h-14 text-center text-2xl font-mono border border-[var(--color-gray-light)] rounded-2xl focus:border-blue-600 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                                />
                            ))}
                        </div>
                        <button
                            type="submit"
                            disabled={isLoading || requesting || otp.join('').length !== 6}
                            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-[var(--color-gray-light)] disabled:cursor-not-allowed text-white font-semibold py-4 rounded-[var(--radius-md)] h-12 flex items-center justify-center gap-3 transition-all"
                        >
                            {isLoading ? 'Validation en cours...' : 'Confirmer mon vote'}
                        </button>
                    </form>

                    <div className="mt-8 text-center">
                        <p className="text-sm text-gray-600 mb-2">Vous n'avez pas reçu de code ?</p>
                        <button
                            onClick={resendCode}
                            disabled={!canResend}
                            className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 mx-auto disabled:text-gray-400"
                        >
                            <RefreshCw size={16} className={canResend ? "" : "animate-spin"} />
                            Renvoyer le code
                        </button>
                    </div>

                    <div className="flex items-start gap-3 text-xs text-gray-500 bg-gray-50 p-4 rounded-2xl mt-6">
                        <Info size={18} className="mt-0.5 flex-shrink-0" />
                        <p>
                            Ce processus garantit que chaque vote est unique et authentique.
                            Vos données sont cryptées et traitées conformément à notre politique de confidentialité.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VoteValidation;
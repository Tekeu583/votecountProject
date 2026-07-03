import { useState, useEffect } from 'react';
import { ArrowRight, ShieldCheck, KeyRound } from 'lucide-react';
import toast from 'react-hot-toast';
import TextInput from '@components/ui/TextInput';
import Logo from '@components/Logo';
import MiniFooter from '@components/layouts/Minifooter';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { votesApi } from '@services/api';
import { useVoterSession } from '@hooks/useVoterSession';

const ConfirmAccess = () => {
    const [otp, setOtp] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const { electionUuid } = useParams();
    const location = useLocation();
    const { startSession } = useVoterSession();

    const { access_token, email, electionTitle } = location.state ?? {};

    useEffect(() => {
        if (!access_token) {
            toast.error('Session expirée. Veuillez recommencer.');
            navigate('/vote', { replace: true });
        }
    }, [access_token, electionUuid, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (otp.trim().length !== 6) {
            toast.error('Le code doit contenir 6 chiffres.');
            return;
        }

        setIsLoading(true);

        try {
            const res = await votesApi.verifyAccessOtp(electionUuid, {
                access_token,
                otp: otp.trim(),
            });

            const data = res.data?.data;
            startSession({
                electionId: data.election_id,
                electionUuid,
                sessionToken: data.session_token,
                electorName: data.elector_name,
                electionTitle: data.election_title,
                candidates: data.candidates,
                realTimeResults: data.real_time_results,
                electionBanner: data.election_banner,
                electionDescription: data.election_description,
                liveScoresInitial: data.live_scores,
            });

            navigate(`/vote/private/${electionUuid}/candidates`, {
                state: {
                    sessionToken: data.session_token,
                    electorName: data.elector_name,
                    electionTitle: data.election_title,
                    electionId: data.election_id,
                    realTimeResults: data.real_time_results,
                    candidates: data.candidates,
                    electionBanner: data.election_banner,
                    electionDescription: data.election_description,
                    liveScoresInitial: data.live_scores,

                },
            });

        } catch (error) {
            const status = error.response?.status;
            const message = error.response?.data?.message ?? 'Code invalide.';

            if (status === 429) {
                toast.error('Trop de tentatives. Veuillez recommencer la vérification.');
                navigate('/vote', { replace: true });
            } else {
                toast.error(message);
                setOtp('');
            }
        } finally {
            setIsLoading(false);
        }
    };

    if (!access_token) return null;

    return (
        <div className="bg-[var(--color-background-white)] pt-18 flex items-center justify-center p-4 min-h-screen">
            <div className="max-w-md w-full">
                <div className="bg-white rounded-2xl shadow-xl p-8 md:p-10">
                    <div className="flex justify-center mb-8">
                        <Logo />
                    </div>

                    <h1 className="text-3xl font-bold text-center text-gray-900 mb-2">
                        Vérification
                    </h1>
                    {electionTitle && (
                        <p className="text-center text-[var(--color-primary)] font-medium mb-2">
                            {electionTitle}
                        </p>
                    )}
                    <p className="text-gray-600 text-center mb-10">
                        Un code à 6 chiffres a été envoyé à <span className="font-medium">{email}</span>
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <TextInput
                            type="text"
                            value={otp}
                            name="otp"
                            label="Code de vérification"
                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            placeholder="••••••"
                            iconLeft={KeyRound}
                            required
                            className="w-full text-center text-2xl tracking-[0.5em]"
                            maxLength={6}
                        />

                        <button
                            type="submit"
                            disabled={isLoading || otp.length !== 6}
                            className="w-full btn-primary font-semibold py-4 flex items-center justify-center gap-3 transition-all active:scale-[0.98]"
                        >
                            {isLoading ? 'Vérification en cours...' : <>Valider <ArrowRight size={20} /></>}
                        </button>
                    </form>
                </div>

                <div className="relative pt-17 flex flex-col items-center gap-4 text-xs text-gray-500">
                    <div className="absolute top-0 items-center justify-center py-1 flex gap-6">
                        <div className="flex items-center gap-1.5">
                            <ShieldCheck size={16} />
                            <span>Plateforme Certifiée</span>
                        </div>
                    </div>
                    <MiniFooter />
                </div>
            </div>
        </div>
    );
};

export default ConfirmAccess;
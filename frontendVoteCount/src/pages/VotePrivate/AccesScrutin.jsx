import { useState } from 'react';
import { ArrowRight, ShieldCheck, Lock, Mail } from 'lucide-react';
import toast from 'react-hot-toast';
import TextInput from '@components/ui/TextInput';
import Logo from '@components/Logo';
import MiniFooter from '@components/layouts/Minifooter';
import { useNavigate, useLocation } from 'react-router-dom';
import { votesApi } from '@services/api';

const AccesScrutin = () => {
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const electionTitle = location.state?.electionTitle;

    const [form, setForm] = useState({
        email: '',
        code: '',
    });

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!form.code.trim() || !form.email.trim()) {
            toast.error("Veuillez entrer votre adresse email et le code d'élection");
            return;
        }

        setIsLoading(true);

        try {
            const response = await votesApi.verifyAccess({
                voter_code: form.code.trim(),
                email: form.email.trim(),
            });


            const data = response.data?.data || response.data;

            if (response.data?.success) {
                // Récupérer les données
                const accessToken = data?.access_token;
                const expiresIn = data?.expires_in;
                const uuid_election = data?.uuid_election;

                if (!accessToken) {
                    toast.error('Erreur: access_token manquant');
                    return;
                }
                if (!uuid_election) {
                    toast.error('Erreur: identifiant de l\'élection manquant. Contactez le support.');
                    setIsLoading(false);
                    return;
                }
                toast.success("Vous faites partie de la liste électorale, un code vous a été envoyé pouir votre acces a l'election.", { duration: 5000 });

                // Naviguer vers la page suivante
                navigate(`/vote/private/${uuid_election}/confirm-access`, {
                    state: {
                        access_token: accessToken,
                        voter_code: form.code.trim(),
                        email: form.email.trim(),
                        expires_in: expiresIn,
                        electionTitle,
                    },
                });
            } else {
                toast.error(response.data?.message || 'Erreur lors de la vérification');
            }
        } catch (error) {
            // voter_code invalide pour CETTE élection (404) ou élection non privée (400)
            const message = error.response?.data?.message ?? "Code d'élection invalide.";
            toast.error(message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-[var(--color-background-white)] pt-18 flex items-center justify-center p-4 min-h-screen">
            <div className="max-w-md w-full">
                <div className="bg-white rounded-2xl shadow-xl p-8 md:p-10">
                    <div className="flex justify-center mb-8">
                        <Logo />
                    </div>

                    <h1 className="text-3xl font-bold text-center text-gray-900 mb-2">
                        Accès au Scrutin
                    </h1>
                    {electionTitle && (
                        <p className="text-center text-[var(--color-primary)] font-medium mb-2">
                            {electionTitle}
                        </p>
                    )}
                    <p className="text-gray-600 text-center mb-10">
                        Saisissez le code de l'élection ainsi que votre adresse email pour y participer.
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <TextInput
                                type="email"
                                value={form.email}
                                name="email"
                                label="Votre adresse email"
                                onChange={(e) => setForm({ ...form, email: e.target.value })}
                                placeholder="user@example.com"
                                iconLeft={Mail}
                                required
                                className="w-full tracking-widest"
                            />
                        </div>
                        <div>
                            <TextInput
                                type="text"
                                value={form.code}
                                name="code"
                                label="Code de l'élection"
                                onChange={(e) => setForm({ ...form, code: e.target.value })}
                                placeholder="EX: SCR-A2B-7C8"
                                iconLeft={Lock}
                                required
                                className="w-full tracking-widest"
                                maxLength={20}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading || !form.code.trim() || !form.email.trim()}
                            className="w-full btn-primary font-semibold py-4 flex items-center justify-center gap-3 transition-all active:scale-[0.98]"
                        >
                            {isLoading ? (
                                <>Vérification en cours...</>
                            ) : (
                                <>
                                    Continuer <ArrowRight size={20} />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 text-center">
                        <p className="text-sm text-gray-600 mb-3">
                            Vous n'avez pas reçu de code ? Demandez à votre responsable de l'élection.
                        </p>
                    </div>
                </div>

                <div className="relative pt-17 flex flex-col items-center gap-4 text-xs text-gray-500">
                    <div className="absolute top-0 items-center justify-center py-1 flex gap-6">
                        <div className="flex items-center gap-1.5">
                            <ShieldCheck size={16} />
                            <span>Plateforme Certifiée</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Lock size={16} />
                            <span>SSL Sécurisé</span>
                        </div>
                    </div>
                    <MiniFooter />
                </div>
            </div>
        </div>
    );
};

export default AccesScrutin;
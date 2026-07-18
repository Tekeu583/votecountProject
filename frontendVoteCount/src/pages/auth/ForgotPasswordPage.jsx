// src/pages/auth/ForgotPasswordPage.jsx
import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    Mail, ArrowLeft, Send, AlertCircle, Loader2,
    MailCheck, RefreshCw, ShieldCheck, Clock, KeyRound,
} from 'lucide-react';
import TextInput from '@components/ui/TextInput';
import { forgotPassword, verifyResetOtp } from '@services/api';
import Logo from '@components/Logo';
import MiniFooter from '@components/layouts/Minifooter';

// -- Timer renvoi --------------------------------------------------
function ResendTimer({ onResend, loading }) {
    const [seconds, setSeconds] = useState(60);

    useEffect(() => {
        if (seconds <= 0) return;
        const t = setTimeout(() => setSeconds(s => s - 1), 1000);
        return () => clearTimeout(t);
    }, [seconds]);

    if (seconds > 0) {
        return (
            <div className="flex items-center gap-2 text-sm text-[var(--color-gray)]">
                <Clock size={14} /> Renvoyer dans {seconds}s
            </div>
        );
    }

    return (
        <button
            onClick={() => { setSeconds(60); onResend(); }}
            disabled={loading}
            className="flex items-center gap-2 text-sm text-[var(--color-primary)] hover:underline"
        >
            {loading ? <Loader2 className="animate-spin" size={14} /> : <RefreshCw size={14} />}
            Renvoyer le code
        </button>
    );
}

// -- Étape 1 : saisie email ----------------------------------------
function EmailStep({ onSuccess }) {
    const [email, setEmail]       = useState('');
    const [error, setError]       = useState('');
    const [loading, setLoading]   = useState(false);
    const inputRef = useRef(null);

    useEffect(() => { inputRef.current?.focus(); }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email) return setError('Email requis');
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setError('Email invalide');

        setLoading(true);
        setError('');
        try {
            await forgotPassword({ email });
            onSuccess(email);
        } catch {
            // On affiche le message de succès même en cas d'erreur — anti-énumération
            onSuccess(email);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-[var(--color-dark)]">Mot de passe oublié</h1>
                <p className="text-sm text-[var(--color-gray)] mt-2">
                    Entrez votre email pour recevoir un code de vérification
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <TextInput
                    ref={inputRef}
                    label="Email"
                    name="email"
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(''); }}
                    placeholder="email@example.com"
                    iconLeft={Mail}
                    error={error}
                    required
                />
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 bg-[var(--color-primary)] text-white py-2.5 rounded-[var(--radius-md)] hover:bg-[var(--color-primary-hover)] transition disabled:opacity-70"
                >
                    {loading
                        ? <><Loader2 className="animate-spin" size={16} />Envoi...</>
                        : <><Send size={16} />Envoyer le code</>
                    }
                </button>
            </form>

            <div className="flex items-center gap-2 mt-5 text-xs text-[var(--color-gray)]">
                <ShieldCheck size={14} />
                <p>Le code expire dans 15 minutes.</p>
            </div>
        </>
    );
}

// -- Étape 2 : saisie OTP ------------------------------------------
function OtpStep({ email, onSuccess, onResend }) {
    const [otp, setOtp]           = useState(['', '', '', '', '', '']);
    const [error, setError]       = useState('');
    const [loading, setLoading]   = useState(false);
    const [resending, setResending] = useState(false);
    const refs = Array.from({ length: 6 }, () => useRef(null));

    useEffect(() => { refs[0].current?.focus(); }, []);

    const handleChange = (index, value) => {
        if (!/^\d?$/.test(value)) return;
        const next = [...otp];
        next[index] = value;
        setOtp(next);
        setError('');
        if (value && index < 5) refs[index + 1].current?.focus();
    };

    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            refs[index - 1].current?.focus();
        }
        if (e.key === 'ArrowLeft' && index > 0) refs[index - 1].current?.focus();
        if (e.key === 'ArrowRight' && index < 5) refs[index + 1].current?.focus();
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        const next = [...otp];
        pasted.split('').forEach((char, i) => { next[i] = char; });
        setOtp(next);
        refs[Math.min(pasted.length, 5)].current?.focus();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const code = otp.join('');
        if (code.length < 6) return setError('Saisissez les 6 chiffres du code');

        setLoading(true);
        setError('');
        try {
            const response = await verifyResetOtp({ email, otp: code });
            const resetToken = response.data?.data?.reset_token;
            onSuccess(resetToken);
        } catch (err) {
            const msg = err.response?.data?.message ?? 'Code invalide ou expiré';
            setError(msg);
            // Vider les cases en cas d'erreur
            setOtp(['', '', '', '', '', '']);
            refs[0].current?.focus();
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        setResending(true);
        try {
            await forgotPassword({ email });
        } finally {
            setResending(false);
        }
        setOtp(['', '', '', '', '', '']);
        setError('');
        refs[0].current?.focus();
    };

    return (
        <>
            <div className="text-center mb-6">
                <div className="mx-auto w-16 h-16 rounded-full bg-[var(--color-primary-light)] flex items-center justify-center mb-4">
                    <MailCheck size={30} className="text-[var(--color-primary)]" />
                </div>
                <h1 className="text-2xl font-bold text-[var(--color-dark)]">Vérifiez votre email</h1>
                <p className="text-sm text-[var(--color-gray)] mt-2">
                    Un code à 6 chiffres a été envoyé à
                </p>
                <p className="font-semibold text-[var(--color-primary)]">{email}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Cases OTP */}
                <div className="flex justify-center gap-3" onPaste={handlePaste}>
                    {otp.map((digit, i) => (
                        <input
                            key={i}
                            ref={refs[i]}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            value={digit}
                            onChange={(e) => handleChange(i, e.target.value)}
                            onKeyDown={(e) => handleKeyDown(i, e)}
                            className={`
                                w-12 h-14 text-center text-2xl font-bold
                                border-2 rounded-[var(--radius-md)]
                                focus:outline-none transition
                                ${error
                                    ? 'border-[var(--color-danger)] bg-red-50'
                                    : digit
                                        ? 'border-[var(--color-primary)] bg-[var(--color-primary-light)]'
                                        : 'border-[var(--color-gray-light)] bg-[var(--color-white)]'
                                }
                                focus:border-[var(--color-primary)]
                            `}
                        />
                    ))}
                </div>

                {error && (
                    <div className="flex items-center justify-center gap-2 text-sm text-[var(--color-danger)]">
                        <AlertCircle size={14} />
                        {error}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loading || otp.join('').length < 6}
                    className="w-full flex items-center justify-center gap-2 bg-[var(--color-primary)] text-white py-2.5 rounded-[var(--radius-md)] hover:bg-[var(--color-primary-hover)] transition disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {loading
                        ? <><Loader2 className="animate-spin" size={16} />Vérification...</>
                        : <><KeyRound size={16} />Vérifier le code</>
                    }
                </button>
            </form>

            <div className="flex justify-center mt-6">
                <ResendTimer onResend={handleResend} loading={resending} />
            </div>
        </>
    );
}

// -- Page principale ----------------------------------------------─
export default function ForgotPasswordPage() {
    const navigate = useNavigate();

    // step : 'email' | 'otp' | 'done'
    const [step,  setStep]  = useState('email');
    const [email, setEmail] = useState('');

    const handleEmailSuccess = (submittedEmail) => {
        setEmail(submittedEmail);
        setStep('otp');
    };

    const handleOtpSuccess = (resetToken) => {
        // Naviguer vers la page reset avec le token et l'email
        // Ne jamais stocker le resetToken en localStorage — state React uniquement
        navigate('/auth/reset-password', {
            state: { email, resetToken },
            replace: true,
        });
    };

    const handleResendOtp = async () => {
        await forgotPassword({ email });
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--color-background-white)] px-4">
            <div className="w-full max-w-md bg-[var(--color-white)] p-6 sm:p-8 rounded-[var(--radius-lg)] shadow-[var(--shadow-md)]">

                <Link to="/auth/login" className="flex items-center gap-2 text-sm text-[var(--color-gray)] mb-4 hover:underline">
                    <ArrowLeft size={16} /> Retour à la connexion
                </Link>

                <div className="flex justify-center mb-6">
                    <Logo size="sm" />
                </div>

                {step === 'email' && (
                    <EmailStep onSuccess={handleEmailSuccess} />
                )}

                {step === 'otp' && (
                    <OtpStep
                        email={email}
                        onSuccess={handleOtpSuccess}
                        onResend={handleResendOtp}
                    />
                )}
            </div>
            <MiniFooter />
        </div>
    );
}
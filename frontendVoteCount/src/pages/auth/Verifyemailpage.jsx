import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
    MailCheck, RefreshCw, ArrowLeft, AlertCircle,
    CheckCircle, Clock, ShieldCheck, Loader2,
} from 'lucide-react';
import { ClipLoader } from 'react-spinners';
import Logo from '@components/Logo';
import MiniFooter from '@components/layouts/Minifooter';
import { getCsrfCookie, verifyEmailOtp, verifyEmailLink, resendVerification } from '@services/api';
import { useAuth } from '@hooks/useAuth';
import { getRoleDefaultRoute, getPrimaryRole } from '@utils/roleRoutes';

// ─── Composant : case OTP unique ──────────────────────────────────
const OtpBox = ({ value, onChange, onKeyDown, onPaste, inputRef, index, hasError }) => (
    <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        maxLength={1}
        value={value}
        onChange={(e) => onChange(e, index)}
        onKeyDown={(e) => onKeyDown(e, index)}
        onPaste={(e) => onPaste(e, index)}
        className={`
            w-11 h-13 text-center text-xl font-bold
            border-2 rounded-[var(--radius-md)]
            bg-[var(--color-white)]
            text-[var(--color-dark)]
            transition-all duration-150
            focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent
            ${hasError
                ? 'border-[var(--color-danger)] bg-red-50'
                : value
                    ? 'border-[var(--color-primary)] bg-[var(--color-primary-light)]'
                    : 'border-[var(--color-gray-light)]'
            }
        `}
    />
);

// ─── Composant : timer de renvoi ──────────────────────────────────
const ResendTimer = ({ onResend, loading }) => {
    const [seconds, setSeconds] = useState(60);
    const canResend = seconds <= 0;

    useEffect(() => {
        if (seconds <= 0) return;
        const t = setTimeout(() => setSeconds(s => s - 1), 1000);
        return () => clearTimeout(t);
    }, [seconds]);

    const handle = () => {
        setSeconds(60);
        onResend();
    };

    return canResend ? (
        <button
            onClick={handle}
            disabled={loading}
            className="flex items-center gap-2 text-sm text-[var(--color-primary)] hover:underline disabled:opacity-60"
        >
            {loading
                ? <Loader2 size={14} className="animate-spin" />
                : <RefreshCw size={14} />
            }
            Renvoyer le code
        </button>
    ) : (
        <div className="flex items-center gap-2 text-sm text-[var(--color-gray)]">
            <Clock size={14} />
            Renvoyer dans {seconds}s
        </div>
    );
};

// ─── Page principale ──────────────────────────────────────────────
export default function VerifyEmailPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const { setAuth, refreshUser } = useAuth();

    // Email transmis depuis RegisterPage via navigate state
    const email = location.state?.email ?? searchParams.get('email') ?? '';
    const successMessage = location.state?.message ?? '';

    // Vérification via lien magique (?token=xxx&email=xxx)
    const tokenFromUrl = searchParams.get('token');

    const [digits, setDigits] = useState(Array(6).fill(''));
    const [loading, setLoading] = useState(false);
    const [resendLoading, setResendLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [linkVerifying, setLinkVerifying] = useState(!!tokenFromUrl);

    const inputRefs = useRef([]);

    // ── Vérification automatique via lien magique ─────────────────
    useEffect(() => {
        if (!tokenFromUrl || !email) return;

        const verifyLink = async () => {
            try {
                const res = await verifyEmailLink(tokenFromUrl, email);
                const user = res.data?.data?.user;
                if (user) {
                    setSuccess('Email vérifié ! Redirection...');
                    setAuth(user);
                    refreshUser?.();
                    setTimeout(() => {
                        navigate(getRoleDefaultRoute(getPrimaryRole(user)), { replace: true });
                    }, 1500);
                }
            } catch (err) {
                setLinkVerifying(false);
                setError(
                    err.response?.data?.message
                    ?? 'Lien invalide ou expiré. Saisissez votre code ci-dessous.'
                );
            }
        };

        verifyLink();
    }, [tokenFromUrl, email, navigate, setAuth, refreshUser]);

    useEffect(() => {
        // location.state?.fromLogin indique qu'on vient du LoginPage
        // Si pas de token dans l'URL (lien magique) et qu'on a l'email
        if (!tokenFromUrl && email && location.state?.resend) {
            handleResend();
        }
    }, []);

    // ── Focus premier champ au montage ────────────────────────────
    useEffect(() => {
        if (!linkVerifying) {
            inputRefs.current[0]?.focus();
        }
    }, [linkVerifying]);

    // ── Gestion des cases OTP ─────────────────────────────────────
    const handleChange = useCallback((e, index) => {
        const val = e.target.value.replace(/\D/g, '');
        if (!val) return;

        const newDigits = [...digits];
        newDigits[index] = val[0];
        setDigits(newDigits);
        setError('');

        // Avancer au prochain champ
        if (index < 5) {
            inputRefs.current[index + 1]?.focus();
        }

        // Auto-submit si toutes les cases sont remplies
        if (newDigits.every(d => d !== '') && index === 5) {
            submitOtp(newDigits.join(''));
        }
    }, [digits]);

    const handleKeyDown = useCallback((e, index) => {
        if (e.key === 'Backspace') {
            e.preventDefault();
            const newDigits = [...digits];
            if (newDigits[index]) {
                newDigits[index] = '';
                setDigits(newDigits);
            } else if (index > 0) {
                newDigits[index - 1] = '';
                setDigits(newDigits);
                inputRefs.current[index - 1]?.focus();
            }
        } else if (e.key === 'ArrowLeft' && index > 0) {
            inputRefs.current[index - 1]?.focus();
        } else if (e.key === 'ArrowRight' && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    }, [digits]);

    const handlePaste = useCallback((e) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        if (!pasted) return;

        const newDigits = Array(6).fill('');
        pasted.split('').forEach((char, i) => {
            newDigits[i] = char;
        });
        setDigits(newDigits);
        setError('');

        // Focus sur la dernière case remplie
        const lastIndex = Math.min(pasted.length - 1, 5);
        inputRefs.current[lastIndex]?.focus();

        // Auto-submit si complet
        if (pasted.length === 6) {
            submitOtp(pasted);
        }
    }, []);

    // ── Soumission OTP ────────────────────────────────────────────
    const submitOtp = useCallback(async (code) => {
        if (!email) {
            setError('Email manquant. Retournez à la page de connexion.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const res = await verifyEmailOtp({ email, otp: code });
            const user = res.data?.data?.user;
            console.log(user);
            if (user) {
                setAuth(user);
                refreshUser?.();
                setSuccess('Email vérifié avec succès ! Bienvenue 🎉');
                setTimeout(() => {
                    navigate(getRoleDefaultRoute(getPrimaryRole(user)), { replace: true });
                }, 1200);
            }
        } catch (err) {
            console.log(err);
            const data = err.response?.data;
            setError(data?.message ?? 'Code incorrect ou expiré.');
            // Vider les cases en cas d'erreur
            setDigits(Array(6).fill(''));
            inputRefs.current[0]?.focus();
        } finally {
            setLoading(false);
        }
    }, [email, navigate, setAuth, refreshUser]);

    const handleSubmit = (e) => {
        e.preventDefault();
        const code = digits.join('');
        if (code.length < 6) {
            setError('Saisissez les 6 chiffres du code.');
            return;
        }
        submitOtp(code);
    };

    // ── Renvoi du code ────────────────────────────────────────────
    const handleResend = async () => {
        if (!email) return;
        setResendLoading(true);
        setError('');

        try {
            await getCsrfCookie();
            await resendVerification({ email });
            setSuccess('Un nouveau code vous a été envoyé.');
            setDigits(Array(6).fill(''));
            inputRefs.current[0]?.focus();
            setTimeout(() => setSuccess(''), 4000);
        } catch (err) {
            setError(
                err.response?.data?.message
                ?? 'Impossible de renvoyer le code. Réessayez.'
            );
        } finally {
            setResendLoading(false);
        }
    };

    // ── Écran de vérification du lien magique ─────────────────────
    if (linkVerifying) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--color-background-white)]">
                <div className="text-center space-y-4">
                    <Loader2 size={40} className="animate-spin text-[var(--color-primary)] mx-auto" />
                    <p className="text-[var(--color-gray)]">Vérification du lien en cours...</p>
                </div>
            </div>
        );
    }

    const allFilled = digits.every(d => d !== '');

    return (
        <div className="min-h-screen relative flex flex-col items-center justify-center bg-[var(--color-background-white)] px-4 pb-16">

            <div className="w-full max-w-md bg-[var(--color-white)] p-8 rounded-[var(--radius-lg)] shadow-[var(--shadow-md)]">

                {/* Logo */}
                <div className="flex justify-center mb-6">
                    <Logo size="sm" />
                </div>

                {/* Icône */}
                <div className="flex justify-center mb-5">
                    <div className="w-16 h-16 rounded-full bg-[var(--color-primary-light)] flex items-center justify-center">
                        <MailCheck size={32} className="text-[var(--color-primary)]" />
                    </div>
                </div>

                {/* Titre */}
                <div className="text-center mb-6">
                    <h1 className="text-2xl font-bold text-[var(--color-dark)]">
                        Vérifiez votre email
                    </h1>
                    <p className="text-sm text-[var(--color-gray)] mt-2 leading-relaxed">
                        Un code à 6 chiffres a été envoyé à
                    </p>
                    <p className="text-sm font-semibold text-[var(--color-primary)] mt-1">
                        {email || 'votre adresse email'}
                    </p>
                </div>

                {/* Message succès depuis register */}
                {successMessage && !success && (
                    <div className="mb-4 flex items-center gap-2 text-sm text-[var(--color-success)] bg-green-50 border border-green-200 rounded-[var(--radius-md)] px-3 py-2">
                        <CheckCircle size={16} />
                        {successMessage}
                    </div>
                )}

                {/* Succès */}
                {success && (
                    <div className="mb-4 flex items-center gap-2 text-sm text-[var(--color-success)] bg-green-50 border border-green-200 rounded-[var(--radius-md)] px-3 py-2">
                        <CheckCircle size={16} />
                        {success}
                    </div>
                )}

                {/* Erreur */}
                {error && (
                    <div className="mb-4 flex items-center gap-2 text-sm text-[var(--color-danger)] bg-red-50 border border-red-200 rounded-[var(--radius-md)] px-3 py-2">
                        <AlertCircle size={16} />
                        {error}
                    </div>
                )}

                {/* Cases OTP */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="text-sm text-[var(--color-gray-dark)] block mb-3 text-center">
                            Code de vérification
                        </label>
                        <div className="flex justify-center gap-2">
                            {digits.map((digit, i) => (
                                <OtpBox
                                    key={i}
                                    index={i}
                                    value={digit}
                                    onChange={handleChange}
                                    onKeyDown={handleKeyDown}
                                    onPaste={handlePaste}
                                    inputRef={(el) => (inputRefs.current[i] = el)}
                                    hasError={!!error}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Bouton vérifier */}
                    <button
                        type="submit"
                        disabled={loading || !allFilled}
                        className="
                            w-full flex items-center justify-center gap-2
                            bg-[var(--color-primary)] text-white
                            py-2.5 rounded-[var(--radius-md)]
                            hover:bg-[var(--color-primary-hover)] transition
                            disabled:opacity-60 disabled:cursor-not-allowed
                        "
                    >
                        {loading ? (
                            <>
                                <ClipLoader color="#fff" size={16} />
                                Vérification...
                            </>
                        ) : (
                            <>
                                <ShieldCheck size={16} />
                                Vérifier mon email
                            </>
                        )}
                    </button>
                </form>

                {/* Renvoi */}
                <div className="flex justify-center mt-5">
                    <ResendTimer onResend={handleResend} loading={resendLoading} />
                </div>

                {/* Note expiration */}
                <p className="text-center text-xs text-[var(--color-gray)] mt-4">
                    Le code expire dans <strong>10 minutes</strong>.
                </p>

                {/* Retour login */}
                <div className="flex justify-center mt-5">
                    <Link
                        to="/auth/login"
                        className="flex items-center gap-2 text-sm text-[var(--color-gray)] hover:text-[var(--color-primary)] transition"
                    >
                        <ArrowLeft size={14} />
                        Retour à la connexion
                    </Link>
                </div>

            </div>

            <MiniFooter />
        </div>
    );
}
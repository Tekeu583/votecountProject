import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import {
    KeyRound, Eye, EyeOff, ShieldCheck, AlertCircle,
    CheckCircle, ArrowLeft, Lock, Loader2, RefreshCw, Clock,
} from 'lucide-react';
import { ClipLoader } from 'react-spinners';
import TextInput from '@components/ui/TextInput';
import Logo from '@components/Logo';
import MiniFooter from '@components/layouts/Minifooter';
import { verifyResetOtp, resetPassword, forgotPassword } from '@services/api';

// --- Case OTP ----------------------------------------------------
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
            bg-[var(--color-white)] text-[var(--color-dark)]
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

// --- Timer renvoi ------------------------------------------------─
const ResendTimer = ({ onResend, loading }) => {
    const [seconds, setSeconds] = useState(60);
    const canResend = seconds <= 0;

    useEffect(() => {
        if (seconds <= 0) return;
        const t = setTimeout(() => setSeconds(s => s - 1), 1000);
        return () => clearTimeout(t);
    }, [seconds]);

    const handle = () => { setSeconds(60); onResend(); };

    return canResend ? (
        <button
            onClick={handle}
            disabled={loading}
            className="flex items-center gap-2 text-sm text-[var(--color-primary)] hover:underline disabled:opacity-60"
        >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
            Renvoyer le code
        </button>
    ) : (
        <div className="flex items-center gap-2 text-sm text-[var(--color-gray)]">
            <Clock size={14} />
            Renvoyer dans {seconds}s
        </div>
    );
};

// --- Indicateur de force mot de passe ---------------------------─
const getPasswordStrength = (pwd) => {
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;

    if (score <= 1) return { label: 'Faible', color: 'var(--color-danger)', width: '25%' };
    if (score === 2) return { label: 'Moyen', color: 'var(--color-warning)', width: '50%' };
    if (score === 3) return { label: 'Bon', color: 'var(--color-info)', width: '75%' };
    return { label: 'Fort', color: 'var(--color-success)', width: '100%' };
};

// --- Étape 1 : saisie OTP ----------------------------------------
function OtpStep({ email, onVerified, onResend, resendLoading }) {
    const [digits, setDigits] = useState(Array(6).fill(''));
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const inputRefs = useRef([]);

    useEffect(() => { inputRefs.current[0]?.focus(); }, []);

    const handleChange = useCallback((e, index) => {
        const val = e.target.value.replace(/\D/g, '');
        if (!val) return;
        const newDigits = [...digits];
        newDigits[index] = val[0];
        setDigits(newDigits);
        setError('');
        if (index < 5) inputRefs.current[index + 1]?.focus();
        if (newDigits.every(d => d !== '') && index === 5) submitOtp(newDigits.join(''));
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
        pasted.split('').forEach((c, i) => { newDigits[i] = c; });
        setDigits(newDigits);
        setError('');
        inputRefs.current[Math.min(pasted.length - 1, 5)]?.focus();
        if (pasted.length === 6) submitOtp(pasted);
    }, []);

    const submitOtp = async (code) => {
        setLoading(true);
        setError('');
        try {
            const res = await verifyResetOtp({ email, otp: code });
            const { reset_token, expires_in } = res.data?.data ?? {};
            onVerified(reset_token, expires_in);
        } catch (err) {
            const data = err.response?.data;
            setError(data?.message ?? 'Code incorrect ou expiré.');
            setDigits(Array(6).fill(''));
            inputRefs.current[0]?.focus();
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const code = digits.join('');
        if (code.length < 6) { setError('Saisissez les 6 chiffres du code.'); return; }
        submitOtp(code);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">

            <div className="text-center">
                <div className="mx-auto w-14 h-14 rounded-full bg-[var(--color-primary-light)] flex items-center justify-center mb-4">
                    <KeyRound size={28} className="text-[var(--color-primary)]" />
                </div>
                <h1 className="text-2xl font-bold text-[var(--color-dark)]">
                    Vérification du code
                </h1>
                <p className="text-sm text-[var(--color-gray)] mt-2">
                    Code envoyé à <span className="font-semibold text-[var(--color-primary)]">{email}</span>
                </p>
            </div>

            {error && (
                <div className="flex items-center gap-2 text-sm text-[var(--color-danger)] bg-red-50 border border-red-200 rounded-[var(--radius-md)] px-3 py-2">
                    <AlertCircle size={16} />
                    {error}
                </div>
            )}

            <div>
                <label className="text-sm text-[var(--color-gray-dark)] block mb-3 text-center">
                    Code de réinitialisation
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

            <button
                type="submit"
                disabled={loading || !digits.every(d => d !== '')}
                className="
                    w-full flex items-center justify-center gap-2
                    bg-[var(--color-primary)] text-white
                    py-2.5 rounded-[var(--radius-md)]
                    hover:bg-[var(--color-primary-hover)] transition
                    disabled:opacity-60 disabled:cursor-not-allowed
                "
            >
                {loading ? (
                    <><ClipLoader color="#fff" size={16} /> Vérification...</>
                ) : (
                    <><ShieldCheck size={16} /> Vérifier le code</>
                )}
            </button>

            <div className="flex justify-center">
                <ResendTimer onResend={onResend} loading={resendLoading} />
            </div>

            <p className="text-center text-xs text-[var(--color-gray)]">
                Le code expire dans <strong>15 minutes</strong>.
            </p>
        </form>
    );
}

// --- Étape 2 : nouveau mot de passe ------------------------------
function NewPasswordStep({ email, resetToken, onSuccess }) {
    const [form, setForm] = useState({ password: '', password_confirmation: '' });
    const [showPwd, setShowPwd] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [globalError, setGlobalError] = useState('');

    const strength = getPasswordStrength(form.password);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => { const c = { ...prev }; delete c[name]; return c; });
        if (globalError) setGlobalError('');
    };

    const validate = () => {
        const e = {};
        if (!form.password) e.password = 'Mot de passe requis';
        else if (form.password.length < 8) e.password = 'Minimum 8 caractères';
        if (!form.password_confirmation) e.password_confirmation = 'Confirmation requise';
        else if (form.password !== form.password_confirmation) e.password_confirmation = 'Les mots de passe ne correspondent pas';
        return e;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const validationErrors = validate();
        if (Object.keys(validationErrors).length > 0) { setErrors(validationErrors); return; }

        setLoading(true);
        setGlobalError('');

        try {
            await resetPassword({
                email,
                token: resetToken,
                password: form.password,
                password_confirmation: form.password_confirmation,
            });
            onSuccess();
        } catch (err) {
            const data = err.response?.data;
            if (err.response?.status === 422) {
                setErrors(data?.errors ?? {});
                setGlobalError(data?.message ?? 'Erreur de validation');
            } else {
                setGlobalError(data?.message ?? 'Erreur. Réessayez.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-5">

            <div className="text-center">
                <div className="mx-auto w-14 h-14 rounded-full bg-[var(--color-primary-light)] flex items-center justify-center mb-4">
                    <Lock size={28} className="text-[var(--color-primary)]" />
                </div>
                <h1 className="text-2xl font-bold text-[var(--color-dark)]">
                    Nouveau mot de passe
                </h1>
                <p className="text-sm text-[var(--color-gray)] mt-1">
                    Choisissez un mot de passe sécurisé
                </p>
            </div>

            {globalError && (
                <div className="flex items-center gap-2 text-sm text-[var(--color-danger)] bg-red-50 border border-red-200 rounded-[var(--radius-md)] px-3 py-2">
                    <AlertCircle size={16} />
                    {globalError}
                </div>
            )}

            <TextInput
                label="Nouveau mot de passe"
                name="password"
                type={showPwd ? 'text' : 'password'}
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••"
                iconLeft={Lock}
                iconRight={showPwd ? EyeOff : Eye}
                onIconRightClick={() => setShowPwd(v => !v)}
                required
                error={errors.password}
            />

            {/* Barre de force */}
            {form.password && (
                <div className="space-y-1">
                    <div className="w-full h-1.5 bg-[var(--color-gray-light)] rounded-full overflow-hidden">
                        <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{ width: strength.width, backgroundColor: strength.color }}
                        />
                    </div>
                    <small className="text-xs font-medium" style={{ color: strength.color }}>
                        Force : {strength.label}
                    </small>
                </div>
            )}

            <TextInput
                label="Confirmer le mot de passe"
                name="password_confirmation"
                type={showConfirm ? 'text' : 'password'}
                value={form.password_confirmation}
                onChange={handleChange}
                placeholder="••••••••"
                iconLeft={Lock}
                iconRight={showConfirm ? EyeOff : Eye}
                onIconRightClick={() => setShowConfirm(v => !v)}
                required
                error={errors.password_confirmation}
            />

            <button
                type="submit"
                disabled={loading}
                className="
                    w-full flex items-center justify-center gap-2
                    bg-[var(--color-primary)] text-white
                    py-2.5 rounded-[var(--radius-md)]
                    hover:bg-[var(--color-primary-hover)] transition
                    disabled:opacity-60 disabled:cursor-not-allowed
                "
            >
                {loading ? (
                    <><ClipLoader color="#fff" size={16} /> Enregistrement...</>
                ) : (
                    <><ShieldCheck size={16} /> Enregistrer le mot de passe</>
                )}
            </button>
        </form>
    );
}

// --- Écran succès ------------------------------------------------─
function SuccessScreen() {
    const navigate = useNavigate();

    useEffect(() => {
        const t = setTimeout(() => navigate('/auth/login', { replace: true }), 3000);
        return () => clearTimeout(t);
    }, [navigate]);

    return (
        <div className="text-center space-y-5">
            <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle size={36} className="text-[var(--color-success)]" />
            </div>
            <h2 className="text-xl font-bold text-[var(--color-dark)]">
                Mot de passe réinitialisé !
            </h2>
            <p className="text-sm text-[var(--color-gray)]">
                Votre mot de passe a été mis à jour avec succès.
                <br />Redirection vers la connexion...
            </p>
            <Loader2 size={20} className="animate-spin text-[var(--color-primary)] mx-auto" />
        </div>
    );
}

// --- Page principale ---------------------------------------------─
export default function ResetPasswordPage() {
    const location = useLocation();
    const navigate = useNavigate();

    // Email transmis depuis ForgotPasswordPage via navigate state
    const email = location.state?.email ?? '';

    const [step, setStep] = useState('otp');          // 'otp' | 'password' | 'success'
    const [resetToken, setResetToken] = useState('');
    const [resendLoading, setResendLoading] = useState(false);

    // Rediriger si pas d'email (accès direct sans passer par ForgotPassword)
    useEffect(() => {
        if (!email) {
            navigate('/auth/forgot-password', { replace: true });
        }
    }, [email, navigate]);

    const handleOtpVerified = (token) => {
        setResetToken(token);
        setStep('password');
    };

    const handleResend = async () => {
        setResendLoading(true);
        try {
            await forgotPassword({ email });
        } finally {
            setResendLoading(false);
        }
    };

    if (!email) return null;

    return (
        <div className="min-h-screen relative flex flex-col items-center justify-center bg-[var(--color-background-white)] pt-18 pb-16">

            <div className="w-full max-w-md bg-[var(--color-white)] p-8 rounded-[var(--radius-lg)] shadow-[var(--shadow-md)]">

                {/* Logo */}
                <div className="flex justify-center mb-6">
                    <Logo size="sm" />
                </div>

                {/* Indicateur d'étapes */}
                {step !== 'success' && (
                    <div className="flex items-center justify-center gap-3 mb-6">
                        {/* Étape 1 */}
                        <div className="flex items-center gap-1.5">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                                ${step === 'otp'
                                    ? 'bg-[var(--color-primary)] text-white'
                                    : 'bg-[var(--color-success)] text-white'
                                }`}>
                                {step === 'password' ? '✓' : '1'}
                            </div>
                            <span className="text-xs text-[var(--color-gray)]">Code</span>
                        </div>

                        <div className="w-8 h-0.5 bg-[var(--color-gray-light)]" />

                        {/* Étape 2 */}
                        <div className="flex items-center gap-1.5">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                                ${step === 'password'
                                    ? 'bg-[var(--color-primary)] text-white'
                                    : 'bg-[var(--color-gray-light)] text-[var(--color-gray)]'
                                }`}>
                                2
                            </div>
                            <span className="text-xs text-[var(--color-gray)]">Mot de passe</span>
                        </div>
                    </div>
                )}

                {/* Contenu selon l'étape */}
                {step === 'otp' && (
                    <OtpStep
                        email={email}
                        onVerified={handleOtpVerified}
                        onResend={handleResend}
                        resendLoading={resendLoading}
                    />
                )}

                {step === 'password' && (
                    <NewPasswordStep
                        email={email}
                        resetToken={resetToken}
                        onSuccess={() => setStep('success')}
                    />
                )}

                {step === 'success' && <SuccessScreen />}

                {/* Retour */}
                {step !== 'success' && (
                    <div className="flex justify-center mt-6">
                        <Link
                            to="/auth/forgot-password"
                            className="flex items-center gap-2 text-sm text-[var(--color-gray)] hover:text-[var(--color-primary)] transition"
                        >
                            <ArrowLeft size={14} />
                            Retour
                        </Link>
                    </div>
                )}

            </div>

            <MiniFooter />
        </div>
    );
}
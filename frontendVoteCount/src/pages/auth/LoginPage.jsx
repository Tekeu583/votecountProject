import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, LogIn, AlertCircle, Loader2 } from 'lucide-react';
import { ClipLoader } from 'react-spinners'
import TextInput from '@components/ui/TextInput';
import { getRoleDefaultRoute } from '@utils/roleRoutes';
import Logo from '@components/Logo';
import { useAuth } from '@hooks/useAuth';
import MiniFooter from '@components/layouts/Minifooter';
import { getPrimaryRole } from '@utils/roleRoutes';

// ─── Logo ───
const VoteCountLogo = () => (
  <div className="w-10 h-10 rounded-lg flex items-center justify-center">
    <Logo size="sm" />
  </div>
);


export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, authenticated, loading: authLoading, login: authLogin, errors: authErrors } = useAuth();
  const from = location.state?.from ?? null;

  // Redirection si déjà authentifié (ex: retour sur /login après connexion)
  useEffect(() => {
    if (authenticated && user) {
      const destination = from ?? getRoleDefaultRoute(getPrimaryRole(user));
      navigate(destination, { replace: true });
    }
  }, [authenticated, user, navigate, from]);

  const [form, setForm] = useState({
    email: '',
    password: '',
    remember: false
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [globalError, setGlobalError] = useState('');
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (authErrors && Object.keys(authErrors).length > 0) {
      setErrors(authErrors);
    }
  }, [authErrors]);

  // ─── Handle change ─────────────────
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm(prev => ({
      ...prev, [name]: type === 'checkbox' ? checked : value
    }));

    // Clear errors on typing
    if (errors[name]) {
      setErrors(prev => {
        const copy = { ...prev };
        delete copy[name];
        return copy;
      });
    }

    if (globalError) setGlobalError('');
  };

  // ─── Validation ─────────────────
  const validate = () => {
    const e = {};

    if (!form.email.trim()) {
      e.email = 'Email requis';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      e.email = 'Email invalide';
    }

    if (!form.password) {
      e.password = 'Mot de passe requis';
    }

    return e;
  };

  // ─── Submit ─────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    setGlobalError('');
    setErrors({});

    try {
      await authLogin({
        email: form.email,
        password: form.password,
        remember: form.remember,
      });
    } catch (err) {
      const status = err.response?.status;
      const message = err.response?.data?.message ?? '';

      if (!err.response) {
        setGlobalError('Impossible de joindre le serveur. Vérifiez votre connexion.');
      } else if (status === 401) {
        setGlobalError(message || 'Email ou mot de passe incorrect.');
      } else if (status === 403 && message.toLowerCase().includes('vérifié')) {
        // Email non vérifié → rediriger vers la page de vérification
        navigate('/auth/verify-email', {
          state: { email: form.email, resend: true, }
        });
      } else if (status === 403) {
        setGlobalError(message || 'Accès refusé.');
      } else if (status === 419) {
        setGlobalError(message || 'Session expirée. Rechargez la page.');
      } else if (status === 422) {
        setErrors(err.response.data.errors ?? {});
      } else {
        setGlobalError(message || 'Erreur de connexion.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Pendant la vérification initiale de session (montage de l'app)
  if (authLoading) return null;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--color-background-white)] px-4">

      <div className="w-full max-w-md bg-[var(--color-white)] p-6 rounded-[var(--radius-lg)] shadow-[var(--shadow-md)]">

        {/* Logo */}
        <div className="flex justify-center mb-6">
          <VoteCountLogo />
        </div>

        {/* Title */}
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-[var(--color-dark)]">
            Connexion
          </h1>
          <p className="text-sm text-[var(--color-gray)]">
            Accédez à votre espace professionnel VoteCount
          </p>
        </div>

        {/* Global error */}
        {globalError && (
          <div className="mb-4 flex items-center gap-2 text-sm text-[var(--color-danger)]">
            <AlertCircle size={16} />
            {globalError}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Email */}
          <TextInput
            label="Email"
            name="email"
            id="email"
            autoComplete="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            placeholder="email@example.com"
            iconLeft={Mail}
            required
            error={errors.email}
          />

          {/* Password */}
          <TextInput
            label="Mot de passe"
            name="password"
            id="password"
            autoComplete="current-password"
            type={showPassword ? 'text' : 'password'}
            value={form.password}
            onChange={handleChange}
            placeholder="••••••••"
            iconLeft={Lock}
            required
            iconRight={showPassword ? EyeOff : Eye}
            onIconRightClick={() => setShowPassword(v => !v)}
            error={errors.password}
          />

          {/* Remember + Forgot */}
          <div className="flex justify-between items-center text-sm">

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                autoComplete="off"
                id="remember"
                type="checkbox"
                name="remember"
                checked={form.remember}
                onChange={handleChange}
                className="w-4 h-4"
              />
              <span className="text-[var(--color-gray)]">
                Se souvenir
              </span>
            </label>

            <Link
              to="/auth/forgot-password"
              className="text-[var(--color-primary)] hover:underline"
            >
              Mot de passe oublié ?
            </Link>

          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="
              w-full
              flex items-center justify-center gap-2
              bg-[var(--color-primary)]
              text-white
              py-2
              rounded-[var(--radius-md)]
              hover:bg-[var(--color-primary-hover)]
              transition
              disabled:opacity-70
              disabled:cursor-not-allowed
            "
          >
            {loading ? (
              <>
                <ClipLoader color="#fff" size={16} />
                Connexion...
              </>
            ) : (
              <>
                Se connecter
                <LogIn size={16} />
              </>
            )}
          </button>

        </form>

        {/* Footer */}
        <p className="text-center text-sm mt-6 text-[var(--color-gray)]">
          Pas de compte ?{' '}
          <Link
            to="/auth/register"
            className="text-[var(--color-primary)] font-medium hover:underline"
          >
            S'inscrire
          </Link>
        </p>
      </div>
      <MiniFooter />
    </div>
  );
}

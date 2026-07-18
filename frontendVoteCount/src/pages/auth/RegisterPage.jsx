import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Phone, Lock, Eye, EyeOff, UserPlus, AlertCircle, Upload, CheckLine } from 'lucide-react';
import { ClipLoader } from 'react-spinners';
import TextInput from '@components/ui/TextInput';
import { useAuth } from '@hooks/useAuth';
import MiniFooter from '@components/layouts/Minifooter';
import { getPrimaryRole, getRoleDefaultRoute } from '@utils/roleRoutes';
import toast from 'react-hot-toast';
// --- Password strength ----------------
const getPasswordStrength = (pwd) => {
  let score = 0;

  if (pwd.length >= 8) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;

  if (score <= 1) return { label: 'Faible', color: 'var(--color-danger)' };
  if (score === 2) return { label: 'Moyen', color: 'var(--color-warning)' };
  if (score === 3) return { label: 'Bon', color: 'var(--color-info)' };
  return { label: 'Fort', color: 'var(--color-success)' };
};


export default function RegisterPage() {
  const navigate = useNavigate();
  const { user, authenticated, register, errors: authErrors } = useAuth();

  // Redirection si déjà authentifié
  useEffect(() => {
    if (authenticated && user) {
      navigate(getRoleDefaultRoute(getPrimaryRole(user)), { replace: true });
    }
  }, [authenticated, user, navigate]);

  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    password: '',
    password_confirmation: '',
    photo: null,
    terms: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [globalError, setGlobalError] = useState('');
  const [logoPreview, setLogoPreview] = useState(null);
  useEffect(() => {
    if (authErrors && Object.keys(authErrors).length > 0) {
      setErrors(authErrors);
    }
  }, [authErrors]);

  // --- Handle change ----------------
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev, [name]: type === 'checkbox' ? checked : value,
    }));
    if (errors[name]) setErrors(prev => { const c = { ...prev }; delete c[name]; return c; });
  };

  // --- Validation ----------------
  const validate = () => {
    const e = {};

    if (!form.first_name) e.first_name = 'Nom requis';
    if (!form.last_name) e.last_name = 'Prenom requis';
    if (!form.email) e.email = 'Email requis';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Email invalide';
    if (!form.password) e.password = 'Mot de passe requis';

    if (form.password !== form.password_confirmation) {
      e.password_confirmation = 'Les mots de passe ne correspondent pas';
    }

    if (!form.terms) e.terms = 'Veuillez accepter les conditions';

    return e;
  };
  //photo
  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    console.log(file);
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('La photo ne doit pas dépasser 5 Mo');
      return;
    }

    setForm(prev => ({ ...prev, photo: file }));
    const reader = new FileReader();
    reader.onload = (event) => setLogoPreview(event.target.result);
    reader.readAsDataURL(file);
  };
  // --- Submit ----------------
  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    setErrors({});
    setGlobalError('');

    try {
      const fd = new FormData();
      fd.append('first_name', form.first_name.trim());
      fd.append('last_name', form.last_name.trim());
      fd.append('email', form.email);
      fd.append('phone', form.phone);
      fd.append('password', form.password.trim());
      fd.append('password_confirmation', form.password_confirmation.trim());
      fd.append('photo', form.photo);
      fd.append('terms', form.terms);
      const res = await register(fd);
      console.log(res);
      navigate('/auth/verify-email', {
        state: { email: form.email, message: res.data.message }
      });

    } catch (err) {
      if (err.response?.status === 422) {
        const resp = err.response.data || {};
        const raw = resp.errors ?? {};
        // Normaliser : garder le premier message par champ (string)
        const normalized = Object.fromEntries(
          Object.entries(raw).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v])
        );
        setErrors(normalized);
        setGlobalError(resp.message || 'Erreur de validation');
      } else {
        setGlobalError(err.message || 'Erreur lors de l’inscription');
      }
    } finally {
      setLoading(false);
    }
  };

  const strength = getPasswordStrength(form.password);

  return (
    <div className="min-h-screen relative pt-17 flex flex-col items-center justify-center bg-[var(--color-background-white)] px-4">

      <div className="w-full max-w-lg bg-[var(--color-white)] p-6 rounded-[var(--radius-lg)] shadow-[var(--shadow-md)] pb-17">

        {/* Header */}
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-[var(--color-dark)]">
            Créer un compte
          </h1>
          <p className="text-sm text-[var(--color-gray)]">
            Rejoignez la plateforme de vote sécurisée VoteCount.
          </p>
        </div>
        {/* Global error */}
        {globalError && (
          <div className="mb-4 text-sm text-[var(--color-danger)] flex items-center gap-2">
            <AlertCircle size={16} />
            {globalError}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Nom */}
          <TextInput
            label="Nom"
            name="first_name"
            value={form.first_name}
            onChange={handleChange}
            iconLeft={User}
            placeholder="Nom"
            required
            error={errors.first_name}
          />

          {/* Prénom */}
          <TextInput
            label="Prénom"
            name="last_name"
            value={form.last_name}
            placeholder="Prénom"
            onChange={handleChange}
            iconLeft={User}
            required
            error={errors.last_name}
          />

          {/* Email */}
          <TextInput
            label="Email"
            name="email"
            value={form.email}
            onChange={handleChange}
            iconLeft={Mail}
            placeholder="Email"
            required
            error={errors.email}
          />

          {/* Téléphone */}
          <TextInput
            label="Téléphone"
            name="phone"
            value={form.phone}
            onChange={handleChange}
            placeholder="Téléphone"
            iconLeft={Phone}
          />

          {/* Mot de passe */}
          <TextInput
            label="Mot de passe"
            name="password"
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

          {/* Strength */}
          {form.password && (
            <small
              className="text-xs font-medium"
              style={{ color: strength.color }}
            >
              Force : {strength.label}
            </small>
          )}

          {/* Confirmation */}
          <TextInput
            label="Confirmer le mot de passe"
            name="password_confirmation"
            type={showConfirm ? 'text' : 'password'}
            value={form.password_confirmation}
            placeholder="••••••••"
            onChange={handleChange}
            iconLeft={Lock}
            required
            iconRight={showConfirm ? EyeOff : Eye}
            onIconRightClick={() => setShowConfirm(v => !v)}
            error={errors.password_confirmation}
          />
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Votre photo
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-3xl p-10 text-center hover:border-blue-400 transition cursor-pointer">
              <input
                type="file"
                accept="image/png,image/jpg image/jpeg, image/webp"
                onChange={handleLogoUpload}
                className="hidden"
                id="photo-upload"
              />
              <label htmlFor="photo-upload" className="cursor-pointer flex flex-col items-center">
                <div className="w-24 h-24 rounded-ful flex items-center justify-center text-xl">
                  {logoPreview ? (
                    <img src={logoPreview} alt="photo_preview" className="w-24 h-24 object-contain mb-4 rounded-full" />
                  ) : (
                    <Upload className="w-12 h-12 text-gray-400 mb-4" />
                  )}
                </div>
                <p className="font-medium text-gray-700">Cliquez pour télécharger</p>
                <p className="text-sm text-gray-500 mt-1">PNG, JPG ou SVG (max. 5 Mo)</p>
              </label>
            </div>
          </div>
          {/* terms */}
          <div className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="terms"
              value={form.terms}
              onChange={handleChange}
              className="w-4 h-4"
              required
            />
            <span>J’accepte les conditions d’utilisation</span>
          </div>

          {errors.terms && (
            <small className="text-xs text-[var(--color-danger)]">
              {errors.terms}
            </small>
          )}

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
                <ClipLoader color='#ffffff' size={16} />
                Création en cours...
              </>
            ) : (
              <UserPlus size={16} />
            )}
            Créer mon compte professionnel
          </button>

        </form>

        {/* Footer */}
        <p className="text-center text-sm mt-4 text-[var(--color-gray)]">
          Déjà un compte ?{' '}
          <Link
            to="/auth/login"
            className="text-[var(--color-primary)] hover:underline"
          >
            Se connecter
          </Link>
        </p>

      </div>
      <MiniFooter />
    </div>
  );
}

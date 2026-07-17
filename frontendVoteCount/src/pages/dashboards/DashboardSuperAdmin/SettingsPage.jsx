import { useState, useEffect } from "react";
import toast from 'react-hot-toast';
import useProfile from "@hooks/useProfile";
import useRole from "@hooks/useRole";
import { settingsApi } from "@services/api";
import TextInput from "@components/ui/TextInput";

import ProfileHeader from "../ProfileHeader";
import ProfileSidebarCard from "../ProfileSidebarCard";
import ProfileForm from "../ProfileForm";
import PasswordForm from "../PasswordForm";

// Paramètres système (SystemSetting, clé/valeur) — le backend (/settings)
// existait déjà mais n'était appelé par aucune page : cette section les
// rend enfin éditables.
function SystemSettingsSection() {
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        settingsApi.getAll()
            .then(res => setSettings(res.data?.data ?? {}))
            .catch(() => toast.error("Impossible de charger les paramètres système"))
            .finally(() => setLoading(false));
    }, []);

    const handleChange = (key, value) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const { app_version: _appVersion, ...editable } = settings;
            await settingsApi.update({ settings: editable });
            toast.success('Paramètres système mis à jour');
        } catch (err) {
            toast.error(err.response?.data?.message ?? 'Erreur lors de la mise à jour');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="bg-white p-6 rounded-[var(--radius-md)] shadow-sm">Chargement des paramètres système...</div>;
    if (!settings) return null;

    return (
        <form onSubmit={handleSave} className="bg-white p-6 rounded-[var(--radius-md)] shadow-sm space-y-4">
            <h2 className="text-lg font-semibold text-[var(--color-dark)]">Paramètres système</h2>
            <p className="text-sm text-[var(--color-gray)]">Version de l'application : {settings.app_version ?? '—'}</p>

            <div className="grid md:grid-cols-2 gap-4">
                <TextInput
                    label="Nom de l'application"
                    value={settings.app_name ?? ''}
                    onChange={(e) => handleChange('app_name', e.target.value)}
                />
                <TextInput
                    label="Devise par défaut"
                    value={settings.default_currency ?? ''}
                    maxLength={3}
                    onChange={(e) => handleChange('default_currency', e.target.value.toUpperCase())}
                />
                <TextInput
                    label="Taille max des fichiers (Mo)"
                    type="number"
                    value={settings.max_upload_size ?? ''}
                    onChange={(e) => handleChange('max_upload_size', Number(e.target.value))}
                />
                <TextInput
                    label="Expiration OTP (minutes)"
                    type="number"
                    value={settings.otp_expiry_minutes ?? ''}
                    onChange={(e) => handleChange('otp_expiry_minutes', Number(e.target.value))}
                />
                <TextInput
                    label="Tentatives de connexion max"
                    type="number"
                    value={settings.max_login_attempts ?? ''}
                    onChange={(e) => handleChange('max_login_attempts', Number(e.target.value))}
                />
                <TextInput
                    label="Seuil de détection de fraude (0-1)"
                    type="number"
                    step="0.05"
                    min="0"
                    max="1"
                    value={settings.fraud_detection_threshold ?? ''}
                    onChange={(e) => handleChange('fraud_detection_threshold', Number(e.target.value))}
                />
                <TextInput
                    label="Cache des résultats (secondes)"
                    type="number"
                    value={settings.results_cache_ttl ?? ''}
                    onChange={(e) => handleChange('results_cache_ttl', Number(e.target.value))}
                />
            </div>

            <label className="flex items-center gap-2 text-sm">
                <input
                    type="checkbox"
                    checked={Boolean(settings.maintenance_mode)}
                    onChange={(e) => handleChange('maintenance_mode', e.target.checked)}
                />
                Mode maintenance
            </label>

            <button type="submit" disabled={saving} className="btn-primary disabled:opacity-50">
                {saving ? 'Enregistrement...' : 'Enregistrer les paramètres système'}
            </button>
        </form>
    );
}

export default function SettingsPage() {
    const { isSuperAdmin } = useRole();
    const {
        profile,
        setProfile,
        passwordForm,
        setPasswordForm,
        loading,
        savingProfile,
        savingPassword,
        savingPhoto,
        updateProfile,
        updatePassword,
        updatePhoto,
    } = useProfile();

    if (loading) return <div>Loading...</div>;

    const completion = Math.round(
        (Object.values(profile).filter(Boolean).length / Object.keys(profile).length) * 100
    );

    return (
        <div className="bg-[var(--color-background-white)] p-2 space-y-6">
            {isSuperAdmin && <SystemSettingsSection />}

            <ProfileHeader completion={completion} />

            <div className="grid lg:grid-cols-[300px_1fr] gap-6">

                <ProfileSidebarCard profile={profile} onPhotoChange={updatePhoto} saving={savingPhoto} />
                <div className="space-y-6">
                    <ProfileForm
                        profile={profile}
                        setProfile={setProfile}
                        onSave={updateProfile}
                        loading={savingProfile}
                    />

                    <PasswordForm
                        passwordForm={passwordForm}
                        setPasswordForm={setPasswordForm}
                        onSave={updatePassword}
                        loading={savingPassword}
                    />
                </div>

            </div>
        </div>
    );
}

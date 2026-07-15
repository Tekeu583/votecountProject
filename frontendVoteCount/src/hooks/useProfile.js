// src/hooks/useProfile.js
import { useEffect, useState } from 'react';
import { updateProfile as apiUpdateProfile, updatePassword as apiUpdatePassword } from '@services/api';
import {
    toastDismiss,
    toastError,
    toastLoading,
    toastSuccess,
} from '@services/toastService';
import { useAuth } from '@hooks/useAuth';

const getInitialProfileState = (user = {}) => ({
    first_name: user.first_name || '',
    last_name:  user.last_name  || '',
    phone:      user.phone      || '',
    email:      user.email      || '',
    photo:      user.photo      || '',
});

export default function useProfile() {
    const { user, refreshUser } = useAuth();

    const [profile, setProfile]         = useState({});
    const [initialProfile, setInitialProfile] = useState({});
    const [passwordForm, setPasswordForm] = useState({
        currentPassword:      '',
        password:             '',
        passwordConfirmation: '',
    });

    const [loading, setLoading]               = useState(true);
    const [savingProfile, setSavingProfile]   = useState(false);
    const [savingPassword, setSavingPassword] = useState(false);
    const [savingPhoto, setSavingPhoto]       = useState(false);

    // Hydratation depuis le Context (pas d'appel réseau supplémentaire)
    useEffect(() => {
        if (user) {
            const formatted = getInitialProfileState(user);
            setProfile(formatted);
            setInitialProfile(formatted);
        }
        setLoading(false);
    }, [user]);

    /**
     * Met à jour le profil (nom, téléphone).
     * Utilise PATCH /api/v1/auth/profile via la fonction centralisée.
     */
    const updateProfile = async () => {
        setSavingProfile(true);
        const t = toastLoading('Mise à jour...');
        try {
            await apiUpdateProfile({
                first_name: profile.first_name,
                last_name:  profile.last_name,
                phone:      profile.phone,
            });
            setInitialProfile(profile);
            // Resync le Context avec les nouvelles données
            await refreshUser();
            toastSuccess('Profil mis à jour');
        } catch {
            toastError('Erreur lors de la mise à jour du profil');
        } finally {
            toastDismiss(t);
            setSavingProfile(false);
        }
    };

    /**
     * Remplace la photo de profil — upload immédiat au choix du fichier,
     * indépendant du bouton "Enregistrer" de ProfileForm.
     */
    const updatePhoto = async (file) => {
        setSavingPhoto(true);
        const t = toastLoading('Envoi de la photo...');
        try {
            const payload = new FormData();
            payload.append('photo', file);
            await apiUpdateProfile(payload);
            await refreshUser();
            toastSuccess('Photo de profil mise à jour');
        } catch (err) {
            const message = err.response?.data?.message || 'Erreur lors de l\'envoi de la photo';
            toastError(message);
        } finally {
            toastDismiss(t);
            setSavingPhoto(false);
        }
    };

    /**
     * Met à jour le mot de passe.
     * Utilise PATCH /api/v1/auth/password via la fonction centralisée.
     * Le payload est converti en snake_case par apiUpdatePassword.
     */
    const updatePassword = async () => {
        setSavingPassword(true);
        const t = toastLoading('Mise à jour du mot de passe...');
        try {
            await apiUpdatePassword({
                currentPassword:      passwordForm.currentPassword,
                password:             passwordForm.password,
                passwordConfirmation: passwordForm.passwordConfirmation,
            });
            setPasswordForm({ currentPassword: '', password: '', passwordConfirmation: '' });
            toastSuccess('Mot de passe mis à jour');
        } catch (err) {
            const message = err.response?.data?.message || 'Erreur lors de la mise à jour du mot de passe';
            toastError(message);
        } finally {
            toastDismiss(t);
            setSavingPassword(false);
        }
    };

    const isDirty = JSON.stringify(profile) !== JSON.stringify(initialProfile);

    return {
        profile,
        setProfile,
        passwordForm,
        setPasswordForm,
        loading,
        savingProfile,
        savingPassword,
        savingPhoto,
        isDirty,
        updateProfile,
        updatePassword,
        updatePhoto,
    };
}
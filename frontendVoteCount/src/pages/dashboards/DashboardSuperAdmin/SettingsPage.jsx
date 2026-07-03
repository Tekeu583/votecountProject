import useProfile from "@hooks/useProfile";

import ProfileHeader from "../ProfileHeader";
import ProfileSidebarCard from "../ProfileSidebarCard";
import ProfileForm from "../ProfileForm";
import PasswordForm from "../PasswordForm";


export default function SettingsPage() {
    const {
        profile,
        setProfile,
        passwordForm,
        setPasswordForm,
        loading,
        savingProfile,
        savingPassword,
        updateProfile,
        updatePassword,
    } = useProfile();

    if (loading) return <div>Loading...</div>;

    const completion =
        Object.values(profile).filter(Boolean).length * 25;

    return (
        <div className="bg-[var(--color-background-white)] p-2 space-y-6">

            <ProfileHeader completion={completion} />

            <div className="grid lg:grid-cols-[300px_1fr] gap-6">

                <ProfileSidebarCard profile={profile} />
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
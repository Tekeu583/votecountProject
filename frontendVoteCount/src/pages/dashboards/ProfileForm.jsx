import { Save, LoaderCircle, User, Mail, Phone } from "lucide-react";
import TextInput from "@components/ui/TextInput";
import PropTypes from "prop-types";
export default function ProfileForm({
    profile,
    setProfile,
    onSave,
    loading
}) {
    return (
        <div className="bg-[var(--color-white)] rounded-[var(--radius-md)] shadow">

            <div className="p-2 grid md:grid-cols-2 gap-4">

                <TextInput
                    label="Prénom"
                    value={profile.first_name || ''}
                    onChange={(e) =>
                        setProfile({ ...profile, first_name: e.target.value })
                    }
                    iconLeft={User}
                />

                <TextInput
                    label="Nom"
                    value={profile.last_name || ''}
                    onChange={(e) =>
                        setProfile({ ...profile, last_name: e.target.value })
                    }
                    iconLeft={User}
                />

                <TextInput
                    label="Téléphone"
                    value={profile.phone || ''}
                    onChange={(e) =>
                        setProfile({ ...profile, phone: e.target.value })
                    }
                    iconLeft={Phone}
                />

                <TextInput
                    label="Email"
                    value={profile.email || ''}
                    disabled
                    iconLeft={Mail}
                />
            </div>

            <p className="px-2 text-xs text-[var(--color-gray)]">
                L'adresse email ne peut pas être modifiée depuis cette page.
            </p>

            <div className="p-2 border-t border-t-[var(--color-gray-light)] flex justify-end">
                <button
                    onClick={onSave}
                    className="btn-primary flex items-center gap-2"
                >
                    {loading ? (
                        <LoaderCircle className="animate-spin" size={16} />
                    ) : (
                        <Save size={16} />
                    )}
                    Enregistrer
                </button>
            </div>
        </div>
    );
}

ProfileForm.propTypes = {
    profile: PropTypes.shape({
        first_name: PropTypes.string,
        last_name: PropTypes.string,
        email: PropTypes.string,
        phone: PropTypes.string
    }),
    setProfile: PropTypes.func.isRequired,
    onSave: PropTypes.func.isRequired,
    loading: PropTypes.bool
};
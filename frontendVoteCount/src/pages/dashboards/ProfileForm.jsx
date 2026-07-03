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
                    value={profile.first_name || "User"}
                    onChange={(e) =>
                        setProfile({ ...profile, first_name: e.target.value })
                    }
                    iconLeft={User}
                />

                <TextInput
                    label="Nom"
                    value={profile.last_name || "User"}
                    onChange={(e) =>
                        setProfile({ ...profile, last_name: e.target.value })
                    }
                    iconLeft={User}
                />

                <TextInput
                    label="Téléphone"
                    value={profile.phone || "698765432"}
                    onChange={(e) =>
                        setProfile({ ...profile, phone: e.target.value })
                    }
                    iconLeft={Phone}
                />

                <TextInput
                    label="Email"
                    value={profile.email || "arsene@gmail.com"}
                    onChange={(e) =>
                        setProfile({ ...profile, email: e.target.value })
                    }
                    iconLeft={Mail}
                />
            </div>

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

ProfileForm.defaultProps = {
    profile: {
        first_name: "Tekeu",
        last_name: "Arsene",
        email: "arsene@gmail.com",
        phone: "698765432"
    },
    loading: false
};
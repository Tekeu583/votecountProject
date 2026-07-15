import { Lock, LoaderCircle } from "lucide-react";
import TextInput from "@components/ui/TextInput";
import PropTypes from "prop-types";
export default function PasswordForm({
    passwordForm,
    setPasswordForm,
    onSave,
    loading
}) {
    return (
        <div className="bg-[var(--color-white)] rounded-2xl shadow">

            <div className="p-2 grid md:grid-cols-2 gap-4">

                <TextInput
                    label="Mot de passe actuel"
                    type="password"
                    placeholder="••••••••"
                    value={passwordForm.currentPassword}
                    onChange={(e) =>
                        setPasswordForm({
                            ...passwordForm,
                            currentPassword: e.target.value,
                        })
                    }
                    iconLeft={Lock}
                />

                <div className="hidden md:block" />

                <TextInput
                    label="Nouveau mot de passe"
                    type="password"
                    placeholder="••••••••"
                    value={passwordForm.password}
                    onChange={(e) =>
                        setPasswordForm({
                            ...passwordForm,
                            password: e.target.value,
                        })
                    }
                    iconLeft={Lock}
                />

                <TextInput
                    label="Confirmation"
                    type="password"
                    placeholder="••••••••"
                    value={passwordForm.passwordConfirmation}
                    onChange={(e) =>
                        setPasswordForm({
                            ...passwordForm,
                            passwordConfirmation: e.target.value,
                        })
                    }
                    iconLeft={Lock}
                />
            </div>

            <div className="p-2 border-t border-t-[var(--color-gray-light)] flex justify-end">
                <button
                    onClick={onSave}
                    className="btn-dark flex items-center gap-2"
                >
                    {loading ? (
                        <LoaderCircle className="animate-spin" size={16} />
                    ) : (
                        <Lock size={16} />
                    )}
                    Mettre à jour
                </button>
            </div>
        </div>
    );
}

PasswordForm.propTypes = {
    passwordForm: {
        password: PropTypes.string,
        passwordConfirmation: PropTypes.string
    },
    setPasswordForm: PropTypes.func.isRequired,
    onSave: PropTypes.func.isRequired,
    loading:PropTypes.bool

}
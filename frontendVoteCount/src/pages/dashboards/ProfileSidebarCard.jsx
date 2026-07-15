import { Camera, LoaderCircle } from "lucide-react";
import PropTypes from "prop-types";
import { useRef, useState } from "react";
import toast from "react-hot-toast";

export default function ProfileSidebarCard({ profile, onPhotoChange, saving }) {
    const fileInputRef = useRef(null);
    const [preview, setPreview] = useState(null);

    const handleClick = () => {
        fileInputRef.current.click();
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        e.target.value = '';
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            toast.error('Le fichier sélectionné doit être une image.');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            toast.error('La photo ne doit pas dépasser 5 Mo.');
            return;
        }

        setPreview(URL.createObjectURL(file));
        onPhotoChange(file);
    };

    const displayedPhoto = preview || profile.photo;

    return (
        <div className="bg-[var(--color-background-white)] p-6 rounded-[var(--radius-md)] shadow">
            <div className="flex flex-col items-center">

                <div className="relative">
                    <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center text-xl overflow-hidden">
                        {displayedPhoto ? (
                            <img
                                src={displayedPhoto}
                                alt="Profile"
                                className="w-full h-full object-cover rounded-full"
                            />
                        ) : (
                            profile.first_name?.[0] || "?"
                        )}
                    </div>

                    {/* Bouton caméra */}
                    <button
                        type="button"
                        onClick={handleClick}
                        disabled={saving}
                        className="absolute bottom-0 right-0 bg-[var(--color-primary)] text-[var(--color-white)] p-2 rounded-full disabled:opacity-70"
                    >
                        {saving ? <LoaderCircle size={14} className="animate-spin" /> : <Camera size={14} />}
                    </button>

                    {/* Input file caché */}
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                    />
                </div>

                <h2 className="mt-3 font-semibold">
                    {profile.first_name} {profile.last_name}
                </h2>

                <p className="text-sm text-gray-500">
                    {profile.email}
                </p>
            </div>
        </div>
    );
}

ProfileSidebarCard.propTypes = {
    profile: PropTypes.shape({
        first_name: PropTypes.string,
        last_name: PropTypes.string,
        email: PropTypes.string,
        photo: PropTypes.string,
    }),
    onPhotoChange: PropTypes.func.isRequired,
    saving: PropTypes.bool,
};

import { Camera } from "lucide-react";
import PropTypes from "prop-types";
import { useRef } from "react";
import toast from "react-hot-toast";

export default function ProfileSidebarCard({ profile }) {
    const fileInputRef = useRef(null);

    const handleClick = () => {
        fileInputRef.current.click();
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        console.log("Fichier sélectionné :", file);

        // Exemple de notification
        setTimeout(() => {
            toast.success("Photo mise à jour !");
        }, 1500);
    };

    return (
        <div className="bg-[var(--color-background-white)] p-6 rounded-[var(--radius-md)] shadow">
            <div className="flex flex-col items-center">

                <div className="relative">
                    <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center text-xl">
                        {profile.photo ? (
                            <img
                                src={profile.photo}
                                alt="Profile"
                                className="w-full h-full object-cover rounded-full"
                            />
                        ) : (
                            profile.first_name?.[0] || "User"
                        )}
                    </div>

                    {/* Bouton caméra */}
                    <button
                        type="button"
                        onClick={handleClick}
                        className="absolute bottom-0 right-0 bg-[var(--color-primary)] text-[var(--color-white)] p-2 rounded-full"
                    >
                        <Camera size={14} />
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
                    {profile.first_name || "Tekeu"} {profile.last_name || "Arsene"}
                </h2>

                <p className="text-sm text-gray-500">
                    {profile.email || "arsene@gmail.com"}
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
    })
};

ProfileSidebarCard.defaultProps = {
    profile: {
        firstName: "Tekeu",
        lastName: "Arsene",
        email: "arsene@gmail.com"
    }
}
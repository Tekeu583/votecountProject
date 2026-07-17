import { useEffect } from "react";
import { FadeLoader } from "react-spinners";

// Même origine backend que le reste de l'app (services/api/api.js) —
// un localhost:8000 en dur ne fonctionnait qu'en développement local.
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL ?? "http://localhost:8000";
const TELESCOPE_URL = `${BACKEND_URL}/telescope`;

export default function TelescopePage() {
    useEffect(() => {
        window.open(TELESCOPE_URL, "_blank");
    }, []);

    return (
        <div className="flex flex-col items-center justify-center h-screen">
            <FadeLoader color="var(--color-primary)" size={30} className="mx-auto" />
            Redirection vers Telescope...
            <a href={TELESCOPE_URL} target="_blank" rel="noopener noreferrer" className="text-[var(--color-primary)]">
                Cliquez ici si la redirection ne fonctionne pas
            </a>
        </div>
    );
}

import { useEffect } from "react";
import { FadeLoader } from "react-spinners";

export default function TelescopePage() {
    useEffect(() => {
        window.open(
            "http://localhost:8000/telescope",
            "_blank"
        );
    }, []);

    return (
        <div className="flex flex-col items-center justify-center h-screen">
            <FadeLoader color="var(--color-primary)" size={30} className="mx-auto" />
            Redirection vers Telescope...
            <a href="http://localhost:8000/telescope" target="_blank" rel="noopener noreferrer" className="text-[var(--color-primary)]">
                Cliquez ici si la redirection ne fonctionne pas
            </a>
        </div>
    );
}
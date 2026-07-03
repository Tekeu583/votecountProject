import {  BadgeCheck } from "lucide-react";

export default function ProfileHeader({ completion }) {
    return (
        <div className="rounded-[var(--radius-md)] bg-gradient-to-l from-[var(--color-dark)] to-[var(--color-primary)] p-6 text-[var(--color-white)]">
            <div className="justify-between items-center grid md:grid-cols-2 gap-4">
                <div>
                    <h1 className="text-2xl font-bold">Paramètres Profil</h1>
                    <p className="text-sm text-[var(--color-white)]">
                        Gérez vos informations
                    </p>
                </div>

                <div className="flex gap-4">
                    <div className="flex">
                        <p className="text-xs p-2">progression</p>
                        <p className="text-xl px-2 font-bold">{completion}%</p>
                    </div>

                    <div className="flex items-center gap-2">
                        <BadgeCheck size={16} />
                        <span>Actif</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
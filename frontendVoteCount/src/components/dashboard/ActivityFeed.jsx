export default function ActivityFeed() {
    const activities = [
        "Nouveau vote enregistré",
        "Validation de dossiers",
        "Connexion suspecte détectée",
        "Scrutin clôturé",
    ];

    return (
        <div className="bg-[var(--color-white)] p-4 rounded-[var(--radius-md)] shadow-[var(--shadow-md)]">

            <h2 className="font-semibold mb-4">
                Activités Récentes
            </h2>

            <div className="space-y-3 text-sm">
                {activities.map((a, i) => (
                    <div key={i} className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-[var(--color-primary)] rounded-full"></span>
                        {a}
                    </div>
                ))}
            </div>

        </div>
    );
}

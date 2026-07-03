export default function TopCandidates() {
    const data = [
        { name: "Muriel", score: 42 },
        { name: "Audrey", score: 35 },
        { name: "Gertrude", score: 18 },
    ];

    return (
        <div className="bg-[var(--color-white)] rounded-[var(--radius-md)] shadow-[var(--shadow-md)] p-4">

            <h2 className="font-semibold mb-4">
                Classement Candidats(Top 3)
            </h2>

            <div className="space-y-4">
                {data.map((c, i) => (
                    <div key={i}>

                        <div className="flex justify-between text-sm mb-1">
                            <span>{c.name}</span>
                            <span>{c.score}%</span>
                        </div>

                        <div className="h-2 bg-[var(--color-gray-light)] rounded-[var(--radius-md)]">
                            <div
                                className="h-2 bg-[var(--color-primary)] rounded-[var(--radius-md)]"
                                style={{ width: `${c.score}%` }}
                            />
                        </div>

                    </div>
                ))}
            </div>
        </div>
    );
}

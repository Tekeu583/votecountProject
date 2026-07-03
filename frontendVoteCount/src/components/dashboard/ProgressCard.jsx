export default function ProgressCard() {
    return (
        <div className="bg-[var(--color-white)] p-4 rounded-[var(--radius-md)] shadow-[var(--shadow-md)]">

            <h2 className="font-semibold mb-4">Avancement Jury</h2>

            <div className="space-y-4">

                <div>
                    <div className="flex justify-between text-sm">
                        <span>Jury Innovation</span>
                        <span>80%</span>
                    </div>
                    <div className="h-2 bg-[var(--color-gray-light)] rounded mt-1">
                        <div className="h-2 bg-[var(--color-primary)] rounded w-[80%]" />
                    </div>
                </div>

                <div>
                    <div className="flex justify-between text-sm">
                        <span>Jury Design</span>
                        <span>45%</span>
                    </div>
                    <div className="h-2 bg-[var(--color-gray-light)] rounded mt-1">
                        <div className="h-2 bg-[var(--color-primary)] rounded w-[45%]" />
                    </div>
                </div>

            </div>
        </div>
    );
}

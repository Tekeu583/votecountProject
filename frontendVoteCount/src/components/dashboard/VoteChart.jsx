import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip,
} from "recharts";

const COLORS = ["#2563EB", "#94A3B8", "#E2E8F0"];

export default function VoteChart({ data = [] }) {
    const userValue = data[0]?.value || 0;

    return (
        <div className="bg-white p-6 rounded-xl shadow">
            <h3 className="font-semibold mb-6">Répartition des votes</h3>

            <div className="flex flex-col items-center">

                <div className="w-full h-56 relative">
                    <ResponsiveContainer>
                        <PieChart>
                            <Pie
                                data={data}
                                innerRadius={70}
                                outerRadius={90}
                                dataKey="value"
                            >
                                {data.map((entry, index) => (
                                    <Cell key={index} fill={COLORS[index]} />
                                ))}
                            </Pie>

                            <Tooltip formatter={(v) => `${v}%`} />
                        </PieChart>
                    </ResponsiveContainer>

                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-xl font-bold">{userValue}%</span>
                        <span className="text-xs text-gray-500">Votre part</span>
                    </div>
                </div>

                {/* Legend */}
                <div className="w-full mt-6 space-y-2">
                    {data.map((item, i) => (
                        <div key={i} className="flex justify-between text-sm">
                            <span>{item.name}</span>
                            <span>{item.value}%</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
export default function StatusBadge({ status }) {
    const styles = {
        "ACCEPTÉ": "bg-green-100 text-green-600",
        "REJETÉ": "bg-red-100 text-red-600",
        "EN ATTENTE": "bg-orange-100 text-orange-600",
        "BLOQUÉ": "bg-gray-200 text-gray-600",
    };

    return (
        <span
            className={`px-3 py-1 text-xs rounded-full font-medium ${styles[status]}`}
        >
            {status}
        </span>
    );
}
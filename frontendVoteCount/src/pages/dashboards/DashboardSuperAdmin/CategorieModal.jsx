import { X, LoaderCircle } from "lucide-react";
import { useState, useEffect } from "react";
import TextInput from "@components/ui/TextInput";

export default function CategorieModal({
    data = null,
    onClose,
    onSuccess,
    onError,
}) {
    const [form, setForm] = useState({
        name: "",
        label: "",
        description: "",
    });

    const [loading, setLoading] = useState(false);

    // Prefill si édition
    useEffect(() => {
        if (data) {
            setForm({
                name: data.name || "",
                description: data.description || "",
            });
        }
    }, [data]);

    // Handle change
    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value,
        });
    };

    // Submit
    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation simple
        if (!form.name.trim()) {
            return onError("Le nom de la catégorie est requis");
        }

        try {
            setLoading(true);

            // Simulation API (remplace par axios)
            await new Promise((res) => setTimeout(res, 1000));

            onSuccess(
                data
                    ? "Catégorie mise à jour avec succès"
                    : "Catégorie créée avec succès"
            );
        } catch (error) {
            onError("Une erreur est survenue", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center ">

            {/* OVERLAY */}
            <div
                onClick={onClose}
                className="absolute inset-0 bg-[var(--color-dark)]/40 backdrop-blur-sm"
            />

            {/* MODAL */}
            <div className="relative bg-[var(--color-white)] w-full max-w-md mx-4 rounded-[var(--radius-md)] shadow-lg p-6 animate-in fade-in zoom-in-95">

                {/* HEADER */}
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold">
                        {data ? "Modifier la catégorie" : "Nouvelle catégorie"}
                    </h2>

                    <button
                        onClick={onClose}
                        className="p-2 rounded hover:bg-gray-100"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* FORM */}
                <form onSubmit={handleSubmit} className="space-y-4">

                    {/* NAME */}
                    <div>
                        <TextInput
                            id="name"
                            name="name"
                            value={form.name}
                            label="Nom de la catégorie"
                            onChange={handleChange}
                            required
                            placeholder="Ex: Miss, Académique, Business..."
                            className="w-full mt-1"
                        />
                    </div>
                    {/* label */}
                    <div>
                        <label htmlFor="label" className="text-sm font-medium">
                            label de la catégorie
                        </label>
                        <TextInput
                            id="label"
                            name="label"
                            value={form.label}
                            label="Label"
                            onChange={handleChange}
                            placeholder="Ex: Miss, Académique, Business..."
                            className="w-full mt-1"
                        />
                    </div>

                    {/* DESCRIPTION */}
                    <div>
                        <label htmlFor="description" className="text-sm font-medium">
                            Description (optionnel)
                        </label>
                        <textarea
                            id="description"
                            name="description"
                            value={form.description}
                            onChange={handleChange}
                            rows={3}
                            className="w-full mt-1 p-2 border rounded-md outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                            placeholder="Description de la catégorie..."
                        />
                    </div>

                    {/* ACTIONS */}
                    <div className="flex justify-end gap-2 pt-2">

                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded border border-[var(--color-gray-light)] hover:bg-gray-50"
                        >
                            Annuler
                        </button>

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary flex items-center gap-2"
                        >
                            {loading && <LoaderCircle className="animate-spin" size={16} />}
                            {data ? "Mettre à jour" : "Créer"}
                        </button>

                    </div>

                </form>
            </div>
        </div>
    );
}

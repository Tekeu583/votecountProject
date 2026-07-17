import { X, LoaderCircle } from "lucide-react";
import { useState, useEffect } from "react";
import TextInput from "@components/ui/TextInput";
import { categoriesApi } from "@services/api";

export default function CategorieModal({
    data = null,
    onClose,
    onSuccess,
    onError,
}) {
    const [form, setForm] = useState({
        name: "",
        description: "",
        icon: "",
        color: "#3B82F6",
        status: "active",
        banner: null,
    });

    const [loading, setLoading] = useState(false);

    // Prefill si édition
    useEffect(() => {
        if (data) {
            setForm({
                name: data.name || "",
                description: data.description || "",
                icon: data.icon || "",
                color: data.color || "#3B82F6",
                status: data.status || "active",
                banner: null,
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

        const fd = new FormData();
        fd.append('name', form.name);
        if (form.description) fd.append('description', form.description);
        if (form.icon) fd.append('icon', form.icon);
        if (form.color) fd.append('color', form.color);
        fd.append('status', form.status);
        if (form.banner) fd.append('banner', form.banner);

        try {
            setLoading(true);

            if (data) {
                await categoriesApi.update(data.uuid, fd);
                onSuccess("Catégorie mise à jour avec succès");
            } else {
                await categoriesApi.create(fd);
                onSuccess("Catégorie créée avec succès");
            }
        } catch (error) {
            const errors = error.response?.data?.errors;
            const firstError = errors ? Object.values(errors)[0]?.[0] : null;
            onError(firstError ?? error.response?.data?.message ?? "Une erreur est survenue");
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

                    {/* ICON */}
                    <div>
                        <TextInput
                            id="icon"
                            name="icon"
                            value={form.icon}
                            label="Icône (optionnel)"
                            onChange={handleChange}
                            placeholder="Ex: trophy, star..."
                            className="w-full mt-1"
                        />
                    </div>

                    {/* COLOR */}
                    <div>
                        <label htmlFor="color" className="text-sm font-medium">
                            Couleur
                        </label>
                        <input
                            id="color"
                            name="color"
                            type="color"
                            value={form.color}
                            onChange={handleChange}
                            className="w-full mt-1 h-10 rounded-md border border-[var(--color-gray-light)] cursor-pointer"
                        />
                    </div>

                    {/* STATUS */}
                    <div>
                        <label htmlFor="status" className="text-sm font-medium">
                            Statut
                        </label>
                        <select
                            id="status"
                            name="status"
                            value={form.status}
                            onChange={handleChange}
                            className="input w-full mt-1"
                        >
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                    </div>

                    {/* BANNER */}
                    <div>
                        <label htmlFor="banner" className="text-sm font-medium">
                            Bannière (optionnel)
                        </label>
                        {data?.banner && !form.banner && (
                            <img src={data.banner} alt="Bannière actuelle" className="w-full h-20 rounded object-cover mt-1 mb-2" />
                        )}
                        <input
                            id="banner"
                            name="banner"
                            type="file"
                            accept="image/*"
                            onChange={(e) => setForm({ ...form, banner: e.target.files[0] })}
                            className="w-full mt-1 text-sm"
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
                            className="btn-primary flex items-center gap-2 disabled:opacity-50"
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

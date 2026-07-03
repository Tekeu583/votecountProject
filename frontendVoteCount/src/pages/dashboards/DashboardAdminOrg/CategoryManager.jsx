// CategoryManager.jsx
import { useState } from 'react';
import { api } from '@services/api';
import { toast } from 'react-hot-toast';
const CategoryManager = ({ electionUuid, category, onUpdate }) => {
    const [uploading, setUploading] = useState(false);

    const handleBannerUpload = async (file) => {
        setUploading(true);
        const formData = new FormData();
        formData.append('banner', file);

        try {
            await api.post(`/categories/${category.id}/banner`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            toast.success(`Banner pour "${category.name}" mis à jour`);
            onUpdate();
        } catch (error) {
            toast.error('Erreur lors de l\'upload');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="border rounded-lg p-4">
            <h3 className="font-bold mb-2">{category.name}</h3>

            {/* Aperçu du banner actuel */}
            {category.banner && (
                <img src={category.banner} alt={category.name} className="w-full h-32 object-cover rounded mb-2" />
            )}

            {/* Upload nouveau banner */}
            <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => handleBannerUpload(e.target.files[0])}
                disabled={uploading}
                className="text-sm"
            />

            {uploading && <p className="text-blue-500 text-sm mt-1">Upload...</p>}
        </div>
    );
};
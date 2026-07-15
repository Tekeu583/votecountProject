import { useState, useEffect } from 'react';
import { Building2, Mail, Phone, Globe, MapPin, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import TextInput from '@components/ui/TextInput';
import { FadeLoader } from 'react-spinners';
import { useOrg } from '@hooks/useOrg';
import { organizationsApi } from '@services/api';

export default function OrganizationSettingsForm() {
    const { org } = useOrg();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        name: '', description: '', email: '', phone: '', website: '', country: '', city: '', address: '',
    });

    useEffect(() => {
        if (!org?.uuid) return;
        const fetchOrg = async () => {
            setLoading(true);
            try {
                const res = await organizationsApi.get(org.uuid);
                const data = res.data?.data ?? {};
                setForm({
                    name: data.name ?? '',
                    description: data.description ?? '',
                    email: data.email ?? '',
                    phone: data.phone ?? '',
                    website: data.website ?? '',
                    country: data.country ?? '',
                    city: data.city ?? '',
                    address: data.address ?? '',
                });
            } catch {
                toast.error("Impossible de charger les paramètres de l'organisation.");
            } finally {
                setLoading(false);
            }
        };
        fetchOrg();
    }, [org?.uuid]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!org?.uuid) return;

        setSaving(true);
        try {
            await organizationsApi.update(org.uuid, form);
            toast.success('Paramètres de l\'organisation mis à jour.');
        } catch (error) {
            const message = error.response?.data?.message ?? 'Erreur lors de la mise à jour.';
            toast.error(message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="bg-[var(--color-white)] rounded-[var(--radius-md)] shadow-[var(--shadow-md)] p-8 flex justify-center">
                <FadeLoader color="#1e40af" cssOverride={{ display: 'block' }} />
            </div>
        );
    }

    return (
        <div className="bg-[var(--color-white)] rounded-[var(--radius-md)] shadow-[var(--shadow-md)] p-6">
            <div className="flex items-center gap-2 mb-6">
                <Building2 size={20} className="text-[var(--color-primary)]" />
                <h2 className="text-lg font-semibold text-[var(--color-dark)]">Paramètres de l'organisation</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <TextInput
                    label="Nom de l'organisation"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    iconLeft={Building2}
                    required
                />

                <div>
                    <label className="block text-sm font-medium text-[var(--color-dark)] mb-1">Description</label>
                    <textarea
                        name="description"
                        value={form.description}
                        onChange={handleChange}
                        rows={3}
                        className="w-full px-4 py-3 border border-[var(--color-gray-light)] rounded-[var(--radius-md)] focus:outline-none focus:border-[var(--color-primary)] resize-y"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <TextInput label="Email de contact" name="email" type="email" value={form.email} onChange={handleChange} iconLeft={Mail} />
                    <TextInput label="Téléphone" name="phone" value={form.phone} onChange={handleChange} iconLeft={Phone} />
                    <TextInput label="Site web" name="website" value={form.website} onChange={handleChange} iconLeft={Globe} />
                    <TextInput label="Pays" name="country" value={form.country} onChange={handleChange} iconLeft={MapPin} />
                    <TextInput label="Ville" name="city" value={form.city} onChange={handleChange} iconLeft={MapPin} />
                    <TextInput label="Adresse" name="address" value={form.address} onChange={handleChange} iconLeft={MapPin} />
                </div>

                <button
                    type="submit"
                    disabled={saving}
                    className="btn-primary flex items-center gap-2 px-6 py-3 font-medium disabled:opacity-60 disabled:cursor-not-allowed"
                >
                    <Save size={16} />
                    {saving ? 'Enregistrement...' : 'Enregistrer'}
                </button>
            </form>
        </div>
    );
}

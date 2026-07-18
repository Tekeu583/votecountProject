import { useState } from 'react';
import { X, Loader2, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import TextInput from '@components/ui/TextInput';
import { kycApi } from '@services/api';

export default function OrganizationKycModal({ organizationUuid, onClose, onSuccess }) {
    const [documentType, setDocumentType] = useState('national_id');
    const [identityDocument, setIdentityDocument] = useState(null);
    const [businessDocument, setBusinessDocument] = useState(null);
    const [legalRepresentativeName, setLegalRepresentativeName] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!identityDocument || !businessDocument) {
            toast.error("La pièce d'identité et le justificatif d'entreprise sont tous les deux requis.");
            return;
        }
        if (!legalRepresentativeName.trim()) {
            toast.error('Le nom du représentant légal est requis.');
            return;
        }

        const formData = new FormData();
        formData.append('identity_document_type', documentType);
        formData.append('identity_document', identityDocument);
        formData.append('business_document', businessDocument);
        formData.append('legal_representative_name', legalRepresentativeName.trim());

        setSubmitting(true);
        try {
            await kycApi.submit(organizationUuid, formData);
            onSuccess('Documents KYC soumis — en attente de vérification par le super administrateur.');
            onClose();
        } catch (error) {
            toast.error(error.response?.data?.message ?? "Erreur lors de la soumission des documents.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-[var(--color-dark)]/40 opacity-90 flex items-center justify-center text-[var(--text-primary)] z-50">
            <div className="bg-[var(--color-white)] p-6 rounded-[var(--radius-md)] w-full max-w-md relative max-h-[90vh] overflow-y-auto">
                <button onClick={onClose} className="absolute top-4 right-4">
                    <X />
                </button>

                <h2 className="font-bold mb-1">Vérification d'identité (KYC)</h2>
                <p className="text-sm text-[var(--color-gray)] mb-4">
                    Requis avant toute demande de retrait — le super administrateur vérifie vos documents avant d'approuver vos demandes.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm text-[var(--color-gray-dark)]">Type de pièce d'identité</label>
                        <select
                            value={documentType}
                            onChange={(e) => setDocumentType(e.target.value)}
                            className="input w-full"
                        >
                            <option value="national_id">Carte nationale d'identité</option>
                            <option value="passport">Passeport</option>
                        </select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm text-[var(--color-gray-dark)]">Pièce d'identité (PDF, JPG, PNG — max 5 Mo)</label>
                        <label className="flex items-center gap-2 border border-dashed border-[var(--color-gray-light)] rounded-[var(--radius-md)] px-4 py-3 cursor-pointer hover:border-[var(--color-primary)]">
                            <Upload size={16} className="text-[var(--color-gray)]" />
                            <span className="text-sm text-[var(--color-gray)] truncate">
                                {identityDocument?.name ?? 'Choisir un fichier...'}
                            </span>
                            <input
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png"
                                className="hidden"
                                onChange={(e) => setIdentityDocument(e.target.files?.[0] ?? null)}
                            />
                        </label>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm text-[var(--color-gray-dark)]">Justificatif d'entreprise (registre de commerce, statuts...)</label>
                        <label className="flex items-center gap-2 border border-dashed border-[var(--color-gray-light)] rounded-[var(--radius-md)] px-4 py-3 cursor-pointer hover:border-[var(--color-primary)]">
                            <Upload size={16} className="text-[var(--color-gray)]" />
                            <span className="text-sm text-[var(--color-gray)] truncate">
                                {businessDocument?.name ?? 'Choisir un fichier...'}
                            </span>
                            <input
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png"
                                className="hidden"
                                onChange={(e) => setBusinessDocument(e.target.files?.[0] ?? null)}
                            />
                        </label>
                    </div>

                    <TextInput
                        label="Nom du représentant légal"
                        value={legalRepresentativeName}
                        onChange={(e) => setLegalRepresentativeName(e.target.value)}
                        placeholder="Nom complet"
                        required
                    />

                    <button type="submit" disabled={submitting} className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50">
                        {submitting ? <Loader2 size={16} className="animate-spin" /> : null}
                        {submitting ? 'Envoi...' : 'Soumettre pour vérification'}
                    </button>
                </form>
            </div>
        </div>
    );
}

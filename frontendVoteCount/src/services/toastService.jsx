import toast from 'react-hot-toast';
import {
    CheckCircle,
    XCircle,
    Info,
    Loader2
} from 'lucide-react';

// CONFIG GLOBAL
const baseConfig = {
    duration: 4000,
    style: {
        borderRadius: '8px',
        fontSize: '14px',
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
    },
};

// SUCCESS
export const toastSuccess = (message = 'Succès') => {
    return toast.success(message, {
        ...baseConfig,
        icon: <CheckCircle size={18} className="text-white" />,
        style: {
            ...baseConfig.style,
            background: '#16a34a',
            color: '#fff',
        },
    });
};

// ERROR
export const toastError = (message = 'Une erreur est survenue') => {
    return toast.error(message, {
        ...baseConfig,
        icon: <XCircle size={18} className="text-white" />,
        style: {
            ...baseConfig.style,
            background: '#dc2626',
            color: '#fff',
        },
    });
};

// INFO
export const toastInfo = (message = 'Information') => {
    return toast(message, {
        ...baseConfig,
        icon: <Info size={18} className="text-white" />,
        style: {
            ...baseConfig.style,
            background: '#2563eb',
            color: '#fff',
        },
    });
};

// LOADING
export const toastLoading = (message = 'Chargement...') => {
    return toast.loading(message, {
        ...baseConfig,
        icon: (
            <Loader2
                size={18}
                className="animate-spin"
                style={{ animation: 'spin 1s linear infinite' }}
            />
        ),
        style: {
            ...baseConfig.style,
            background: '#374151',
            color: '#fff',
        },
    });
};

// DISMISS
export const toastDismiss = (toastId) => {
    toast.dismiss(toastId);
};

// PROMISE
export const toastPromise = (promise, messages = {}) => {
    return toast.promise(promise, {
        loading: messages.loading || 'Chargement...',
        success: messages.success || 'Succès',
        error: messages.error || 'Erreur',
    });
};
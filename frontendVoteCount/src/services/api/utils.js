// src/services/api/utils.js

// Récupérer les erreurs de validation (422)
export const getValidationErrors = (error) => {
    if (error.response?.status === 422 && error.response.data?.errors) {
        return error.response.data.errors;
    }
    return null;
};

// Vérifier le type d'erreur
export const isValidationError = (error) => error.response?.status === 422;
export const isSessionExpiredError = (error) => error.response?.status === 401;
export const isForbiddenError = (error) => error.response?.status === 403;
export const isNotFoundError = (error) => error.response?.status === 404;
export const isCsrfError = (error) => error.response?.status === 419;

// Upload de fichier générique
export const uploadFile = async (url, file, onProgress) => {
    const formData = new FormData();
    formData.append('file', file);

    const { default: api } = await import('./api');
    const response = await api.post(url, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
            if (onProgress) {
                const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                onProgress(percent);
            }
        }
    });

    return response.data;
};
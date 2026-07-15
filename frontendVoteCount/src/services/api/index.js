// src/services/api/index.js
//
// Point d'entrée unique. Toutes les fonctions auth viennent de ./api.
// Fichiers à SUPPRIMER : auth.js, csrf.js, interceptors.js, "client copy.js"

// ── Auth + client Axios ────────────────────────────────────────────
export {
    default as api,
    V1,
    getCsrfCookie,
    login,
    register,
    logout,
    getUser,
    forgotPassword,
    resetPassword,
    verifyEmail,
    enableTwoFactor,
    verifyTwoFactor,
    updatePassword,
    updateProfile,
    verifyEmailOtp,
    verifyEmailLink,
    resendVerification,
    verifyResetOtp,
} from './api';

// ── Services métier ────────────────────────────────────────────────
export { electionsApi }             from './elections';
export { candidatesApi }            from './candidates';
export { candidateApplicationsApi } from './candidateApplications';
export { electorsApi }              from './electors';
export { votesApi }                 from './votes';
export { paymentsApi }              from './payments';
export { resultsApi }               from './results';
export { organizationsApi }         from './organizations';
export { analyticsApi }             from './analytics';
export { notificationsApi }         from './notifications';
export { plansApi }                 from './plans';
export { securityApi }              from './security';
export { juryApi }                  from './jury';
export { staffApi }                 from './staff';
export { usersApi }                 from './users';
export { candidateDocumentsApi, DOCUMENT_TYPES } from './candidateDocuments';
export { auditApi }                  from './audit';
export { settingsApi }               from './settings';
export { categoriesApi }            from './categories';
export { trashApi }                 from './trash';


// ── Utilitaires ────────────────────────────────────────────────────
export {
    getValidationErrors,
    isValidationError,
    isSessionExpiredError,
    isForbiddenError,
    isNotFoundError,
    isCsrfError,
    uploadFile,
} from './utils';
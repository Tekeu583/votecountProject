<?php


use App\Http\Controllers\Api\V1\Analytics\AnalyticsController;
use App\Http\Controllers\Api\V1\Audit\AuditController;
use App\Http\Controllers\Api\V1\Auth\AuthController;
use App\Http\Controllers\Api\V1\CandidateApplications\CandidateApplicationController;
use App\Http\Controllers\Api\V1\CandidateDocuments\CandidateDocumentController;
use App\Http\Controllers\Api\V1\Candidates\CandidateController;
use App\Http\Controllers\Api\V1\Candidates\FinalistController;
use App\Http\Controllers\Api\V1\Categories\CategoryController;
use App\Http\Controllers\Api\V1\Elections\ElectionCategoryController;
use App\Http\Controllers\Api\V1\Elections\ElectionController;
use App\Http\Controllers\Api\V1\Electors\ElectorController;
use App\Http\Controllers\Api\V1\Organizations\OrganizationController;
use App\Http\Controllers\Api\V1\Payments\PaymentController;
use App\Http\Controllers\Api\V1\Results\ResultController;
use App\Http\Controllers\Api\V1\Settings\SettingController;
use App\Http\Controllers\Api\V1\SubscriptionPlans\SubscriptionPlanController;
use App\Http\Controllers\Api\V1\Users\UserController;
use App\Http\Controllers\Api\V1\Votes\VoteController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API v1 Routes
|--------------------------------------------------------------------------
*/
// ========== ROUTES TRÈS PUBLIQUES ==========
Route::post('payments/webhook/{provider}', [PaymentController::class, 'webhook']);
// ========== ROUTES PUBLIQUES (vote sans authentification) ==========
Route::prefix('elections/{election}')->group(function () {

    // Vote public - direct, sans authentification
    Route::post('/vote/public', [VoteController::class, 'submitPublic']);
    // Paiement pour vote (public comme privé - sans auth)
    Route::post('/vote/payment/initiate', [PaymentController::class, 'initiateForVote']);
    Route::post('/vote/payment/verify', [PaymentController::class, 'verifyVotePayment']);
    Route::get('/vote/payment/status/{transaction_uuid}', [PaymentController::class, 'getVotePaymentStatus']);

    // Résultats - publics
    Route::get('/results/live', [ResultController::class, 'live']);
    Route::get('/results/final', [ResultController::class, 'final']);

    // Candidats - publics
    Route::get('/candidates', [CandidateController::class, 'index']);
    Route::get('/candidates/{candidate}', [CandidateController::class, 'show']);

    // Soumettre une candidature - publiques
    Route::post('/candidate-applications', [CandidateApplicationController::class, 'store']);
    // Vérifier le statut d'une candidature (public)
    Route::get('/candidate-applications/status', [CandidateApplicationController::class, 'checkStatus']);

    Route::get('/categories', [ElectionCategoryController::class, 'index']);
});

// ====== vote private ======
// Vérifier le voter_code (de l'élection) + email (de l'électeur)
Route::prefix('elections')->group(function () {
    // 1. Vérifier le voter_code - obtenir un session_token
    Route::post('/vote/access/verify', [VoteController::class, 'verifyAccess']);

    // 2: Vérifier l'OTP envoyé à l'email de l'électeur.
    Route::post('/{election}/vote/access/verify-otp', [VoteController::class, 'verifyAccessOtp']);

    // 3. Choisir le candidat - demande le code de confirmation finale,
    Route::post('{election}/vote/otp/request', [VoteController::class, 'requestOtp']);

    // 4. soumet le vote avec le code de confirmation.
    Route::post('/{election}/vote/private', [VoteController::class, 'submitPrivate']);

    // 5. Vérifier  un reçu de vote (preuve de participation).
    Route::post('/vote/verify', [VoteController::class, 'verify']);
});

// ========== ROUTES AUTH PUBLIQUES ==========
Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);

    // Vérification email
    Route::post('/verify-email/otp', [AuthController::class, 'verifyEmailOtp']);
    Route::get('/verify-email/link', [AuthController::class, 'verifyEmailLink']);
    Route::post('/verify-email/resend', [AuthController::class, 'resendVerification']);

    // Mot de passe oublié
    Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
    Route::post('/forgot-password/verify-otp', [AuthController::class, 'verifyResetOtp']);
    Route::post('/reset-password', [AuthController::class, 'resetPassword']);

    Route::post('/verify-email/{token}', [AuthController::class, 'verifyEmail']);
});

// ========== ROUTES CATÉGORIES PUBLIQUES ==========
Route::prefix('categories')->group(function () {
    // Liste des catégories actives (publique)
    Route::get('/active', [CategoryController::class, 'getActiveCategories']);

    // Détails d'une catégorie avec ses candidats
    Route::get('/{category}/candidates', [CategoryController::class, 'getCandidates']);
});

// ========== ROUTES ÉLECTIONS PUBLIQUES ==========
Route::prefix('elections')->group(function () {
    Route::get('/public', [ElectionController::class, 'publicIndex']);
    Route::get('/open-for-candidacy', [ElectionController::class, 'openForCandidacy']);
    Route::get('/{election}/public-show', [ElectionController::class, 'publicShow']);
});

// Plans actifs (public)
Route::get('subscription-plans/active', [SubscriptionPlanController::class, 'getActivePlans']);
Route::get('subscription-plans', [SubscriptionPlanController::class, 'index']);
Route::get('subscription-plans/{subscriptionPlan}', [SubscriptionPlanController::class, 'show']);

// ========== ROUTES PROTÉGÉES (SESSION REQUISE) ==========
Route::middleware(['auth:sanctum'])->group(function () {
    // Auth
    Route::prefix('auth')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/me', [AuthController::class, 'me']);
        Route::post('/2fa/enable', [AuthController::class, 'enableTwoFactor']);
        Route::post('/2fa/verify', [AuthController::class, 'verifyTwoFactor']);
        Route::post('/2fa/disable', [AuthController::class, 'disableTwoFactor']);
    });

    // Subscription Plans (CRUD)
    Route::apiResource('subscription-plans', SubscriptionPlanController::class)->except(['index', 'show']);
    Route::post('subscription-plans/{subscriptionPlan}/toggle-status', [SubscriptionPlanController::class, 'toggleStatus']);

    // Users Management (CRUD + Stats + Export)
    Route::prefix('users')->group(function () {
        Route::get('/stats', [UserController::class, 'stats']);
        Route::get('/export', [UserController::class, 'export']);
        Route::get('/', [UserController::class, 'index']);
        Route::post('/', [UserController::class, 'store']);
        Route::get('/{user}', [UserController::class, 'show']);
        Route::put('/{user}', [UserController::class, 'update']);
        Route::delete('/{user}', [UserController::class, 'destroy']);
    });

    // Organizations (CRUD)
    Route::get('organizations/my-organizations', [OrganizationController::class, 'myOrganizations']);
    Route::get('organizations/stats', [OrganizationController::class, 'stats']);
    Route::post('organizations/{organization}/users', [OrganizationController::class, 'addUser']);
    Route::delete('organizations/{organization}/users/{user}', [OrganizationController::class, 'removeUser']);
    Route::get('organizations/{organization}/candidates', [OrganizationController::class, 'getCandidates']);
    Route::apiResource('organizations', OrganizationController::class);

    // Paiement de subscription (AUTH REQUISE)
    Route::prefix('subscriptions')->group(function () {
        Route::post('initiate', [PaymentController::class, 'initiateSubscription']);
        Route::post('verify', [PaymentController::class, 'verifySubscription']);
        Route::get('status', [PaymentController::class, 'getSubscriptionStatus']);
        Route::patch('{subscription}/auto-renew', [PaymentController::class, 'toggleAutoRenew']);
        Route::delete('{subscription}/cancel', [PaymentController::class, 'cancelSubscription']);
    });

    // Elections Management
    Route::get('elections/stats', [ElectionController::class, 'stats']);
    //route pour les elections drafts
    Route::post('elections/draft', [ElectionController::class, 'storeDraft']);
    Route::patch('elections/{election}/draft', [ElectionController::class, 'updateDraft']);

    Route::post('elections/{election}/publish', [ElectionController::class, 'publish']);
    Route::apiResource('elections', ElectionController::class);

    Route::prefix('elections/{election}')->group(function () {
        Route::post('/start', [ElectionController::class, 'start']);
        Route::post('/end', [ElectionController::class, 'end']);
        Route::get('/statistics', [ElectionController::class, 'statistics']);
        Route::post('/managers', [ElectionController::class, 'addManager']);
        Route::delete('/managers/{user}', [ElectionController::class, 'removeManager']);
    });

    // Gestion des documents des candidats
    Route::prefix('candidates/{candidate}')->group(function () {
        Route::get('/documents', [CandidateDocumentController::class, 'index']);
        Route::post('/documents/upload', [CandidateDocumentController::class, 'upload']);
        Route::get('/documents/{document}', [CandidateDocumentController::class, 'show']);
        Route::get('/documents/{document}/download', [CandidateDocumentController::class, 'download']);
        Route::post('/approve', [CandidateController::class, 'approve']);
        Route::post('/reject', [CandidateController::class, 'reject']);
    });

    // Obtenir les types de documents disponibles
    Route::get('/document-types', [CandidateDocumentController::class, 'getDocumentTypes']);

    // Electors Management
    Route::post('elections/{election}/electors/import', [ElectorController::class, 'import']);
    Route::post('elections/{election}/electors/send-codes', [ElectorController::class, 'sendVoterCodes']);

    Route::post('elections/{election}/electors/verify-bulk', [ElectorController::class, 'verifyBulk']);
    Route::get('elections/{election}/electors/import/{importJob}/status', [ElectorController::class, 'importStatus']);
    Route::apiResource('elections.electors', ElectorController::class)->scoped();

    Route::post('electors/{elector}/block', [ElectorController::class, 'block']);
    Route::post('electors/{elector}/verify', [ElectorController::class, 'verify']);

    // Votes (admin - consultation)
    Route::prefix('elections/{election}')->group(function () {
        Route::get('/votes', [VoteController::class, 'index']);
        Route::get('/votes/{vote}', [VoteController::class, 'show']);
        Route::get('/candidate-applications', [CandidateApplicationController::class, 'index']);
        Route::get('/candidate-applications/{candidateApplication}', [CandidateApplicationController::class, 'show']);

        Route::post('/candidate-applications/{candidateApplication}/approve', [CandidateApplicationController::class, 'approve']);

        Route::post('/candidate-applications/{candidateApplication}/reject', [CandidateApplicationController::class, 'reject']);
        // Importer des candidatures depuis un fichier Excel/CSV
        Route::post('/candidates/import', [CandidateController::class, 'import']);
        Route::get('/candidates/import/{importJobId}/status', [CandidateController::class, 'importStatus']);

        // CRUD classique
        Route::apiResource('candidates', CandidateController::class)->scoped()->except(['index', 'show']);

        // Liste des finalistes
        Route::get('/finalists', [FinalistController::class, 'index']);

        // Promouvoir un candidat en finaliste
        Route::post('/candidates/{candidate}/promote', [FinalistController::class, 'promote']);

        // Rétrograder un finaliste
        Route::post('/candidates/{candidate}/demote', [FinalistController::class, 'demote']);

        // Élire le gagnant
        Route::post('/elect-winner', [FinalistController::class, 'electWinner']);

        // Obtenir le gagnant
        Route::get('/winner', [FinalistController::class, 'getWinner']);
    });

    // Catégories d'une élection (has_categories = true)

    Route::post('elections/{election}/create-categories', [ElectionCategoryController::class, 'store']);
    Route::delete('elections/{election}/categories/{category}', [ElectionCategoryController::class, 'destroy']);
    // CRUD complet des catégories
    Route::apiResource('categories', CategoryController::class);

    // Télécharger le template d'import
    Route::get('/candidates/import-template', [CandidateController::class, 'downloadTemplate']);
    // Results Management
    Route::post('elections/{election}/results/calculate', [ResultController::class, 'calculate']);
    Route::get('elections/{election}/results/export', [ResultController::class, 'export']);

    // Analytics
    Route::get('analytics/dashboard', [AnalyticsController::class, 'dashboard']);
    Route::get('analytics/elections/{election}', [AnalyticsController::class, 'electionStats']);

    // Settings
    Route::get('settings', [SettingController::class, 'index']);
    Route::put('settings', [SettingController::class, 'update']);

    // Audit
    Route::get('audit-logs', [AuditController::class, 'index']);
    Route::get('audit-logs/{auditLog}', [AuditController::class, 'show']);
});

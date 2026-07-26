<?php

namespace App\Http\Controllers\Api\V1\Auth;

use App\DTOs\UserDTO;
use App\Enums\UserStatus;
use App\Exceptions\AuthenticationException;
use App\Http\Controllers\Api\V1\BaseApiController;
use App\Http\Requests\Api\V1\Auth\LoginRequest;
use App\Http\Requests\Api\V1\Auth\RegisterRequest;
use App\Http\Resources\Api\V1\UserResource;
use App\Models\OTPCode;
use App\Models\User;
use App\Services\Contracts\AuthServiceInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class AuthController extends BaseApiController
{
    protected AuthServiceInterface $authService;

    public function __construct(AuthServiceInterface $authService)
    {
        $this->authService = $authService;
    }

    /**
     * Charge les rôles ET leurs permissions pour qu'UserResource::getPermissionsArray()
     * puisse accéder à $role->relationLoaded('permissions').
     *
     */
    private function loadUserWithPermissions(mixed $user): void
    {
        $user->load('roles.permissions', 'organizations', 'elections');
    }

    /**
     * @OA\Post(
     *     path="/api/v1/auth/register",
     *     summary="Register a new user",
     *     tags={"Authentication"},
     *
     *     @OA\Response(response=201, description="User registered successfully")
     * )
     */
    public function register(RegisterRequest $request): JsonResponse
    {
        // Récupérer l'IP du client
        $clientIp = $this->getClientIp($request);

        // Récupérer la photo
        $photoPath = null;
        if ($request->hasFile('photo')) {
            $file      = $request->file('photo');
            $filename  = Str::uuid() . '.' . $file->getClientOriginalExtension();
            $photoPath = $file->storeAs('users/photos', $filename, 'public');
        }

        // Créer le DTO avec le chemin de la photo (string), pas le fichier
        $userDTO = UserDTO::fromRequest($request, $photoPath);

        // Enregistrer l'utilisateur
        $user = $this->authService->register($userDTO);

        // Enregistrer l'IP de registration dans les métadonnées ou logs
        $this->logRegistrationIp($user, $clientIp);

        // Load roles and permissions for response
        $this->loadUserWithPermissions($user);

        return $this->created([
            'user' => new UserResource($user),
        ], 'Registration successful. Please verify your email.');
    }

    /**
     * @OA\Post(
     *     path="/api/v1/auth/login",
     *     summary="Login user",
     *     tags={"Authentication"},
     *
     *     @OA\Response(response=200, description="Login successful")
     * )
     */
    public function login(LoginRequest $request): JsonResponse
    {
        // Récupérer l'IP du client
        $clientIp = $this->getClientIp($request);

        $credentials = $request->only('email', 'password');
        $remember = $request->boolean('remember', false);

        if (! Auth::attempt($credentials, $remember)) {
            // Log tentative de connexion échouée avec IP
            $this->logFailedLoginAttempt($request->email, $clientIp);
            throw AuthenticationException::invalidCredentials();
        }

        $user = Auth::user();

        //verifier si l'email est verifier

        if (! $user->email_verified_at) {
            Auth::logout();
            $this->logFailedLoginAttempt($request->email, $clientIp, 'email non verifier');
            throw AuthenticationException::emailNotVerified();
        }

        if ($user->status->value === 'suspended') {
            Auth::logout();
            $this->logFailedLoginAttempt($request->email, $clientIp, 'account_suspended');
            throw AuthenticationException::accountSuspended();
        }

        if ($user->status->value === 'banned') {
            Auth::logout();
            $this->logFailedLoginAttempt($request->email, $clientIp, 'account_banned');
            throw AuthenticationException::accountBanned();
        }

        // Regenerate session to prevent session fixation
        $request->session()->regenerate();

        // Update last login with IP
        $user->updateLastLogin($clientIp);

        // Log successful login
        $this->logSuccessfulLogin($user, $clientIp);

        // Check 2FA
        if ($user->two_factor_enabled) {
            return $this->success([
                'requires_2fa' => true,
                'user_id' => $user->uuid,
            ], 'Two-factor authentication required');
        }

        // Load roles and permissions for response
        $this->loadUserWithPermissions($user);

        return $this->success([
            'user' => new UserResource($user),
        ], 'Login successful');
    }
// loadUserWithPermissions
    /**
     * @OA\Post(
     *     path="/api/v1/auth/logout",
     *     summary="Logout user",
     *     tags={"Authentication"},
     *     security={{"sanctum":{}}},
     *
     *     @OA\Response(response=200, description="Logout successful")
     * )
     */
    public function logout(Request $request): JsonResponse
    {
        $user = $request->user();
        $clientIp = $this->getClientIp($request);

        // Log logout
        if ($user) {
            Log::channel('security')->info('User logged out', [
                'user_id' => $user->id,
                'user_uuid' => $user->uuid,
                'email' => $user->email,
                'ip' => $clientIp,
                'user_agent' => $request->userAgent(),
                'timestamp' => now(),
            ]);
        }

        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return $this->success(null, 'Logout successful');
    }

    /**
     * @OA\Patch(
     *     path="/api/v1/auth/profile",
     *     summary="Update authenticated user's profile",
     *     tags={"Authentication"},
     *     security={{"sanctum":{}}},
     *
     *     @OA\Response(response=200, description="Profile updated successfully")
     * )
     */
    public function updateProfile(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'first_name' => ['sometimes', 'string', 'max:255'],
            'last_name' => ['sometimes', 'string', 'max:255'],
            'phone' => ['sometimes', 'nullable', 'string', 'max:20'],
            'photo' => ['sometimes', 'image', 'mimes:jpg,jpeg,png', 'max:5120'],
        ]);

        $user = $request->user();

        if ($request->hasFile('photo')) {
            if ($user->photo && ! str_starts_with($user->photo, 'http')) {
                Storage::disk('public')->delete($user->photo);
            }

            $file = $request->file('photo');
            $filename = Str::uuid().'.'.$file->getClientOriginalExtension();
            $validated['photo'] = $file->storeAs('users/photos', $filename, 'public');
        }

        $updated = $this->authService->updateProfile($user, $validated);

        return $this->success(new UserResource($updated), 'Profil mis à jour avec succès.');
    }

    /**
     * @OA\Patch(
     *     path="/api/v1/auth/password",
     *     summary="Update authenticated user's password",
     *     tags={"Authentication"},
     *     security={{"sanctum":{}}},
     *
     *     @OA\Response(response=200, description="Password updated successfully")
     * )
     */
    public function updatePassword(Request $request): JsonResponse
    {
        $request->validate([
            'current_password' => ['required', 'string'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        $changed = $this->authService->changePassword(
            $request->user(),
            $request->input('current_password'),
            $request->input('password')
        );

        if (! $changed) {
            return $this->error('Mot de passe actuel incorrect.', null, 422);
        }

        return $this->success(null, 'Mot de passe mis à jour avec succès.');
    }

    /**
     * @OA\Get(
     *     path="/api/v1/auth/me",
     *     summary="Get authenticated user",
     *     tags={"Authentication"},
     *     security={{"sanctum":{}}},
     *
     *     @OA\Response(response=200, description="User retrieved successfully")
     * )
     */
    public function me(Request $request): JsonResponse
    {
        $user = $request->user();

        if (! $user) {
            return $this->unauthorized('Not authenticated');
        }

        // Load roles and permissions for response
        $this->loadUserWithPermissions($user);

        return $this->success(new UserResource($user));
    }

    /**
     * @OA\Post(
     *     path="/api/v1/auth/verify-email/{token}",
     *     summary="Verify email address",
     *     tags={"Authentication"},
     *
     *     @OA\Response(response=200, description="Email verified successfully")
     * )
     */
    public function verifyEmail(string $token): JsonResponse
    {
        $verified = $this->authService->verifyEmail($token);

        if (! $verified) {
            return $this->error('Invalid or expired verification token', null, 400);
        }

        return $this->success(null, 'Email verified successfully');
    }

    /**
     * @OA\Post(
     *     path="/api/v1/auth/forgot-password",
     *     summary="Send password reset link",
     *     tags={"Authentication"},
     *
     *     @OA\Response(response=200, description="Reset link sent")
     * )
     */
    public function forgotPassword(Request $request): JsonResponse
    {
        $request->validate(['email' => 'required|email']);

        $clientIp = $this->getClientIp($request);

        // Log password reset request
        Log::channel('security')->info('Password reset requested', [
            'email' => $request->email,
            'ip' => $clientIp,
            'user_agent' => $request->userAgent(),
            'timestamp' => now(),
        ]);

        $sent = $this->authService->sendPasswordResetLink($request->email);

        return $this->success(null, 'Password reset link sent if email exists');
    }

    /**
     * @OA\Post(
     *     path="/api/v1/auth/reset-password",
     *     summary="Reset password",
     *     tags={"Authentication"},
     *
     *     @OA\Response(response=200, description="Password reset successfully")
     * )
     */
    public function resetPassword(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email',
            'token' => 'required|string',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $clientIp = $this->getClientIp($request);

        $reset = $this->authService->resetPassword(
            $request->email,
            $request->token,
            $request->password
        );

        if (! $reset) {
            Log::channel('security')->warning('Password reset failed', [
                'email' => $request->email,
                'ip' => $clientIp,
                'timestamp' => now(),
            ]);

            return $this->error('Invalid or expired reset token', null, 400);
        }

        Log::channel('security')->info('Password reset successful', [
            'email' => $request->email,
            'ip' => $clientIp,
            'timestamp' => now(),
        ]);

        return $this->success(null, 'Password reset successfully');
    }

    /**
     * @OA\Post(
     *     path="/api/v1/auth/2fa/enable",
     *     summary="Enable two-factor authentication",
     *     tags={"Authentication"},
     *     security={{"sanctum":{}}},
     *
     *     @OA\Response(response=200, description="2FA enabled")
     * )
     */
    public function enableTwoFactor(Request $request): JsonResponse
    {
        $secret = $this->authService->enableTwoFactor($request->user());

        $qrCode = app('pragmarx/google2fa')->getQRCodeInline(
            config('app.name'),
            $request->user()->email,
            $secret
        );

        return $this->success([
            'secret' => $secret,
            'qr_code' => $qrCode,
        ], '2FA setup initiated. Please verify your code.');
    }

    /**
     * @OA\Post(
     *     path="/api/v1/auth/2fa/verify",
     *     summary="Verify and enable two-factor authentication",
     *     tags={"Authentication"},
     *     security={{"sanctum":{}}},
     *
     *     @OA\Response(response=200, description="2FA verified and enabled")
     * )
     */
    public function verifyTwoFactor(Request $request): JsonResponse
    {
        $request->validate(['code' => 'required|string|size:6']);

        $verified = $this->authService->verifyTwoFactor($request->user(), $request->code);

        if (! $verified) {
            return $this->error('Invalid 2FA code', null, 400);
        }

        return $this->success(null, '2FA enabled successfully');
    }

    /**
     * POST /api/v1/auth/2fa/disable
     * Désactive le 2FA après vérification du mot de passe courant.
     *
     * Payload : { password: string }
     *
     * On exige le mot de passe pour éviter qu'une session volée
     * ne puisse désactiver le 2FA sans connaissance du mot de passe.
     */
    public function disableTwoFactor(Request $request): JsonResponse
    {
        $request->validate([
            'password' => 'required|string',
        ]);

        $user = $request->user();

        // Vérifier le mot de passe avant de désactiver
        if (! \Illuminate\Support\Facades\Hash::check($request->password, $user->password)) {
            return $this->error('Mot de passe incorrect', null, 403);
        }

        if (! $user->two_factor_enabled) {
            return $this->error('Le 2FA n\'est pas activé sur ce compte', null, 400);
        }

        $this->authService->disableTwoFactor($user);

        Log::channel('security')->info('2FA disabled', [
            'user_id'    => $user->id,
            'user_uuid'  => $user->uuid,
            'email'      => $user->email,
            'ip'         => $this->getClientIp($request),
            'user_agent' => $request->userAgent(),
            'timestamp'  => now(),
        ]);

        return $this->success(null, '2FA désactivé avec succès');
    }

    /**
     * Récupérer l'adresse IP du client (supporte les proxys)
     */
    protected function getClientIp(Request $request): string
    {
        // Vérifier les en-têtes de proxy
        $headers = [
            'HTTP_X_FORWARDED_FOR',
            'HTTP_X_REAL_IP',
            'HTTP_CLIENT_IP',
            'HTTP_X_FORWARDED',
            'HTTP_FORWARDED_FOR',
            'HTTP_FORWARDED',
            'REMOTE_ADDR',
        ];

        foreach ($headers as $header) {
            if ($request->server($header)) {
                $ips = explode(',', $request->server($header));
                $ip = trim($ips[0]);
                if (filter_var($ip, FILTER_VALIDATE_IP)) {
                    return $ip;
                }
            }
        }

        return $request->ip() ?? '0.0.0.0';
    }

    /**
     * Log l'IP de registration
     */
    protected function logRegistrationIp($user, string $ip): void
    {
        Log::channel('security')->info('New user registration', [
            'user_id' => $user->id,
            'user_uuid' => $user->uuid,
            'email' => $user->email,
            'ip' => $ip,
            'user_agent' => request()->userAgent(),
            'timestamp' => now(),
        ]);
    }

    /**
     * Log une tentative de connexion échouée
     */
    protected function logFailedLoginAttempt(string $email, string $ip, string $reason = 'invalid_credentials'): void
    {
        Log::channel('security')->warning('Failed login attempt', [
            'email' => $email,
            'ip' => $ip,
            'reason' => $reason,
            'user_agent' => request()->userAgent(),
            'timestamp' => now(),
        ]);
    }

    /**
     * Log une connexion réussie
     */
    protected function logSuccessfulLogin($user, string $ip): void
    {
        Log::channel('security')->info('Successful login', [
            'user_id' => $user->id,
            'user_uuid' => $user->uuid,
            'email' => $user->email,
            'ip' => $ip,
            'user_agent' => request()->userAgent(),
            'timestamp' => now(),
        ]);
    }

    /**
     * POST /api/v1/auth/verify-email/otp
     * Vérifie le code OTP 6 chiffres saisi par l'utilisateur.
     *
     * Body: { email: string, otp: string }
     */
    public function verifyEmailOtp(Request $request): JsonResponse
    {
        $request->validate([
            'email' => ['required', 'email'],
            'otp'   => ['required', 'string', 'digits:6'],
        ]);

        $user = User::where('email', $request->email)->first();

        if (! $user) {
            return $this->error('Aucun compte associé à cet email.', null, 404);
        }

        if ($user->email_verified_at) {
            return $this->success(null, 'Votre email est déjà vérifié.');
        }

        // Récupérer l'OTP valide en base
        $otpRecord = OTPCode::where('user_id', $user->id)
            ->where('type', 'email_verification')
            ->where('status', 'pending')
            ->where('expires_at', '>', now())
            ->latest()
            ->first();

        if (! $otpRecord) {
            return $this->error('Code expiré ou invalide. Demandez un nouveau code.', null, 400);
        }

        if ($otpRecord->attempts >= 5) {
            return $this->error('Trop de tentatives. Demandez un nouveau code.', null, 429);
        }

        // Vérifier le code (stocké haché)
        if (! Hash::check($request->otp, $otpRecord->code)) {
            $otpRecord->incrementAttempts();
            $remaining = 5 - $otpRecord->attempts;

            return $this->error(
                "Code incorrect. {$remaining} tentative(s) restante(s).",
                ['remaining_attempts' => $remaining],
                400
            );
        }

        // Code correct — marquer comme vérifié
        $otpRecord->verify();

        // Marquer l'email comme vérifié
        $user->forceFill(['email_verified_at' => now()])->save();

        //marquer le statut de l'utilisateur comme actif avec enum UserStatus
        $user->forceFill(['status' => UserStatus::ACTIVE])->save();


        // Auto-login
        Auth::login($user);
        $request->session()->regenerate();
        $user->updateLastLogin($this->getClientIp($request));

        $this->loadUserWithPermissions($user);

        Log::channel('security')->info('Email verified via OTP', [
            'user_id' => $user->id,
            'email'   => $user->email,
            'ip'      => $this->getClientIp($request),
        ]);

        return $this->success([
            'user' => new UserResource($user),
        ], 'Email vérifié avec succès. Bienvenue !');
    }

    /**
     * GET /api/v1/auth/verify-email/link?token=xxx&email=xxx
     * Vérification via le lien magique cliqué dans l'email.
     */
    public function verifyEmailLink(Request $request): JsonResponse
    {
        $request->validate([
            'token' => ['required', 'string'],
            'email' => ['required', 'email'],
        ]);

        $user = User::where('email', $request->email)->first();

        if (! $user) {
            return $this->error('Lien invalide ou expiré.', null, 400);
        }

        if ($user->email_verified_at) {
            return $this->success(null, 'Votre email est déjà vérifié.');
        }

        // Récupérer le token valide en base
        $otpRecord = OTPCode::where('user_id', $user->id)
            ->where('type', 'email_verification')
            ->where('token', $request->token)
            ->where('status', 'pending')
            ->where('expires_at', '>', now())
            ->first();

        if (! $otpRecord) {
            return $this->error('Lien invalide ou expiré.', null, 400);
        }

        // Marquer comme vérifié
        $otpRecord->verify();

        // Marquer l'email comme vérifié
        $user->forceFill(['email_verified_at' => now()])->save();

        //marquer le statut de l'utilisateur comme actif avec enum UserStatus
        $user->forceFill(['status' => UserStatus::ACTIVE])->save();

        // Auto-login
        Auth::login($user);
        $request->session()->regenerate();
        $user->updateLastLogin($this->getClientIp($request));

        $this->loadUserWithPermissions($user);

        Log::channel('security')->info('Email verified via link', [
            'user_id' => $user->id,
            'email'   => $user->email,
            'ip'      => $this->getClientIp($request),
        ]);

        return $this->success([
            'user' => new UserResource($user),
        ], 'Email vérifié avec succès. Bienvenue !');
    }

    /**
     * POST /api/v1/auth/verify-email/resend
     * Renvoi d'un nouveau code (max 3 fois par heure).
     *
     * Body: { email: string }
     */
    public function resendVerification(Request $request): JsonResponse
    {
        $request->validate([
            'email' => ['required', 'email'],
        ]);

        $user = User::where('email', $request->email)->first();

        // Réponse neutre — pas d'énumération d'email
        if (! $user || $user->email_verified_at) {
            return $this->success(
                null,
                'Si cet email existe et n\'est pas encore vérifié, un nouveau code vous a été envoyé.'
            );
        }

        // Rate limiting : max 3 renvois par heure
        $countKey    = "email_verify_resend_{$user->id}";
        $cooldownKey = "email_verify_cooldown_{$user->id}";

        if (Cache::has($cooldownKey)) {
            return $this->error('Veuillez patienter 60 secondes avant de renvoyer.', null, 429);
        }

        if ((int) Cache::get($countKey, 0) >= 3) {
            return $this->error('Limite atteinte. Réessayez dans 1 heure.', null, 429);
        }

        // Enregistrer le renvoi
        Cache::put($cooldownKey, true, now()->addSeconds(60));
        Cache::put($countKey, (int) Cache::get($countKey, 0) + 1, now()->addHour());

        // Déléguer à AuthService qui gère la création OTPCode + dispatch job
        $this->authService->sendEmailVerification($user);

        return $this->success(null, 'Un nouveau code de vérification vous a été envoyé.');
    }

    /**
     * POST /api/v1/auth/forgot-password/verify-otp
     * Étape 2 du reset password : vérifie l'OTP et retourne un reset_token.
     *
     * Body: { email: string, otp: string }
     * Response: { reset_token: string, expires_in: int }
     */
    public function verifyResetOtp(Request $request): JsonResponse
    {
        $request->validate([
            'email' => ['required', 'email'],
            'otp'   => ['required', 'string', 'digits:6'],
        ]);

        $user = User::where('email', $request->email)->first();

        // Réponse neutre
        if (! $user) {
            return $this->error('Code invalide ou expiré.', null, 400);
        }

        $otpRecord = OTPCode::where('user_id', $user->id)
            ->where('type', 'password_reset')
            ->where('status', 'pending')
            ->where('expires_at', '>', now())
            ->latest()
            ->first();

        if (! $otpRecord) {
            return $this->error('Code expiré. Faites une nouvelle demande.', null, 400);
        }

        if ($otpRecord->attempts >= 5) {
            return $this->error('Trop de tentatives. Faites une nouvelle demande.', null, 429);
        }

        if (! Hash::check($request->otp, $otpRecord->code)) {
            $otpRecord->incrementAttempts();
            $remaining = 5 - $otpRecord->attempts;

            Log::channel('security')->warning('Password reset OTP invalid attempt', [
                'user_id'   => $user->id,
                'remaining' => $remaining,
                'ip'        => $this->getClientIp($request),
            ]);

            return $this->error(
                "Code incorrect. {$remaining} tentative(s) restante(s).",
                ['remaining_attempts' => $remaining],
                400
            );
        }

        // Code correct — marquer comme vérifié
        $otpRecord->verify();

        // Émettre un reset_token temporaire (15 min) pour autoriser la step 3
        $resetToken = bin2hex(random_bytes(20)); // 40 chars, 160 bits
        Cache::put("pwd_reset_token_{$resetToken}", $user->id, now()->addMinutes(15));

        Log::channel('security')->info('Password reset OTP verified', [
            'user_id' => $user->id,
            'ip'      => $this->getClientIp($request),
        ]);

        return $this->success([
            'reset_token' => $resetToken,
            'expires_in'  => 900, // 15 minutes en secondes
        ], 'Code vérifié. Vous pouvez maintenant réinitialiser votre mot de passe.');
    }
}

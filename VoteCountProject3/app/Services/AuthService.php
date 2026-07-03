<?php

namespace App\Services;

use App\DTOs\UserDTO;
use App\Exceptions\AuthenticationException;
use App\Jobs\SendOtpCode;
use App\Jobs\SendPasswordResetEmail;
use App\Jobs\SendVerificationEmail;
use App\Models\OTPCode;
use App\Models\User;
use App\Repositories\Contracts\UserRepositoryInterface;
use App\Services\Contracts\AuthServiceInterface;
use App\Services\RoleService;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class AuthService implements AuthServiceInterface
{
    protected UserRepositoryInterface $userRepository;

    public function __construct(UserRepositoryInterface $userRepository)
    {
        $this->userRepository = $userRepository;
    }

    public function register(UserDTO $userDTO): User
    {
        // Check if user exists
        if ($this->userRepository->findByEmail($userDTO->email)) {
            throw ValidationException::withMessages([
                'email' => ['Cet email est déjà associé à un compte existant.'],
            ]);
        }

        // Create user
        $user = $this->userRepository->create([
            'first_name' => $userDTO->firstName,
            'last_name' => $userDTO->lastName,
            'email' => $userDTO->email,
            'phone' => $userDTO->phone,
            'password' => Hash::make($userDTO->password),
            'photo' => $userDTO->photo,
            'gender' => $userDTO->gender,
            'country' => $userDTO->country,
            'city' => $userDTO->city,
            'locale' => $userDTO->locale,
            'timezone' => $userDTO->timezone,
            'status' => $userDTO->status,
        ]);

        // Assign default role using RoleService
        RoleService::assignDefaultRole($user, 'user');

        // Generate email verification token
        $this->sendEmailVerification($user);

        return $user;
    }

    public function login(string $email, string $password, string $ip): ?User
    {
        $user = $this->userRepository->findByEmail($email);

        if (! $user || ! Hash::check($password, $user->password)) {
            throw AuthenticationException::invalidCredentials();
        }

        if ($user->status->value === 'suspended') {
            throw AuthenticationException::accountSuspended();
        }

        if (! $user->email_verified_at) {
            throw AuthenticationException::emailNotVerified();
        }

        // Update last login
        $this->userRepository->updateLastLogin($user->id, $ip);

        return $user;
    }

    public function logout(User $user): void
    {
        $user->currentAccessToken()->delete();
    }

    public function verifyEmail(string $token): bool
    {
        $userId = Cache::get("email_verification_{$token}");

        if (! $userId) {
            return false;
        }

        $user = $this->userRepository->find($userId);

        if (! $user) {
            return false;
        }

        $this->userRepository->verifyEmail($user->id);
        Cache::forget("email_verification_{$token}");

        return true;
    }

    public function sendEmailVerification(User $user): void
    {
        // Invalider les anciens OTP en attente
        OTPCode::where('user_id', $user->id)
            ->where('type', 'email_verification')
            ->where('status', 'pending')
            ->update(['status' => 'expired']);

        // Générer OTP 6 chiffres
        $otp   = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        $token = Str::random(64);

        // Stocker dans OTPCode (source de vérité)
        OTPCode::create([
            'user_id'    => $user->id,
            'type'       => 'email_verification',
            'code'       => Hash::make($otp),
            'token'      => $token,
            'channel'    => 'email',
            'ip_address' => request()->ip(),
            'expires_at' => now()->addMinutes(10),
            'status'     => 'pending',
        ]);

        // Cache Redis (fast path)
        Cache::put("email_otp_{$user->id}", Hash::make($otp), now()->addMinutes(10));
        // Dispatch email job
        dispatch(new SendVerificationEmail($user, $token, $otp));
    }

    public function sendPasswordResetLink(string $email): bool
    {
        $user = $this->userRepository->findByEmail($email);
        if (! $user) {
            usleep(random_int(200000, 400000)); // anti-énumération
            return true; // réponse neutre
        }

        // Invalider les anciens OTP reset
        OTPCode::where('user_id', $user->id)
            ->where('type', 'password_reset')
            ->where('status', 'pending')
            ->update(['status' => 'expired']);

        $otp = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        OTPCode::create([
            'user_id'    => $user->id,
            'type'       => 'password_reset',
            'code'       => Hash::make($otp),
            'channel'    => 'email',
            'ip_address' => request()->ip(),
            'expires_at' => now()->addMinutes(15),
            'status'     => 'pending',
        ]);

        Cache::put("pwd_reset_otp_{$user->id}", Hash::make($otp), now()->addMinutes(15));
        // Dispatch email job
        dispatch(new SendPasswordResetEmail($user, $otp));

        return true;
    }
    public function resetPassword(string $email, string $token, string $password): bool
    {
        $userId = Cache::get("pwd_reset_token_{$token}");

        if (! $userId) {
            return false;
        }

        $user = $this->userRepository->find($userId);

        if (! $user || $user->email !== $email) {
            return false;
        }

        $this->userRepository->update($user->id, [
            'password' => Hash::make($password),
        ]);

        Cache::forget("pwd_reset_token_{$token}");

        return true;
    }

    public function enableTwoFactor(User $user): string
    {
        $secret = app('pragmarx/google2fa')->generateSecretKey();

        $this->userRepository->update($user->id, [
            'two_factor_secret' => encrypt($secret),
            'two_factor_enabled' => false,
        ]);

        return $secret;
    }

    public function verifyTwoFactor(User $user, string $code): bool
    {
        $secret = decrypt($user->two_factor_secret);
        $valid = app('pragmarx/google2fa')->verifyKey($secret, $code);

        if ($valid && ! $user->two_factor_enabled) {
            $this->userRepository->update($user->id, [
                'two_factor_enabled' => true,
            ]);
        }

        return $valid;
    }

    /**
     * Désactive le 2FA et efface le secret TOTP.
     *
     * On efface aussi les recovery codes si présents.
     * La vérification du mot de passe est faite dans le controller,
     * pas ici — respecte la séparation des responsabilités.
     */
    public function disableTwoFactor(User $user): void
    {
        $this->userRepository->update($user->id, [
            'two_factor_enabled'        => false,
            'two_factor_secret'         => null,
            'two_factor_recovery_codes' => null,
        ]);
    }

    public function generateOtp(User $user, string $channel): string
    {
        $otp = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        Cache::put("otp_{$user->id}_{$channel}", Hash::make($otp), now()->addMinutes(5));

        // Dispatch OTP sending job
        dispatch(new SendOtpCode($user, $otp, $channel));

        return $otp;
    }

    public function verifyOtp(User $user, string $code): bool
    {
        $storedHash = Cache::get("otp_{$user->id}_email") ?? Cache::get("otp_{$user->id}_sms");

        if (! $storedHash || ! Hash::check($code, $storedHash)) {
            return false;
        }

        Cache::forget("otp_{$user->id}_email");
        Cache::forget("otp_{$user->id}_sms");

        return true;
    }


    protected function assignDefaultRole(User $user): void
    {
        RoleService::assignDefaultRole($user, 'user');
    }
}

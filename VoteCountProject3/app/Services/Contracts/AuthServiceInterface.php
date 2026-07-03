<?php

namespace App\Services\Contracts;

use App\DTOs\UserDTO;
use App\Models\User;

interface AuthServiceInterface
{
    public function register(UserDTO $userDTO): User;

    public function login(string $email, string $password, string $ip): ?User;

    public function logout(User $user): void;

    public function verifyEmail(string $token): bool;

    public function sendPasswordResetLink(string $email): bool;

    public function sendEmailVerification(User $user): void;

    public function resetPassword(string $email, string $token, string $password): bool;

    public function enableTwoFactor(User $user): string;

    public function verifyTwoFactor(User $user, string $code): bool;

    public function disableTwoFactor(User $user): void;

    public function generateOtp(User $user, string $channel): string;

    public function verifyOtp(User $user, string $code): bool;
}

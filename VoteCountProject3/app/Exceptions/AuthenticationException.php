<?php

namespace App\Exceptions;

class AuthenticationException extends CustomException
{
    protected string $errorCode = 'AUTH_ERROR';

    protected int $httpStatusCode = 401;

    public function __construct(string $message = '', int $httpStatusCode = 401)
    {
        parent::__construct($message);
        $this->httpStatusCode = $httpStatusCode; // ← stocker dans la bonne propriété
    }
    public static function invalidCredentials(): self
    {
        return new self('Email ou mot de passe incorrect', 401);
    }

    public static function emailNotVerified(): self
    {
        return new self('Email non vérifié', 403);
    }

    public static function accountSuspended(): self
    {
        return new self('Compte suspendu', 403);
    }

    public static function tooManyAttempts(int $seconds): self
    {
        return new self("Trop de tentatives. Réessayez dans {$seconds} secondes", 429);
    }

    public static function invalidTwoFactorCode(): self
    {
        return new self('Code 2FA invalide', 401);
    }
}

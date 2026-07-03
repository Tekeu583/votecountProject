<?php

namespace App\Exceptions;

class PaymentException extends CustomException
{
    protected string $errorCode = 'PAYMENT_ERROR';

    protected int $httpStatusCode = 400;

    public static function providerError(string $provider, string $message): self
    {
        return new self("Erreur du fournisseur {$provider}: {$message}", 400);
    }

    public static function invalidAmount(): self
    {
        return new self('Montant invalide', 400);
    }

    public static function transactionNotFound(): self
    {
        return new self('Transaction non trouvée', 404);
    }

    public static function alreadyProcessed(): self
    {
        return new self('Transaction déjà traitée', 400);
    }

    public static function webhookVerificationFailed(): self
    {
        return new self('Vérification du webhook échouée', 401);
    }
}

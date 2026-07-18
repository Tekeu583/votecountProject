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

    public static function kycNotVerified(): self
    {
        return new self("L'organisation doit être vérifiée (KYC) avant de pouvoir demander un retrait", 403);
    }

    public static function insufficientAvailableBalance(): self
    {
        return new self('Solde disponible insuffisant pour ce retrait', 400);
    }

    public static function withdrawalRequestPending(): self
    {
        return new self('Une demande de retrait est déjà en cours pour cette organisation', 400);
    }

    public static function withdrawalNotPending(): self
    {
        return new self('Cette demande de retrait a déjà été traitée', 400);
    }

    public static function withdrawalNotApproved(): self
    {
        return new self("Cette demande de retrait doit d'abord être approuvée avant d'être marquée payée", 400);
    }
}

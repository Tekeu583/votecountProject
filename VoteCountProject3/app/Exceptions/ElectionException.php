<?php

namespace App\Exceptions;

class ElectionException extends CustomException
{
    protected string $errorCode = 'ELECTION_ERROR';

    protected int $httpStatusCode = 400;

    public static function noActiveSubscription(): self
    {
        return new self(
            'Votre organisation n\'a pas d\'abonnement actif. Choisissez un plan pour créer une élection.',
            403
        );
    }

    public static function electionLimitReached(int $max): self
    {
        return new self(
            "Votre plan actuel est limité à {$max} élection(s). Passez à un abonnement supérieur pour en créer davantage.",
            403
        );
    }

    public static function notFound(): self
    {
        return new self('Élection non trouvée', 404);
    }

    public static function notAccessible(): self
    {
        return new self('Vous navez pas accès à cette élection', 403);
    }

    public static function invalidStatus(): self
    {
        return new self("Statut de l'élection invalide pour cette opération", 400);
    }

    public static function maxCandidatesExceeded(int $max): self
    {
        return new self("Nombre maximum de candidats atteint ({$max})", 400);
    }

    public static function electionFull(): self
    {
        return new self("L'élection a atteint sa capacité maximale", 400);
    }

    public static function alreadyPublished(): self
    {
        return new self("L'élection est déjà publiée", 400);
    }
}

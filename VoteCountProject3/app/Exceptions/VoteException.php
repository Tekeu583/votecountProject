<?php

namespace App\Exceptions;

class VoteException extends CustomException
{
    protected string $errorCode = 'VOTE_ERROR';

    protected int $httpStatusCode = 400;

    public static function alreadyVoted(): self
    {
        return new self('Vous avez déjà voté pour cette élection', 400);
    }

    public static function electionClosed(): self
    {
        return new self("L'élection est terminée", 400);
    }

    public static function electionNotStarted(): self
    {
        return new self("L'élection n'a pas encore commencé", 400);
    }

    public static function invalidVoteType(): self
    {
        return new self('Type de vote invalide', 400);
    }

    public static function maxVotesExceeded(int $max): self
    {
        return new self("Vous ne pouvez voter que {$max} fois maximum", 400);
    }

    public static function electorNotVerified(): self
    {
        return new self("Votre compte électeur n'a pas encore été vérifié par l'organisateur. Contactez-le pour débloquer votre droit de vote.", 403);
    }

    public static function electorBlocked(): self
    {
        return new self('Votre compte électeur a été bloqué. Contactez l\'organisateur de l\'élection.', 403);
    }
    public static function insufficientBalance(): self
    {
        return new self('Solde insuffisant pour voter', 402);
    }

      // montant payé qui n'est pas un multiple exact du prix
    // du vote (ex: vote_price=25, électeur envoie 100 → OK ; envoie 90 → rejeté).
    public static function invalidVoteAmount(float $votePrice): self
    {
        return new self(
            "Le montant doit être un multiple exact de {$votePrice} (le prix d'un vote).",
            422
        );
    }
    public static function otpRequired(): self
    {
        return new self('Code OTP requis', 428);
    }

    public static function invalidOtp(): self
    {
        return new self('Code OTP invalide', 400);
    }

    public static function fraudDetected(float $score): self
    {
        return new self("Comportement suspect détecté (score: {$score})", 403);
    }

    public static function duplicateCandidates(): self
    {
        return new self('Un même candidat ne peut pas apparaître plusieurs fois dans un même vote', 422);
    }

    public static function maxChoicesExceeded(int $max): self
    {
        return new self("Vous ne pouvez pas sélectionner plus de {$max} candidat(s)", 422);
    }

    public static function singleVoteRequiresOneCandidate(): self
    {
        return new self('Ce vote ne permet de choisir qu\'un seul candidat', 422);
    }

    public static function invalidRankPosition(): self
    {
        return new self('La position de classement est requise et doit être un entier positif pour chaque candidat classé', 422);
    }

    public static function invalidRanking(): self
    {
        return new self('Le classement doit être une séquence continue commençant à 1, sans doublon ni trou', 422);
    }

    public static function invalidScore(): self
    {
        return new self('Le score doit être compris entre 0 et 10', 422);
    }

    public static function amountRequiredPerCandidate(): self
    {
        return new self('Vous devez indiquer un montant supérieur à 0 pour chaque candidat sélectionné', 422);
    }
}

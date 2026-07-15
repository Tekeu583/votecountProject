<?php

namespace App\Services;

use App\Models\Candidate;
use App\Models\User;
use Illuminate\Support\Facades\DB;

/**
 * Lie un Candidate à un compte utilisateur existant, par correspondance
 * d'email — un candidat n'est jamais obligé d'avoir un compte VoteCount,
 * mais s'il en a un (ou en crée un après coup), il doit avoir accès à son
 * espace candidat.
 *
 * Deux sens de liaison, car l'ordre de création n'est pas garanti :
 *   - linkIfAccountExists()        : candidat créé APRÈS le compte.
 *   - linkExistingCandidaciesToUser() : compte créé APRÈS le(s) candidat(s).
 *
 * unlink() est le symétrique appelé à la suppression du candidat — sans ça
 * le rôle election_user (role_slug='candidat') reste orphelin et bloque
 * toute autre affectation (jury/manager/observer) sur cette élection.
 */
class CandidateAccountLinkService
{
    public static function linkIfAccountExists(Candidate $candidate): void
    {
        if ($candidate->user_id || ! $candidate->email) {
            return;
        }

        $user = User::where('email', $candidate->email)->first();
        if ($user) {
            self::link($candidate, $user);
        }
    }

    public static function linkExistingCandidaciesToUser(User $user): void
    {
        Candidate::where('email', $user->email)
            ->whereNull('user_id')
            ->get()
            ->each(fn (Candidate $candidate) => self::link($candidate, $user));
    }

    /**
     * Rétablit le lien après restauration depuis la corbeille. Distinct de
     * linkIfAccountExists() : celle-ci s'arrête immédiatement si user_id est
     * déjà renseigné (cas normal hors restauration) — ici c'est justement le
     * cas (restore() ne l'efface pas), donc il faut reconstruire le pivot
     * sans repasser par la recherche par email.
     */
    public static function relinkAfterRestore(Candidate $candidate): void
    {
        if (! $candidate->user_id) {
            self::linkIfAccountExists($candidate);
            return;
        }

        $user = $candidate->user ?? User::find($candidate->user_id);
        if ($user) {
            self::link($candidate, $user);
        }
    }

    public static function unlink(Candidate $candidate): void
    {
        if (! $candidate->user_id) {
            return;
        }

        // Ne retire que le rôle "candidat" — ne touche pas au rôle Spatie
        // global (l'utilisateur peut être candidat sur d'autres élections)
        // ni à un éventuel autre rôle election_user (impossible en pratique
        // vu la contrainte unique election_id+user_id, mais scoper reste
        // plus sûr qu'un detach() inconditionnel).
        DB::table('election_user')
            ->where('election_id', $candidate->election_id)
            ->where('user_id', $candidate->user_id)
            ->where('role_slug', 'candidat')
            ->delete();
    }

    private static function link(Candidate $candidate, User $user): void
    {
        $candidate->update(['user_id' => $user->id]);

        // election_user a une contrainte unique (election_id, user_id) — si
        // l'utilisateur a déjà un autre rôle sur cette élection (creator,
        // jury...), on ne le duplique pas : ce rôle existant prévaut pour
        // l'accès à cette élection précise, mais le rôle global "candidat"
        // est assigné quand même (utile pour les autres élections).
        $alreadyLinked = $user->elections()
            ->where('election_id', $candidate->election_id)
            ->exists();

        if (! $alreadyLinked) {
            $user->elections()->attach($candidate->election_id, [
                'role_slug' => 'candidat',
                'joined_at' => now(),
                'status' => 'active',
            ]);
        }

        RoleService::assignRoleToUser($user, 'candidat');
    }
}

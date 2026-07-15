<?php

namespace App\Console\Commands;

use App\Models\Candidate;
use App\Models\User;
use App\Services\CandidateAccountLinkService;
use Illuminate\Console\Command;

/**
 * Rattrapage : lie rétroactivement les candidats existants (créés avant
 * CandidateAccountLinkService, ou dont le compte a été créé sans passer
 * par AuthService::register()) à leur compte VoteCount, par email.
 *
 * L'auto-liaison normale se fait déjà en continu à la création d'un
 * candidat (Candidate::booted()) et à l'inscription (AuthService::register())
 * — cette commande ne sert qu'à combler les cas déjà en base avant coup.
 */
class LinkCandidateAccounts extends Command
{
    protected $signature = 'candidates:link-accounts
                            {--dry-run : Affiche ce qui serait fait sans effectuer d\'actions}';

    protected $description = 'Lie rétroactivement les candidats existants (user_id NULL) à un compte VoteCount correspondant par email';

    public function handle(): int
    {
        $isDryRun = $this->option('dry-run');

        if ($isDryRun) {
            $this->warn('Mode dry-run activé — aucune action ne sera effectuée.');
        }

        $candidates = Candidate::whereNull('user_id')
            ->whereNotNull('email')
            ->get();

        $this->line("Candidats sans compte lié : {$candidates->count()}");

        $linked = 0;
        foreach ($candidates as $candidate) {
            if ($isDryRun) {
                $exists = User::where('email', $candidate->email)->exists();
                if ($exists) {
                    $this->line("  → Serait lié : {$candidate->full_name} ({$candidate->email})");
                    $linked++;
                }
                continue;
            }

            $before = $candidate->user_id;
            CandidateAccountLinkService::linkIfAccountExists($candidate);

            if ($candidate->fresh()->user_id && $before === null) {
                $this->line("  → Lié : {$candidate->full_name} ({$candidate->email})");
                $linked++;
            }
        }

        $this->info("Terminé — {$linked} candidat(s) lié(s).");

        return self::SUCCESS;
    }
}

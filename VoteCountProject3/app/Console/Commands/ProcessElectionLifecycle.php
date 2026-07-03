<?php

namespace App\Console\Commands;

use App\Models\Election;
use App\Services\ElectionService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

/**
 * Démarre et clôture automatiquement les élections dont les dates
 * planifiées (start_at / end_at) sont atteintes, sans aucune
 * intervention manuelle de l'organisateur.
 *
 * Comportement attendu (cf. ElectionService::publish()) :
 *   - status passe de 'published' à 'ongoing' dès que start_at est atteint
 *   - is_votable passe automatiquement à true (accesseur dynamique sur
 *     status + start_at/end_at — aucune colonne à mettre à jour pour ça)
 *   - is_editable passe automatiquement à false (accesseur dynamique sur
 *     status — DRAFT/PENDING uniquement)
 *   - dès que end_at est dépassé, status passe à 'closed', is_votable
 *     redevient automatiquement false (toujours via l'accesseur)
 *
 * Fréquence recommandée : chaque minute (cf. routes/console.php),
 * cohérent avec la résolution standard du scheduler Laravel — un délai
 * de quelques secondes entre l'heure exacte de start_at et le démarrage
 * effectif est la précision maximale atteignable sans worker temps réel
 * dédié.
 */
class ProcessElectionLifecycle extends Command
{
    protected $signature = 'elections:process-lifecycle
                            {--dry-run : Affiche ce qui serait fait sans effectuer d\'actions}';

    protected $description = 'Démarre et clôture automatiquement les élections selon leurs dates planifiées';

    public function handle(ElectionService $electionService): int
    {
        $isDryRun = $this->option('dry-run');

        if ($isDryRun) {
            $this->warn('Mode dry-run activé — aucune action ne sera effectuée.');
        }

        $this->startDueElections($electionService, $isDryRun);
        $this->closeExpiredElections($electionService, $isDryRun);

        $this->info('Traitement du cycle de vie des élections terminé.');

        return self::SUCCESS;
    }

    /**
     * Démarre automatiquement les élections publiées dont start_at est atteint.
     */
    protected function startDueElections(ElectionService $electionService, bool $isDryRun): void
    {
        $toStart = Election::where('status', 'published')
            ->where('start_at', '<=', now())
            ->get();

        $this->line("Élections à démarrer : {$toStart->count()}");

        foreach ($toStart as $election) {
            $this->line("  → Démarrage : {$election->title} (uuid: {$election->uuid})");

            if ($isDryRun) {
                continue;
            }

            try {
                $electionService->start($election);

                Log::info('Election auto-started by scheduler', [
                    'election_uuid' => $election->uuid,
                    'start_at'      => $election->start_at->toIso8601String(),
                ]);
            } catch (\Throwable $e) {
                Log::error('Failed to auto-start election', [
                    'election_uuid' => $election->uuid,
                    'error'         => $e->getMessage(),
                ]);
                $this->error("    Échec : {$e->getMessage()}");
            }
        }
    }

    /**
     * Clôture automatiquement les élections (published ou ongoing) dont
     * end_at est dépassé.
     *
     * 'published' est inclus en plus de 'ongoing' pour couvrir le cas
     * limite où une élection n'aurait jamais été démarrée (ex: scheduler
     * arrêté temporairement) mais dont la date de fin est déjà dépassée —
     * elle doit quand même être clôturée plutôt que rester bloquée
     * indéfiniment en 'published'.
     */
    protected function closeExpiredElections(ElectionService $electionService, bool $isDryRun): void
    {
        $toClose = Election::whereIn('status', ['published', 'ongoing'])
            ->where('end_at', '<', now())
            ->get();

        $this->line("Élections à clôturer : {$toClose->count()}");

        foreach ($toClose as $election) {
            $this->line("  → Clôture : {$election->title} (uuid: {$election->uuid})");

            if ($isDryRun) {
                continue;
            }

            try {
                $electionService->end($election);

                Log::info('Election auto-closed by scheduler', [
                    'election_uuid' => $election->uuid,
                    'end_at'        => $election->end_at->toIso8601String(),
                ]);
            } catch (\Throwable $e) {
                Log::error('Failed to auto-close election', [
                    'election_uuid' => $election->uuid,
                    'error'         => $e->getMessage(),
                ]);
                $this->error("    Échec : {$e->getMessage()}");
            }
        }
    }
}

<?php

namespace App\Console\Commands;

use App\Models\TrashRecord;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

/**
 * Purge définitivement (forceDelete) les éléments de la corbeille non
 * restaurés dont expires_at est dépassé — le trait HasSoftDeletesWithUser
 * expose schedulePermanentDeletion()/expires_at depuis longtemps mais
 * rien ne les exploitait jusqu'ici (aucun TrashRecord n'était même créé).
 */
class PurgeExpiredTrash extends Command
{
    protected $signature = 'trash:purge-expired
                            {--dry-run : Affiche ce qui serait fait sans effectuer d\'actions}';

    protected $description = 'Supprime définitivement les éléments de la corbeille expirés et non restaurés';

    public function handle(): int
    {
        $isDryRun = $this->option('dry-run');

        if ($isDryRun) {
            $this->warn('Mode dry-run activé — aucune action ne sera effectuée.');
        }

        $expired = TrashRecord::whereNull('restored_at')
            ->whereNull('force_deleted_at')
            ->where('expires_at', '<', now())
            ->get();

        $this->line("Éléments de la corbeille expirés : {$expired->count()}");

        foreach ($expired as $trashRecord) {
            $this->line("  → Purge : {$trashRecord->entity_type} #{$trashRecord->entity_id} (uuid: {$trashRecord->uuid})");

            if ($isDryRun) {
                continue;
            }

            try {
                $trashRecord->forceDelete();

                Log::info('Trash record purged by scheduler', [
                    'trash_record_uuid' => $trashRecord->uuid,
                    'entity_type' => $trashRecord->entity_type,
                    'entity_id' => $trashRecord->entity_id,
                ]);
            } catch (\Throwable $e) {
                Log::error('Failed to purge trash record', [
                    'trash_record_uuid' => $trashRecord->uuid,
                    'error' => $e->getMessage(),
                ]);
                $this->error("    Échec : {$e->getMessage()}");
            }
        }

        $this->info('Purge de la corbeille terminée.');

        return self::SUCCESS;
    }
}

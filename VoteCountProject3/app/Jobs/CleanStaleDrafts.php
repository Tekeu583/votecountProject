<?php

namespace App\Jobs;

use App\Enums\ElectionStatus;
use App\Models\Election;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

/**
 * Supprime les brouillons d'élection abandonnés.
 *
 * Un draft est considéré "stale" si :
 *   - status = draft
 *   - updated_at < maintenant - STALE_AFTER_DAYS jours
 *
 * Planification recommandée dans Kernel : ->daily()
 *
 * Les catégories et candidats sont supprimés en cascade
 * (onDelete('cascade') sur election_id).
 */
class CleanStaleDrafts implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    private const STALE_AFTER_DAYS = 7;

    public function handle(): void
    {
        $cutoff = now()->subDays(self::STALE_AFTER_DAYS);

        $query = Election::where('status', ElectionStatus::DRAFT->value)
            ->where('updated_at', '<', $cutoff);

        $count = $query->count();

        if ($count === 0) {
            Log::info('[CleanStaleDrafts] Aucun brouillon expiré à supprimer.');
            return;
        }

        // Suppression par batch pour éviter les timeouts
        $query->chunkById(100, function ($elections) {
            foreach ($elections as $election) {
                $election->delete();
            }
        });

        Log::info("[CleanStaleDrafts] {$count} brouillon(s) supprimé(s) (inactifs depuis +{self::STALE_AFTER_DAYS}j).");
    }
}

<?php

namespace App\Console\Commands;

use App\Models\Candidate;
use App\Models\Result;
use Illuminate\Console\Command;

/**
 * Recopie Result.rank/final_score sur Candidate.rank/final_score pour les
 * résultats déjà calculés avant que ResultService::calculateResults() ne le
 * fasse automatiquement (voir 2026-07-18) — sans ce backfill, les élections
 * dont les résultats ont été calculés avant ce correctif gardent un
 * Candidate.rank NULL indéfiniment.
 */
class BackfillCandidateRanksCommand extends Command
{
    protected $signature = 'votecount:backfill-candidate-ranks';

    protected $description = "Recopie le rang déjà calculé (table results) sur les candidats dont rank est encore NULL";

    public function handle(): int
    {
        $updated = 0;

        Result::orderBy('election_id')->chunk(200, function ($results) use (&$updated) {
            foreach ($results as $result) {
                $updated += Candidate::where('id', $result->candidate_id)
                    ->whereNull('rank')
                    ->update([
                        'rank' => $result->rank,
                        'final_score' => $result->final_score,
                    ]);
            }
        });

        $this->info("{$updated} candidat(s) mis à jour.");

        return self::SUCCESS;
    }
}

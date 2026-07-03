<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**

 * LOGIQUE MÉTIER :
 * ─────────────────────────────────────────────────────────────────
 * Une élection a deux cycles indépendants :
 *
 *  1. Cycle de CANDIDATURE (ce qu'on ajoute ici)
 *     accepts_candidates     → l'admin active/désactive manuellement
 *     candidacy_start_at     → ouverture automatique des candidatures
 *     candidacy_end_at       → fermeture automatique des candidatures
 *     max_candidates         → nombre max de candidats autorisés (0 = illimité)
 *
 *  2. Cycle de VOTE (déjà en place)
 *     start_at / end_at      → période de vote
 *     status                 → état du scrutin
 *
 * Ces deux cycles peuvent se chevaucher ou être consécutifs selon la
 * configuration de l'organisateur.
 *
 * RÈGLE D'AFFICHAGE FRONTEND :
 * Une élection est "ouverte aux candidatures" si :
 *   accepts_candidates = true
 *   AND election_mode IN ('public', 'restricted')
 *   AND status IN ('published', 'ongoing')
 *   AND (candidacy_start_at IS NULL OR candidacy_start_at <= NOW())
 *   AND (candidacy_end_at IS NULL OR candidacy_end_at >= NOW())
 *   AND (max_candidates = 0 OR candidates_count < max_candidates)
 * ─────────────────────────────────────────────────────────────────
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('elections', function (Blueprint $table) {
            $table->boolean('accepts_candidates')
                ->default(false)
                ->after('allow_guest_vote');

            $table->timestampTz('candidacy_start_at')
                ->nullable()
                ->after('accepts_candidates');

            $table->timestampTz('candidacy_end_at')
                ->nullable()
                ->after('candidacy_start_at');

            $table->integer('max_candidates')
                ->default(0)
                ->after('candidacy_end_at');

            $table->index(['accepts_candidates', 'election_mode', 'status']);
            $table->index(['candidacy_start_at', 'candidacy_end_at']);
        });

        DB::statement("
            CREATE INDEX elections_open_candidacy_index
            ON elections (candidacy_end_at)
            WHERE accepts_candidates = true
            AND election_mode = 'public'
            AND status = 'published'
            AND deleted_at IS NULL
        ");
    }

    public function down(): void
    {
        DB::statement('DROP INDEX IF EXISTS elections_open_candidacy_index');

        Schema::table('elections', function (Blueprint $table) {
            $table->dropIndex(['accepts_candidates', 'election_mode', 'status']);
            $table->dropIndex(['candidacy_start_at', 'candidacy_end_at']);
            $table->dropColumn([
                'accepts_candidates',
                'candidacy_start_at',
                'candidacy_end_at',
                'max_candidates',
            ]);
        });
    }
};

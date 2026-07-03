<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * (table elections, colonne voter_code, unique globalement).
 *
 * Un seul voter_code est partagé par tous les électeurs d'une élection
 * privée : il sert à accéder à l'interface de vote, pas à identifier
 * un électeur précis. L'identification individuelle se fait ensuite
 * via email + OTP (voir VoteController::verifyAccess()).
 *
 * Cette migration retire donc :
 *   - l'index partiel electors_active_index (construit sur voter_code)
 *   - la contrainte unique ['election_id', 'voter_code']
 *   - l'index simple sur voter_code
 *   - la colonne voter_code elle-même
 */
return new class extends Migration
{
    public function up(): void
    {
        // 1. Index partiel PostgreSQL — doit être supprimé avant la colonne
        DB::statement('DROP INDEX IF EXISTS electors_active_index');

        Schema::table('electors', function (Blueprint $table) {
            // 2. Contrainte unique composite
            $table->dropUnique(['election_id', 'voter_code']);

            // 3. Index simple
            $table->dropIndex(['voter_code']);

            // 4. La colonne elle-même
            $table->dropColumn('voter_code');
        });

        // 5. Recréer l'index partiel sans voter_code, pour ne pas perdre
        //    l'optimisation des requêtes "électeurs actifs"
        DB::statement("
            CREATE INDEX electors_active_index
            ON electors (election_id)
            WHERE status = 'active'
            AND deleted_at IS NULL
        ");
    }

    public function down(): void
    {
        DB::statement('DROP INDEX IF EXISTS electors_active_index');

        Schema::table('electors', function (Blueprint $table) {
            $table->string('voter_code', 50)->nullable();
            $table->unique(['election_id', 'voter_code']);
            $table->index(['voter_code']);
        });

        DB::statement("
            CREATE INDEX electors_active_index
            ON electors (election_id, voter_code)
            WHERE status = 'active'
            AND deleted_at IS NULL
        ");
    }
};

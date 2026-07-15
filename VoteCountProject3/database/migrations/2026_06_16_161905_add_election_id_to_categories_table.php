<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Ajoute election_id dans categories.
 *
 * Règle :
 *   - election_id IS NULL     → catégorie globale (réutilisable partout)
 *   - election_id IS NOT NULL → catégorie spécifique à cette élection
 *
 * Un candidat ne peut être assigné qu'à une catégorie dont election_id
 * correspond à son élection, ou une catégorie globale.
 * Cette contrainte est validée dans CreateCandidateRequest.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('categories', function (Blueprint $table) {
            $table->unsignedBigInteger('election_id')->nullable();

            $table->foreign('election_id')
                ->references('id')
                ->on('elections')
                ->onDelete('cascade');

            $table->index(['election_id', 'status']);
        });
    }


    public function down(): void
    {
        Schema::table('categories', function (Blueprint $table) {
            $table->dropForeign(['election_id']);
            $table->dropIndex(['election_id', 'status']);
            $table->dropColumn('election_id');
        });
    }
};

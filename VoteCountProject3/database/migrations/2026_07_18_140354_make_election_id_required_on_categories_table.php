<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Le concept de "catégorie globale" (election_id NULL, réutilisable partout)
 * introduit par la migration du 2026-06-16 n'a jamais correspondu au métier
 * réel : une catégorie appartient toujours à une élection précise. Cette
 * migration supprime les catégories orphelines existantes (jamais utilisables
 * dans le modèle réel) et rend election_id obligatoire.
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::table('categories')->whereNull('election_id')->delete();

        Schema::table('categories', function (Blueprint $table) {
            $table->dropForeign(['election_id']);
        });

        Schema::table('categories', function (Blueprint $table) {
            $table->unsignedBigInteger('election_id')->nullable(false)->change();

            $table->foreign('election_id')
                ->references('id')
                ->on('elections')
                ->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::table('categories', function (Blueprint $table) {
            $table->dropForeign(['election_id']);
        });

        Schema::table('categories', function (Blueprint $table) {
            $table->unsignedBigInteger('election_id')->nullable()->change();

            $table->foreign('election_id')
                ->references('id')
                ->on('elections')
                ->onDelete('cascade');
        });
    }
};

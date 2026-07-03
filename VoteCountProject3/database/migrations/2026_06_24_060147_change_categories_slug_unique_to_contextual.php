<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Supprimer la contrainte unique globale sur slug
        Schema::table('categories', function (Blueprint $table) {
            $table->dropUnique(['slug']);
        });

        // Ajouter une contrainte unique contextuelle (election_id + slug)
        Schema::table('categories', function (Blueprint $table) {
            $table->unique(['election_id', 'slug']);
        });
    }

    public function down(): void
    {
        Schema::table('categories', function (Blueprint $table) {
            $table->dropUnique(['election_id', 'slug']);
        });

        Schema::table('categories', function (Blueprint $table) {
            $table->unique('slug');
        });
    }
};

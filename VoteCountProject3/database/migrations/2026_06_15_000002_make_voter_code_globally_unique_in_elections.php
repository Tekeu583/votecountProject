<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * voter_code dans elections était unique par organisation
 * (unique(['organization_id', 'voter_code'])) — ce qui permettait
 * à deux organisations différentes d'avoir le même voter_code.
 *
 * On le rend unique GLOBALEMENT : aucune ambiguïté possible entre
 * deux élections, peu importe leur organisation.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('elections', function (Blueprint $table) {
            $table->dropUnique(['organization_id', 'voter_code']);
        });

        Schema::table('elections', function (Blueprint $table) {
            $table->unique('voter_code');
        });
    }

    public function down(): void
    {
        Schema::table('elections', function (Blueprint $table) {
            $table->dropUnique(['voter_code']);
        });

        Schema::table('elections', function (Blueprint $table) {
            $table->unique(['organization_id', 'voter_code']);
        });
    }
};

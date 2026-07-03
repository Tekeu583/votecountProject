<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('candidates', function (Blueprint $table) {
            $table->integer('rank')
                ->nullable()
                ->after('final_score')
                ->comment('Rang final après dépouillement. Null pendant le vote.');

            $table->index(['election_id', 'rank']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('candidates', function (Blueprint $table) {
            $table->dropIndex(['election_id', 'rank']);
            $table->dropColumn('rank');
        });
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('candidates', function (Blueprint $table) {
            // Indique si le candidat est finaliste
            $table->boolean('is_finalist')->default(false);
            // Date à laquelle il est devenu finaliste
            $table->timestamp('finalist_at')->nullable();
            // Position du finaliste (1er, 2ème, 3ème...)
            $table->integer('finalist_rank')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('candidates', function (Blueprint $table) {
            $table->dropColumn(['is_finalist', 'finalist_at', 'finalist_rank']);
        });
    }
};

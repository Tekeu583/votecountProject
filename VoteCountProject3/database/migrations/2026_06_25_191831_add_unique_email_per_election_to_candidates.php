<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // ✅ Vérifier si la contrainte existe avec SQL
        $constraintExists = DB::select("
            SELECT 1 FROM information_schema.table_constraints
            WHERE constraint_name = 'candidates_email_unique'
            AND table_name = 'candidates'
        ");

        Schema::table('candidates', function (Blueprint $table) use ($constraintExists) {
            if (!empty($constraintExists)) {
                $table->dropUnique('candidates_email_unique');
            }

            $table->unique(['election_id', 'email']);
        });
    }

    public function down(): void
    {
        Schema::table('candidates', function (Blueprint $table) {
            $table->dropUnique(['election_id', 'email']);
        });
    }
};

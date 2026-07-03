<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("
            ALTER TABLE elections
            DROP CONSTRAINT elections_status_check
        ");

        DB::statement("
            ALTER TABLE elections
            ADD CONSTRAINT elections_status_check
            CHECK (
                status IN (
                    'draft',
                    'pending',
                    'published',
                    'ongoing',
                    'paused',
                    'closed',
                    'completed',
                    'cancelled',
                    'archived'
                )
            )
        ");
    }

    public function down(): void
    {
        DB::statement("
            ALTER TABLE elections
            DROP CONSTRAINT elections_status_check
        ");

        DB::statement("
            ALTER TABLE elections
            ADD CONSTRAINT elections_status_check
            CHECK (
                status IN (
                    'draft',
                    'pending',
                    'published',
                    'ongoing',
                    'paused',
                    'closed',
                    'cancelled',
                    'archived'
                )
            )
        ");
    }
};

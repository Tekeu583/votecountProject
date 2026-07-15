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
        Schema::table('trash_records', function (Blueprint $table) {
            // Nullable : évite d'interroger le JSON entity_snapshot pour
            // scoper la corbeille par organisation.
            $table->bigInteger('organization_id')->unsigned()->nullable()->after('owner_user_id');
            $table->foreign('organization_id')->references('id')->on('organizations')->onDelete('cascade');
            $table->index(['organization_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('trash_records', function (Blueprint $table) {
            $table->dropForeign(['organization_id']);
            $table->dropColumn('organization_id');
        });
    }
};

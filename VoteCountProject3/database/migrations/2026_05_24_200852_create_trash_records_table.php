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
        Schema::create('trash_records', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();

            $table->string('entity_type', 200);
            $table->bigInteger('entity_id');
            $table->jsonb('entity_snapshot');

            $table->bigInteger('deleted_by')->unsigned();
            $table->bigInteger('owner_user_id')->unsigned()->nullable();

            $table->text('reason')->nullable();

            $table->timestampTz('deleted_at');
            $table->timestampTz('expires_at');
            $table->timestampTz('restored_at')->nullable();
            $table->timestampTz('force_deleted_at')->nullable();

            $table->timestampsTz();

            // Foreign keys
            $table->foreign('deleted_by')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('owner_user_id')->references('id')->on('users')->onDelete('set null');

            // Indexes
            $table->index(['entity_type', 'entity_id']);
            $table->index(['deleted_by']);
            $table->index(['deleted_at']);
            $table->index(['expires_at']);
            $table->index(['restored_at']);

            // Composite index for cleanup
            $table->index(['expires_at', 'restored_at'])
                ->where('restored_at', null);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('trash_records');
    }
};

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
        Schema::create('import_jobs', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();

            $table->bigInteger('organization_id')->unsigned();

            $table->string('type', 50); // electors, candidates, etc.
            $table->string('file_path');

            $table->integer('total_rows')->default(0);
            $table->integer('success_rows')->default(0);
            $table->integer('failed_rows')->default(0);

            $table->enum('status', ['pending', 'processing', 'completed', 'failed'])->default('pending');

            $table->bigInteger('imported_by')->unsigned();
            $table->timestampTz('completed_at')->nullable();

            $table->timestampsTz();

            // Foreign keys
            $table->foreign('organization_id')->references('id')->on('organizations')->onDelete('cascade');
            $table->foreign('imported_by')->references('id')->on('users')->onDelete('cascade');

            // Indexes
            $table->index(['organization_id']);
            $table->index(['type']);
            $table->index(['status']);
            $table->index(['imported_by']);
            $table->index(['completed_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('import_jobs');
    }
};

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
        Schema::create('import_errors', function (Blueprint $table) {
            $table->id();
            $table->bigInteger('import_job_id')->unsigned();

            $table->integer('row_number');
            $table->text('error_message');
            $table->jsonb('raw_data');

            $table->timestampsTz();

            // Foreign key
            $table->foreign('import_job_id')->references('id')->on('import_jobs')->onDelete('cascade');

            // Indexes
            $table->index(['import_job_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('import_errors');
    }
};

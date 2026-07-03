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
        Schema::create('candidate_documents', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();

            $table->bigInteger('candidate_id')->unsigned();

            $table->string('type', 50);
            $table->string('file_path');

            $table->timestampTz('uploaded_at')->nullable();

            $table->timestampsTz();

            // Foreign key
            $table->foreign('candidate_id')->references('id')->on('candidates')->onDelete('cascade');

            // Indexes
            $table->index(['candidate_id']);
            $table->index(['type']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('candidate_documents');
    }
};

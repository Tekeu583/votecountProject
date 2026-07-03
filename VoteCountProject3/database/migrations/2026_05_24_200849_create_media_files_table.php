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
        Schema::create('media_files', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();

            $table->string('disk', 50);
            $table->string('path');

            $table->string('original_name');
            $table->string('mime_type', 100);
            $table->bigInteger('size');

            $table->string('visibility', 20)->default('private');

            $table->string('checksum', 64);
            $table->string('virus_scan_status', 20)->default('pending');

            $table->bigInteger('uploaded_by')->unsigned();

            $table->timestampsTz();

            // Foreign key
            $table->foreign('uploaded_by')->references('id')->on('users')->onDelete('cascade');

            // Indexes
            $table->index(['uploaded_by']);
            $table->index(['mime_type']);
            $table->index(['virus_scan_status']);
            $table->index(['visibility']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('media_files');
    }
};

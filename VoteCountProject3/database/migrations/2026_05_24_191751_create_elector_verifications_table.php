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
        Schema::create('elector_verifications', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();

            $table->bigInteger('elector_id')->unsigned();

            $table->string('document_type', 50);
            $table->string('document_number', 100);

            $table->enum('status', ['pending', 'verified', 'rejected'])->default('pending');
            $table->timestampTz('verified_at')->nullable();

            $table->timestampsTz();

            // Foreign keys
            $table->foreign('elector_id')->references('id')->on('electors')->onDelete('cascade');

            // Indexes
            $table->index(['elector_id']);
            $table->index(['document_type', 'document_number']);
            $table->index(['status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('elector_verifications');
    }
};

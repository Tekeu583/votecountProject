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
        Schema::create('contacts', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();

            $table->string('name', 100);
            $table->string('email');
            $table->string('subject', 200);
            $table->text('message');

            $table->enum('status', ['pending', 'replied', 'archived'])->default('pending');
            $table->timestampTz('replied_at')->nullable();

            $table->timestampsTz();

            // Indexes
            $table->index(['email']);
            $table->index(['status']);
            $table->index(['created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('contacts');
    }
};

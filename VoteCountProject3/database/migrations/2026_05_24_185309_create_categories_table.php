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
        Schema::create('categories', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();

            $table->string('name', 100);
            $table->string('slug', 100)->unique();
            $table->text('description')->nullable();

            $table->string('icon')->nullable();
            $table->string('color', 7)->nullable();

            $table->enum('status', ['active', 'inactive'])->default('active');

            $table->timestampsTz();

            // Indexes
            $table->index(['slug']);
            $table->index(['status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('categories');
    }
};

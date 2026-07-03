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
        Schema::create('subscription_plans', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();

            $table->string('name', 100);
            $table->string('slug', 100)->unique();
            $table->text('description')->nullable();

            $table->decimal('price', 10, 2);
            $table->string('currency', 3)->default('XAF');
            $table->integer('duration_days');

            // Features
            $table->integer('max_elections')->default(0);
            $table->bigInteger('max_votes')->default(0);
            $table->integer('max_candidates')->default(0);
            $table->integer('max_storage_gb')->default(0);

            $table->jsonb('features')->default('[]');

            $table->enum('status', ['active', 'inactive'])->default('active');

            $table->timestampsTz();

            // Indexes
            $table->index(['slug']);
            $table->index(['price', 'currency']);
            $table->index(['status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('subscription_plans');
    }
};

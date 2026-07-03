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
        Schema::create('payment_webhooks', function (Blueprint $table) {
            $table->id();
            $table->string('provider', 50);
            $table->jsonb('payload');
            $table->string('signature', 500)->nullable();

            $table->boolean('processed')->default(false);
            $table->timestampTz('processed_at')->nullable();

            $table->timestampsTz();

            // Indexes
            $table->index(['provider', 'processed']);
            $table->index(['processed_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payment_webhooks');
    }
};

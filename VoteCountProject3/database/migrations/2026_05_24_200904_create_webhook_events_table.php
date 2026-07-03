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
        Schema::create('webhook_events', function (Blueprint $table) {
            $table->id();
            $table->string('provider', 50);
            $table->string('event_id', 200);
            $table->string('event_type', 100);

            $table->jsonb('payload');

            $table->boolean('processed')->default(false);
            $table->timestampTz('processed_at')->nullable();

            $table->timestampsTz();

            // Unique constraint
            $table->unique(['provider', 'event_id']);

            // Indexes
            $table->index(['provider', 'processed']);
            $table->index(['event_type']);
            $table->index(['processed_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('webhook_events');
    }
};

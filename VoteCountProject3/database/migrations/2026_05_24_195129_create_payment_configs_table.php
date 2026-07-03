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
        Schema::create('payment_configs', function (Blueprint $table) {
            $table->id();
            $table->bigInteger('organization_id')->unsigned();

            $table->string('provider', 50);
            $table->string('api_key', 200)->nullable();
            $table->string('api_secret', 200)->nullable();

            $table->enum('environment', ['sandbox', 'production'])->default('sandbox');

            $table->string('webhook_secret', 200)->nullable();

            $table->boolean('is_active')->default(true);

            $table->timestampsTz();

            // Foreign key
            $table->foreign('organization_id')->references('id')->on('organizations')->onDelete('cascade');

            // Indexes
            $table->index(['organization_id', 'provider']);
            $table->index(['provider', 'is_active']);

            // Unique constraint
            $table->unique(['organization_id', 'provider']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payment_configs');
    }
};

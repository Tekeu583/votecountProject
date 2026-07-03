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
        Schema::create('devices', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();

            $table->bigInteger('elector_id')->unsigned()->nullable();
            $table->bigInteger('user_id')->unsigned()->nullable();

            $table->string('fingerprint_hash', 200)->unique();
            $table->string('device_name')->nullable();
            $table->string('browser')->nullable();
            $table->string('os')->nullable();

            $table->boolean('trusted')->default(false);
            $table->timestampTz('last_seen_at')->nullable();

            $table->timestampsTz();

            // Foreign keys
            $table->foreign('elector_id')->references('id')->on('electors')->onDelete('cascade');
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');

            // Indexes
            $table->index(['elector_id']);
            $table->index(['user_id']);
            $table->index(['fingerprint_hash']);
            $table->index(['trusted']);
            $table->index(['last_seen_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('devices');
    }
};

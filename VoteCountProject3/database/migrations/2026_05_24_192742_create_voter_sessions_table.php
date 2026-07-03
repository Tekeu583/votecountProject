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
        Schema::create('voter_sessions', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();

            $table->bigInteger('election_id')->unsigned();
            $table->bigInteger('elector_id')->unsigned()->nullable();

            $table->string('ip_address', 45);
            $table->text('device')->nullable();
            $table->string('browser')->nullable();
            $table->string('os')->nullable();
            $table->string('location')->nullable();

            $table->string('session_token', 100)->unique();

            $table->timestampTz('started_at')->nullable();
            $table->timestampTz('completed_at')->nullable();

            $table->enum('status', ['active', 'completed', 'expired', 'terminated'])->default('active');

            $table->timestampsTz();

            // Foreign keys
            $table->foreign('election_id')->references('id')->on('elections')->onDelete('cascade');
            $table->foreign('elector_id')->references('id')->on('electors')->onDelete('cascade');

            // Indexes
            $table->index(['election_id']);
            $table->index(['elector_id']);
            $table->index(['session_token']);
            $table->index(['status']);
            $table->index(['started_at']);
            $table->index(['ip_address']);

            // Composite indexes
            $table->index(['elector_id', 'status']);
            $table->index(['election_id', 'status', 'started_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('voter_sessions');
    }
};

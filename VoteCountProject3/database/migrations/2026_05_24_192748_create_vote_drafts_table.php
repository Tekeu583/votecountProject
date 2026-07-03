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
        Schema::create('vote_drafts', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();

            $table->bigInteger('elector_id')->unsigned()->nullable();
            $table->bigInteger('election_id')->unsigned();

            $table->jsonb('payload')->default('[]');

            $table->timestampTz('expires_at');

            $table->timestampsTz();

            // Foreign keys
            $table->foreign('elector_id')->references('id')->on('electors')->onDelete('cascade');
            $table->foreign('election_id')->references('id')->on('elections')->onDelete('cascade');

            // Indexes
            $table->index(['elector_id', 'election_id']);
            $table->index(['expires_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('vote_drafts');
    }
};

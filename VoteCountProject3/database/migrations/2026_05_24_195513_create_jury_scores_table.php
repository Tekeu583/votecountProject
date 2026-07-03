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
        Schema::create('jury_scores', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();

            $table->bigInteger('election_id')->unsigned();
            $table->bigInteger('candidate_id')->unsigned();
            $table->bigInteger('jury_user_id')->unsigned()->nullable();
            $table->bigInteger('criteria_id')->unsigned();

            $table->integer('score');
            $table->text('comment')->nullable();

            $table->timestampsTz();

            // Foreign keys
            $table->foreign('election_id')->references('id')->on('elections')->onDelete('cascade');
            $table->foreign('candidate_id')->references('id')->on('candidates')->onDelete('cascade');
            $table->foreign('jury_user_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('criteria_id')->references('id')->on('jury_criteria')->onDelete('cascade');

            // Unique constraint
            $table->unique(['candidate_id', 'jury_user_id', 'criteria_id'], 'unique_jury_score');

            // Indexes
            $table->index(['election_id']);
            $table->index(['candidate_id']);
            $table->index(['jury_user_id']);
            $table->index(['criteria_id']);
            $table->index(['score']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('jury_scores');
    }
};

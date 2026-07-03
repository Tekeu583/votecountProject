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
        Schema::create('results', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();

            $table->bigInteger('election_id')->unsigned();
            $table->bigInteger('candidate_id')->unsigned();

            $table->bigInteger('total_votes')->default(0);
            $table->bigInteger('public_votes')->default(0);
            $table->bigInteger('jury_votes')->default(0);

            $table->decimal('ranking_points', 15, 2)->default(0);
            $table->decimal('final_score', 15, 2)->default(0);
            $table->decimal('percentage', 5, 2)->default(0);

            $table->integer('rank')->nullable();

            $table->integer('snapshot_version')->default(1);

            $table->timestampTz('calculated_at')->nullable();

            $table->timestampsTz();

            // Foreign keys
            $table->foreign('election_id')->references('id')->on('elections')->onDelete('cascade');
            $table->foreign('candidate_id')->references('id')->on('candidates')->onDelete('cascade');

            // Unique constraint
            $table->unique(['election_id', 'candidate_id']);

            // Indexes
            $table->index(['election_id']);
            $table->index(['candidate_id']);
            $table->index(['final_score']);
            $table->index(['rank']);
            $table->index(['calculated_at']);

            // Composite indexes
            $table->index(['election_id', 'rank']);
            $table->index(['election_id', 'final_score']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('results');
    }
};

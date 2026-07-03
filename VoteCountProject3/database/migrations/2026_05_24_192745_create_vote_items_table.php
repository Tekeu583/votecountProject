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
        Schema::create('vote_items', function (Blueprint $table) {
            $table->id();
            $table->bigInteger('vote_id')->unsigned();
            $table->bigInteger('candidate_id')->unsigned();

            $table->integer('rank_position')->nullable();
            $table->decimal('score', 10, 2)->nullable();
            $table->float('weight')->default(1.0);

            $table->timestampsTz();

            // Foreign keys
            $table->foreign('vote_id')->references('id')->on('votes')->onDelete('cascade');
            $table->foreign('candidate_id')->references('id')->on('candidates')->onDelete('cascade');

            // Unique constraint - vote_id + candidate_id
            $table->unique(['vote_id', 'candidate_id']);

            // Indexes
            $table->index(['vote_id']);
            $table->index(['candidate_id']);
            $table->index(['vote_id', 'rank_position']);

            // Composite index for ranking queries
            $table->index(['candidate_id', 'rank_position']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('vote_items');
    }
};

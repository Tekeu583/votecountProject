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
        Schema::create('election_analytics', function (Blueprint $table) {
            $table->id();

            $table->bigInteger('election_id')->unsigned()->unique();

            $table->bigInteger('total_views')->default(0);
            $table->bigInteger('total_votes')->default(0);
            $table->bigInteger('unique_voters')->default(0);

            $table->float('conversion_rate')->default(0);
            $table->float('participation_rate')->default(0);

            $table->timestampTz('updated_at');

            // Foreign key
            $table->foreign('election_id')->references('id')->on('elections')->onDelete('cascade');

            // Indexes
            $table->index(['election_id']);
            $table->index(['total_votes']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('election_analytics');
    }
};

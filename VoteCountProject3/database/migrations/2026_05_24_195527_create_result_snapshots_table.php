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
        Schema::create('result_snapshots', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();

            $table->bigInteger('election_id')->unsigned();

            $table->jsonb('snapshot');

            $table->timestampTz('created_at');

            // Foreign key
            $table->foreign('election_id')->references('id')->on('elections')->onDelete('cascade');

            // Indexes
            $table->index(['election_id']);
            $table->index(['created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('result_snapshots');
    }
};

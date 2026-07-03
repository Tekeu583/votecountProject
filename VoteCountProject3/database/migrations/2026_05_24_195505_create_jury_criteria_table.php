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
        Schema::create('jury_criteria', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();

            $table->bigInteger('election_id')->unsigned();

            $table->string('name', 100);
            $table->text('description')->nullable();

            $table->float('weight')->default(1.0);
            $table->integer('max_score')->default(10);

            $table->timestampsTz();

            // Foreign key
            $table->foreign('election_id')->references('id')->on('elections')->onDelete('cascade');

            // Indexes
            $table->index(['election_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('jury_criteria');
    }
};

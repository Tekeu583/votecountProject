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
        Schema::create('notifications', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();

            $table->bigInteger('user_id')->unsigned()->nullable();

            $table->string('type', 50);
            $table->string('title', 200);
            $table->text('message');
            $table->jsonb('data')->default('[]');

            $table->timestampTz('read_at')->nullable();

            $table->timestampsTz();

            // Foreign key
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');

            // Indexes
            $table->index(['user_id']);
            $table->index(['type']);
            $table->index(['read_at']);
            $table->index(['created_at']);

            // Composite index
            $table->index(['user_id', 'read_at', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('notifications');
    }
};

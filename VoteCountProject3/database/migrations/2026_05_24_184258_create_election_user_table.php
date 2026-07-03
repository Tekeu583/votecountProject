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
        Schema::create('election_user', function (Blueprint $table) {
            $table->id();
            $table->bigInteger('election_id')->unsigned();
            $table->bigInteger('user_id')->unsigned();

            $table->string('role_slug', 100);
            $table->jsonb('permissions')->default('[]');

            $table->bigInteger('assigned_by')->nullable();
            $table->timestampTz('joined_at')->nullable();

            $table->enum('status', ['pending', 'active', 'inactive', 'blocked'])->default('pending');

            $table->timestampsTz();

            // Foreign keys
            $table->foreign('election_id')->references('id')->on('elections')->onDelete('cascade');
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');

            // Unique constraint
            $table->unique(['election_id', 'user_id']);

            // Indexes
            $table->index(['election_id', 'status']);
            $table->index(['user_id', 'status']);
            $table->index(['role_slug']);
            $table->index(['joined_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('election_user');
    }
};

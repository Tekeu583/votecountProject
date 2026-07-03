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
        Schema::create('security_alerts', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();

            $table->bigInteger('user_id')->unsigned()->nullable();
            $table->bigInteger('elector_id')->unsigned()->nullable();
            $table->bigInteger('election_id')->unsigned();

            $table->string('type', 50);
            $table->enum('severity', ['low', 'medium', 'high', 'critical'])->default('low');

            $table->string('ip_address', 45);
            $table->text('device')->nullable();
            $table->string('location')->nullable();

            $table->jsonb('metadata')->default('[]');

            $table->bigInteger('resolved_by')->nullable();
            $table->timestampTz('resolved_at')->nullable();

            $table->timestampsTz();

            // Foreign keys
            $table->foreign('user_id')->references('id')->on('users')->onDelete('set null');
            $table->foreign('elector_id')->references('id')->on('electors')->onDelete('set null');
            $table->foreign('election_id')->references('id')->on('elections')->onDelete('cascade');

            // Indexes
            $table->index(['election_id']);
            $table->index(['user_id']);
            $table->index(['elector_id']);
            $table->index(['severity']);
            $table->index(['type']);
            $table->index(['ip_address']);
            $table->index(['created_at']);
            $table->index(['resolved_at']);

            // Composite indexes
            $table->index(['election_id', 'severity']);
            $table->index(['election_id', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('security_alerts');
    }
};

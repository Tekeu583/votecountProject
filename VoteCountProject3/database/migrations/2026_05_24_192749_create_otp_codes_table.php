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
        Schema::create('otp_codes', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();

            $table->bigInteger('vote_id')->unsigned()->nullable();
            $table->bigInteger('elector_id')->unsigned()->nullable();

            $table->string('code', 10);
            $table->enum('channel', ['email', 'sms', 'whatsapp']);

            $table->string('ip_address', 45)->nullable();
            $table->string('device')->nullable();

            $table->timestampTz('expires_at');
            $table->timestampTz('verified_at')->nullable();

            $table->integer('attempts')->default(0);
            $table->enum('status', ['pending', 'verified', 'expired', 'blocked'])->default('pending');

            $table->timestampsTz();

            // Foreign keys
            $table->foreign('vote_id')->references('id')->on('votes')->onDelete('cascade');
            $table->foreign('elector_id')->references('id')->on('electors')->onDelete('cascade');

            // Indexes
            $table->index(['elector_id']);
            $table->index(['code']);
            $table->index(['status']);
            $table->index(['expires_at']);
            $table->index(['vote_id']);

            // Composite index
            $table->index(['elector_id', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('otp_codes');
    }
};

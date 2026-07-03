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
        Schema::create('otp_attempts', function (Blueprint $table) {
            $table->id();
            $table->bigInteger('elector_id')->unsigned()->nullable();
            $table->string('ip_address', 45);

            $table->integer('attempts')->default(0);
            $table->timestampTz('blocked_until')->nullable();

            $table->timestampsTz();

            // Foreign key
            $table->foreign('elector_id')->references('id')->on('electors')->onDelete('cascade');

            // Indexes
            $table->index(['elector_id']);
            $table->index(['ip_address']);
            $table->index(['blocked_until']);

            // Unique constraint
            $table->unique(['elector_id', 'ip_address']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('otp_attempts');
    }
};

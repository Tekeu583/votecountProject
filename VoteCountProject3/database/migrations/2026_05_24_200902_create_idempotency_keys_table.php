<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('idempotency_keys', function (Blueprint $table) {
            $table->id();

            $table->string('key', 100)->unique();
            $table->string('scope', 50);

            $table->bigInteger('user_id')->unsigned()->nullable();
            $table->bigInteger('elector_id')->unsigned()->nullable();

            $table->string('request_hash', 64);
            $table->jsonb('response');

            $table->timestampTz('expires_at');

            $table->timestampsTz();

            // Foreign keys
            $table->foreign('user_id')->references('id')->on('users')->onDelete('set null');
            $table->foreign('elector_id')->references('id')->on('electors')->onDelete('set null');

            // Indexes
            $table->index(['key']);
            $table->index(['scope']);
            $table->index(['expires_at']);
            $table->index(['user_id', 'scope']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('idempotency_keys');
    }
};

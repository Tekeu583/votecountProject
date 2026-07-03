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
        Schema::create('users', function (Blueprint $table) {
            // Primary
            $table->id();
            $table->uuid('uuid')->unique();

            // Personal info
            $table->string('first_name', 100);
            $table->string('last_name', 100);
            $table->string('email')->unique();
            $table->string('phone', 20)->nullable()->unique();
            $table->string('photo')->nullable();
            $table->string('password');

            // Demographic
            $table->enum('gender', ['male', 'female', 'other'])->nullable();
            $table->date('birth_date')->nullable();
            $table->string('country', 100)->nullable();
            $table->string('city', 100)->nullable();
            $table->string('address')->nullable();

            // Preferences
            $table->string('locale', 10)->default('fr');
            $table->string('timezone', 50)->default('UTC');

            // Status
            $table->enum('status', ['active', 'inactive', 'suspended', 'banned', 'pending_verification'])->default('pending_verification');

            // Verification
            $table->timestamp('email_verified_at')->nullable();
            $table->timestamp('phone_verified_at')->nullable();

            // Security
            $table->boolean('two_factor_enabled')->default(false);
            $table->string('two_factor_secret')->nullable();
            $table->text('two_factor_recovery_codes')->nullable();

            // Session
            $table->timestamp('last_login_at')->nullable();
            $table->string('last_login_ip', 45)->nullable();

            // Remember token
            $table->rememberToken();

            // Soft deletes with user tracking
            $table->softDeletesTz();
            $table->bigInteger('deleted_by')->nullable();
            $table->timestampTz('scheduled_permanent_delete_at')->nullable();

            // Timestamps
            $table->timestampsTz();

            // Indexes
            $table->index(['email', 'status']);
            $table->index(['phone', 'status']);
            $table->index(['last_login_at']);
            $table->index(['status', 'created_at']);
            $table->index(['country']);
            $table->index(['deleted_at']);
        });

        Schema::create('password_reset_tokens', function (Blueprint $table) {
            $table->string('email')->primary();
            $table->string('token');
            $table->timestamp('created_at')->nullable();
        });

        Schema::create('sessions', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->foreignId('user_id')->nullable()->index();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->longText('payload');
            $table->integer('last_activity')->index();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('users');
        Schema::dropIfExists('password_reset_tokens');
        Schema::dropIfExists('sessions');
    }
};

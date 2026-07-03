<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Ajoute user_id dans otp_attempts pour tracer les tentatives
 * des flux auth (email_verification, password_reset).
 *
 * La contrainte unique existante ['elector_id', 'ip_address'] est étendue
 * pour couvrir aussi ['user_id', 'ip_address'].
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('otp_attempts', function (Blueprint $table) {
            $table->unsignedBigInteger('user_id')
                ->nullable();

            $table->foreign('user_id')
                ->references('id')
                ->on('users')
                ->onDelete('cascade');

            $table->index(['user_id']);

            $table->unique(['user_id', 'ip_address']);
        });
    }

    public function down(): void
    {
        Schema::table('otp_attempts', function (Blueprint $table) {
            $table->dropUnique(['user_id', 'ip_address']);
            $table->dropIndex(['user_id']);
            $table->dropForeign(['user_id']);
            $table->dropColumn('user_id');
        });
    }
};

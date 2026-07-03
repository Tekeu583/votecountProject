<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Étend otp_codes pour couvrir les OTP d'authentification.
 *
 * Colonnes ajoutées :
 *   - user_id  : référence vers users (email_verification, password_reset)
 *   - type     : distingue vote / email_verification / password_reset
 *   - token    : token signé pour le lien magique (email_verification)
 *
 * Tous les champs sont nullable pour ne pas casser les lignes vote existantes.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('otp_codes', function (Blueprint $table) {
            $table->unsignedBigInteger('user_id')
                ->nullable();

            $table->enum('type', ['vote', 'email_verification', 'password_reset'])
                ->default('vote')
                ->after('user_id');

            $table->string('token', 80)
                ->nullable()
                ->unique()
                ->after('type');

            $table->foreign('user_id')
                ->references('id')
                ->on('users')
                ->onDelete('cascade');

            $table->index(['user_id', 'type', 'status']);
        });
    }

    public function down(): void
    {
        Schema::table('otp_codes', function (Blueprint $table) {
            $table->dropForeign(['user_id']);
            $table->dropIndex(['user_id', 'type', 'status']);
            $table->dropColumn(['token', 'type', 'user_id']);
        });
    }
};

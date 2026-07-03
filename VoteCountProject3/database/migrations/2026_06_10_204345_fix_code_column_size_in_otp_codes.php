<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * La colonne `code` était VARCHAR(10) — prévue pour un OTP 6 chiffres en clair.
 * On stocke maintenant un hash bcrypt (60 chars) → agrandir à 255.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('otp_codes', function (Blueprint $table) {
            $table->string('code', 255)->nullable()->change();
            $table->string('token', 255)->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('otp_codes', function (Blueprint $table) {
            $table->string('code', 10)->nullable(false)->change();
            $table->string('token', 80)->nullable()->change();
        });
    }
};

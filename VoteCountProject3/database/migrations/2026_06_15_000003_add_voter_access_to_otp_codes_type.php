<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Ajoute la valeur 'voter_access' à l'enum type de otp_codes.
 *
 * Usage : OTP envoyé à l'étape d'accès à une élection privée, après
 * vérification du voter_code (de l'élection) + email (de l'électeur).
 * Distinct du type 'vote' déjà existant, qui couvre la confirmation
 * finale juste avant la soumission du vote.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (DB::getDriverName() === 'pgsql') {
            // PostgreSQL stocke les enums Laravel comme CHECK constraint sur varchar
            DB::statement("ALTER TABLE otp_codes DROP CONSTRAINT IF EXISTS otp_codes_type_check");
            DB::statement("ALTER TABLE otp_codes ADD CONSTRAINT otp_codes_type_check CHECK (type IN ('vote', 'email_verification', 'password_reset', 'voter_access'))");
        } else {
            DB::statement("ALTER TABLE otp_codes MODIFY type ENUM('vote', 'email_verification', 'password_reset', 'voter_access') DEFAULT 'vote'");
        }
    }

    public function down(): void
    {
        if (DB::getDriverName() === 'pgsql') {
            DB::statement("ALTER TABLE otp_codes DROP CONSTRAINT IF EXISTS otp_codes_type_check");
            DB::statement("ALTER TABLE otp_codes ADD CONSTRAINT otp_codes_type_check CHECK (type IN ('vote', 'email_verification', 'password_reset'))");
        } else {
            DB::statement("ALTER TABLE otp_codes MODIFY type ENUM('vote', 'email_verification', 'password_reset') DEFAULT 'vote'");
        }
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Corrige deux dérives schéma/code sur candidate_applications :
 *  - identity_document : présent dans le modèle ($fillable) et inséré par
 *    CandidateApplicationService::submit(), mais jamais créé en base
 *    → le dépôt public renvoyait un 500 (colonne inexistante).
 *  - phone : NOT NULL en base alors que la validation le permet nullable
 *    → un dépôt sans téléphone violait la contrainte.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('candidate_applications', function (Blueprint $table) {
            if (! Schema::hasColumn('candidate_applications', 'identity_document')) {
                $table->string('identity_document')->nullable()->after('photo');
            }
            $table->string('phone', 20)->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('candidate_applications', function (Blueprint $table) {
            if (Schema::hasColumn('candidate_applications', 'identity_document')) {
                $table->dropColumn('identity_document');
            }
            $table->string('phone', 20)->nullable(false)->change();
        });
    }
};

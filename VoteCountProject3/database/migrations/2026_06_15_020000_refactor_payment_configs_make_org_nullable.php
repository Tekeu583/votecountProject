<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Migration : refactoring PaymentConfig vers architecture centralisée.
 *
 * Avant : payment_configs liée obligatoirement à une organisation (mauvaise architecture).
 * Après : organization_id nullable — la table sert uniquement pour les overrides admin.
 *         La source principale de config est désormais config/payment.php (.env).
 *
 * IMPORTANT : cette migration ne supprime aucune donnée existante.
 * Les lignes organization_id existantes restent valides comme overrides optionnels.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payment_configs', function (Blueprint $table) {
            // Supprimer la contrainte FK et l'index avant de modifier la colonne
            $table->dropForeign(['organization_id']);
            $table->dropUnique(['organization_id', 'provider']);

            // Rendre organization_id nullable
            $table->bigInteger('organization_id')->unsigned()->nullable()->change();

            // Recréer la FK avec nullOnDelete (pas cascade — on veut garder les configs orphelines comme globales)
            $table->foreign('organization_id')
                ->references('id')
                ->on('organizations')
                ->nullOnDelete();

            // Recréer l'index unique en gérant le cas null
            // Note: MySQL/Postgres autorisent plusieurs NULL dans une colonne unique
            $table->unique(['organization_id', 'provider']);

            // Ajouter un index sur provider seul pour les lookups globaux
            $table->index('provider');
        });
    }

    public function down(): void
    {
        Schema::table('payment_configs', function (Blueprint $table) {
            $table->dropForeign(['organization_id']);
            $table->dropUnique(['organization_id', 'provider']);
            $table->dropIndex(['provider']);

            $table->bigInteger('organization_id')->unsigned()->nullable(false)->change();

            $table->foreign('organization_id')
                ->references('id')
                ->on('organizations')
                ->onDelete('cascade');

            $table->unique(['organization_id', 'provider']);
        });
    }
};

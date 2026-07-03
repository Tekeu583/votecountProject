<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Modifie payment_transactions pour supporter les abonnements.
 *
 * CONTEXTE DES NULLABILITÉS PAR TYPE DE TRANSACTION :
 * ─────────────────────────────────────────────────────────────────────
 *
 * TYPE 'vote' — vote dans une élection payante :
 *   election_id  → REQUIS   (le vote appartient toujours à une élection)
 *   vote_id      → nullable (déjà nullable dans la migration originale)
 *                  peut être null si la transaction est créée avant le vote
 *   elector_id   → nullable (déjà nullable dans la migration originale)
 *                  null pour les votes publics anonymes (sans inscription)
 *   subscription_id  → null (pas d'abonnement)
 *   organization_id  → null (on remonte via election->organization)
 *
 * TYPE 'subscription' — paiement d'un abonnement :
 *   election_id      → null  (pas d'élection associée) ← SEUL CHANGEMENT NÉCESSAIRE
 *   vote_id          → null
 *   elector_id       → null
 *   subscription_id  → REQUIS (la subscription à activer)
 *   organization_id  → REQUIS (l'organisation qui souscrit)
 *
 * CONCLUSION :
 * La seule modification de nullabilité nécessaire est election_id → nullable.
 * vote_id et elector_id étaient déjà nullable dans la migration originale.
 * ─────────────────────────────────────────────────────────────────────
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payment_transactions', function (Blueprint $table) {

            // ── election_id : nullable pour les transactions d'abonnement ──
            // Dans la migration originale : bigInteger('election_id')->unsigned() [NOT NULL]
            // Problème : les transactions d'abonnement n'ont pas d'élection associée.
            $table->dropForeign(['election_id']);
            $table->bigInteger('election_id')->unsigned()->nullable()->change();
            $table->foreign('election_id')
                ->references('id')
                ->on('elections')
                ->nullOnDelete();

            // ── subscription_id : lien vers la subscription à activer ──
            // null pour les transactions de vote, requis pour les abonnements.
            $table->bigInteger('subscription_id')
                ->unsigned()
                ->nullable()
                ->after('elector_id');
            $table->foreign('subscription_id')
                ->references('id')
                ->on('subscriptions')
                ->nullOnDelete();

            // ── organization_id : lien direct pour les abonnements ──
            // Pour les votes on remonte via election->organization.
            // Pour les abonnements il n'y a pas d'élection donc on stocke
            // l'organization_id directement.
            $table->bigInteger('organization_id')
                ->unsigned()
                ->nullable()
                ->after('subscription_id');
            $table->foreign('organization_id')
                ->references('id')
                ->on('organizations')
                ->nullOnDelete();

            // ── type : distingue 'vote' et 'subscription' ──
            $table->enum('type', ['vote', 'subscription'])
                ->default('vote')
                ->after('organization_id');

            // ── Index supplémentaires ──
            $table->index(['subscription_id']);
            $table->index(['organization_id', 'type']);
            $table->index(['type', 'status']);
        });
    }

    public function down(): void
    {
        Schema::table('payment_transactions', function (Blueprint $table) {
            // Supprimer les index ajoutés
            $table->dropIndex(['subscription_id']);
            $table->dropIndex(['organization_id', 'type']);
            $table->dropIndex(['type', 'status']);

            // Supprimer les clés étrangères et colonnes ajoutées
            $table->dropForeign(['subscription_id']);
            $table->dropForeign(['organization_id']);
            $table->dropColumn(['subscription_id', 'organization_id', 'type']);

            // Restaurer election_id NOT NULL
            $table->dropForeign(['election_id']);
            $table->bigInteger('election_id')->unsigned()->nullable(false)->change();
            $table->foreign('election_id')
                ->references('id')
                ->on('elections')
                ->onDelete('cascade');
        });
    }
};

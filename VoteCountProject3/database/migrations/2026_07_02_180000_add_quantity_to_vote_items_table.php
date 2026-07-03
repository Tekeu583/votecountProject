<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * NOUVEAU (Claude) — vote payant "achat de voix en bloc" : un électeur qui paie
 * un multiple de vote_price obtient plusieurs voix pour un même choix.
 *
 * quantity va sur vote_items (PAS sur votes), volontairement : pour vote_type
 * = 'standard' un vote n'a qu'un seul vote_item, donc ça revient au même —
 * mais pour 'multiple' (répartition par curseur entre plusieurs candidats
 * dans UN SEUL paiement) et 'ranked' (N bulletins identiques qui suivent tous
 * le même classement), la quantité doit pouvoir varier par item, pas être
 * unique pour tout le vote. Une seule colonne sert les deux cas futurs sans
 * refonte.
 *
 * Distincte de "weight" (déjà existante) : weight sert au vote_type 'weighted'
 * (pondération choisie par l'électeur lui-même dans son bulletin), un concept
 * orthogonal à "combien de voix identiques ce choix représente".
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('vote_items', function (Blueprint $table) {
            $table->unsignedInteger('quantity')->default(1);
        });
    }

    public function down(): void
    {
        Schema::table('vote_items', function (Blueprint $table) {
            $table->dropColumn('quantity');
        });
    }
};

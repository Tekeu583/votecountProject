<?php

namespace Database\Seeders;

use App\Models\Candidate;
use App\Models\Election;
use App\Models\Elector;
use App\Models\Organization;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Jeu de données de VOLUMÉTRIE pour les tests de charge.
 *
 * Objectif : approcher la charge d'une plateforme réellement utilisée, afin que
 * les mesures de performance soient représentatives. Sur une base quasi vide,
 * toute requête paraît rapide — le test ne prouverait rien.
 *
 * /!\ Ne JAMAIS lancer sur la base de développement ni de production : utiliser
 *     une base dédiée, ex. :
 *       DB_DATABASE=votecount_loadtest php artisan db:seed --class=LoadTestSeeder
 *
 * Volumétrie générée (paramétrable via les constantes ci-dessous) :
 *   - 30 organisations
 *   - 200 élections publiques publiées (la liste publique est l'endpoint le
 *     plus sollicité : c'est la vitrine de la plateforme)
 *   - ~2 500 candidats
 *   - 5 000 électeurs et 4 000 votes (80 % de participation) sur une élection
 *     « vedette », pour mesurer la page de détail et les résultats sous charge.
 */
class LoadTestSeeder extends Seeder
{
    private const ORGANIZATIONS     = 30;
    private const ELECTIONS         = 200;
    private const CANDIDATES_MIN    = 5;
    private const CANDIDATES_MAX    = 20;
    private const FEATURED_ELECTORS = 5000;

    /** Taux de participation simulé sur l'élection vedette. */
    private const TURNOUT = 0.8;

    private const CHUNK = 1000;

    public function run(): void
    {
        $this->command->info('→ Génération du jeu de données de charge...');

        // Rôles/permissions : la liste publique charge creator.roles.permissions.
        $this->call(RolesAndPermissionsSeeder::class);
        $this->call(SubscriptionPlansSeeder::class);

        $owners = User::factory()->count(self::ORGANIZATIONS)->create();
        $organizations = $owners->map(
            fn (User $owner) => Organization::factory()->create(['owner_user_id' => $owner->id])
        );
        $this->command->info('  ✓ '.$organizations->count().' organisations');

        $elections = collect();
        for ($i = 0; $i < self::ELECTIONS; $i++) {
            $org = $organizations->random();
            $elections->push(Election::factory()->create([
                'organization_id' => $org->id,
                'created_by'      => $org->owner_user_id,
                'election_mode'   => 'public',
                'status'          => 'published',
                'published_at'    => now(),
            ]));
        }
        $this->command->info('  ✓ '.$elections->count().' élections publiques publiées');

        $totalCandidates = 0;
        foreach ($elections as $election) {
            $n = random_int(self::CANDIDATES_MIN, self::CANDIDATES_MAX);
            for ($c = 0; $c < $n; $c++) {
                Candidate::factory()->create([
                    'election_id' => $election->id,
                    // Le slug est unique en base : on le construit nous-mêmes,
                    // le pool `faker->unique()->slug()` s'épuiserait sur ce volume.
                    'slug'        => 'cand-'.$election->id.'-'.$c.'-'.Str::random(6),
                ]);
                $totalCandidates++;
            }
        }
        $this->command->info("  ✓ {$totalCandidates} candidats");

        $featured = $elections->first();

        Elector::factory()->count(self::FEATURED_ELECTORS)->create([
            'election_id' => $featured->id,
        ]);
        $this->command->info('  ✓ '.self::FEATURED_ELECTORS.' électeurs sur l\'élection vedette');

        $this->seedFeaturedVotes($featured);

        $this->command->info('✓ Jeu de données de charge prêt.');
        $this->command->line("  Élection vedette (uuid) : {$featured->uuid}");
    }

    /**
     * Insertion en masse des votes de l'élection vedette.
     *
     * On passe par des insertions SQL directes plutôt que par les factories :
     * hydrater des dizaines de milliers de modèles Eloquent serait très lent, et
     * on ne cherche ici qu'à peser sur les agrégats (COUNT, calcul des résultats).
     *
     * Contrainte respectée : unicité (election_id, elector_id, vote_sequence)
     * — un électeur vote une seule fois, on tire donc un sous-ensemble des
     * électeurs selon le taux de participation.
     */
    private function seedFeaturedVotes(Election $featured): void
    {
        $candidateIds = Candidate::where('election_id', $featured->id)->pluck('id')->all();
        $electorIds   = Elector::where('election_id', $featured->id)->pluck('id')->all();

        if ($candidateIds === [] || $electorIds === []) {
            $this->command->warn('  ! Pas de candidats/électeurs : votes ignorés.');

            return;
        }

        shuffle($electorIds);
        $voting = array_slice($electorIds, 0, (int) round(count($electorIds) * self::TURNOUT));
        $now    = now();

        foreach (array_chunk($voting, self::CHUNK) as $chunk) {
            $rows = [];
            foreach ($chunk as $electorId) {
                $rows[] = [
                    'uuid'            => Str::uuid()->toString(),
                    'election_id'     => $featured->id,
                    'elector_id'      => $electorId,
                    'vote_sequence'   => 1,
                    'vote_type'       => 'standard',
                    'status'          => 'completed',
                    'ip_address'      => '127.0.0.1',
                    'is_paid'         => false,
                    'total_amount'    => 0,
                    'otp_verified'    => true,
                    'idempotency_key' => Str::uuid()->toString(),
                    'submitted_at'    => $now,
                    'validated_at'    => $now,
                    'created_at'      => $now,
                    'updated_at'      => $now,
                ];
            }
            DB::table('votes')->insert($rows);
        }

        // Un bulletin = une ligne dans vote_items (le candidat choisi).
        $voteIds = DB::table('votes')->where('election_id', $featured->id)->pluck('id')->all();

        foreach (array_chunk($voteIds, self::CHUNK) as $chunk) {
            $items = [];
            foreach ($chunk as $voteId) {
                $items[] = [
                    'vote_id'      => $voteId,
                    'candidate_id' => $candidateIds[array_rand($candidateIds)],
                    'weight'       => 1,
                    'quantity'     => 1,
                    'created_at'   => $now,
                    'updated_at'   => $now,
                ];
            }
            DB::table('vote_items')->insert($items);
        }

        // Compteurs dénormalisés, comme le ferait l'application en production.
        DB::table('elections')->where('id', $featured->id)->update(['total_votes' => count($voteIds)]);

        foreach ($candidateIds as $candidateId) {
            DB::table('candidates')->where('id', $candidateId)->update([
                'vote_count' => DB::table('vote_items')->where('candidate_id', $candidateId)->count(),
            ]);
        }

        $this->command->info('  ✓ '.count($voteIds).' votes ('.(int) (self::TURNOUT * 100).' % de participation)');
    }
}

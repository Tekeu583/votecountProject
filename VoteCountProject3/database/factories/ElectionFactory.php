<?php

namespace Database\Factories;

use App\Models\Election;
use App\Models\Organization;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Storage;

class ElectionFactory extends Factory
{
    protected $model = Election::class;

    public function definition(): array
    {
        return [
            'uuid' => Str::uuid()->toString(),
            'organization_id' => Organization::factory(),
            'created_by' => User::factory(),
            'title' => $this->faker->sentence(3),
            'slug' => $this->faker->slug(),
            'short_description' => $this->faker->sentence(),
            'description' => $this->faker->paragraph(),
            'banner' => sprintf(
                'https://picsum.photos/1600/900?random=%d',
                $this->faker->unique()->numberBetween(1, 10000)
            ),
            'election_mode' => 'public',
            'vote_type' => 'single',
            'visibility_type' => 'public',
            'payment_type' => 'free',
            'verification_mode' => 'none',
            'status' => 'published',
            'start_at' => now()->addDays(1),
            'end_at' => now()->addDays(8),
            'max_votes_per_user' => 1,
            'fraud_detection_enabled' => true,
            'public_results' => true,
            'vote_price' => 0,
            'currency' => 'XAF',
            'accepts_candidates' => true,
            'candidacy_start_at' => now()->addHours(1),
            'candidacy_end_at' => now()->addDays(1)->addHours(-1),
            'max_candidates' => 20,
        ];
    }

    public function published(): static
    {
        return $this->state(fn(array $attributes) => [
            'status' => 'published',
            'published_at' => now(),
            'start_at'     => now()->addDays(2),
            'end_at'       => now()->addDays(9),
        ]);
    }

    public function ongoing(): static
    {
        return $this->state(fn(array $attributes) => [
            'status'             => 'ongoing',
            'published_at'       => now()->subDays(3),
            'start_at'           => now()->subHours(2),
            'end_at'             => now()->addHours(6),
            'accepts_candidates' => false,  // vote commencé → candidatures closes
            'candidacy_end_at'   => now()->subHours(3),
        ]);
    }

    public function closed(): static
    {
        return $this->state(fn(array $attributes) => [
            'status'             => 'closed',
            'published_at'       => now()->subDays(10),
            'start_at'           => now()->subDays(8),
            'end_at'             => now()->subDays(1),
            'closed_at'          => now()->subDays(1),
            'accepts_candidates' => false,
        ]);
    }

    /**
     * Élection sans candidature ouverte (candidats pré-définis par l'admin).
     */
    public function withoutCandidacy(): static
    {
        return $this->state(fn(array $attributes) => [
            'accepts_candidates' => false,
            'candidacy_start_at' => null,
            'candidacy_end_at'   => null,
        ]);
    }

    /**
     * Élection dont la fenêtre de candidature n'est pas encore ouverte.
     * Utile pour tester que scopeOpenForCandidacy l'exclut correctement.
     */
    public function candidacyNotYetOpen(): static
    {
        return $this->state(fn(array $attributes) => [
            'accepts_candidates' => true,
            'candidacy_start_at' => now()->addHours(12),
            'candidacy_end_at'   => now()->addDays(2),
        ]);
    }

    /**
     * Élection dont la fenêtre de candidature est expirée.
     * Utile pour tester que scopeOpenForCandidacy l'exclut correctement.
     */
    public function candidacyExpired(): static
    {
        return $this->state(fn(array $attributes) => [
            'accepts_candidates' => true,
            'candidacy_start_at' => now()->subDays(3),
            'candidacy_end_at'   => now()->subHours(1),
        ]);
    }
}

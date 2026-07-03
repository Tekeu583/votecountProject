<?php

namespace Database\Factories;

use App\Models\Candidate;
use App\Models\Category;
use App\Models\Election;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class CandidateFactory extends Factory
{
    protected $model = Candidate::class;

    public function definition(): array
    {
        return [
            'uuid'        => Str::uuid()->toString(),
            'election_id' => Election::factory(),
            'category_id' => null,
            'full_name'   => $this->faker->name(),
            'slug'        => $this->faker->unique()->slug(),
            'photo'       => sprintf('https://i.pravatar.cc/200?u=%s', Str::uuid()),
            'bio'         => $this->faker->paragraph(),
            'manifesto'   => $this->faker->paragraphs(3, true),
            'status'      => 'approved',
            'approved_at' => now(),
        ];
    }

    public function approved(): static
    {
        return $this->state(fn(array $attributes) => [
            'status'      => 'approved',
            'approved_at' => now(),
        ]);
    }

    public function pending(): static
    {
        return $this->state(fn(array $attributes) => [
            'status'      => 'pending',
            'approved_at' => null,
        ]);
    }

    public function rejected(): static
    {
        return $this->state(fn(array $attributes) => [
            'status'           => 'rejected',
            'approved_at'      => null,
            'rejection_reason' => 'Dossier incomplet',
        ]);
    }

    public function withCategory(): static
    {
        return $this->state(fn(array $attributes) => [
            'category_id' => Category::factory(),
        ]);
    }
}

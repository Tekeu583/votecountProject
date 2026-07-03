<?php

namespace Database\Factories;

use App\Models\Elector;
use App\Models\Election;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class ElectorFactory extends Factory
{
    protected $model = Elector::class;

    public function definition(): array
    {
        return [
            'uuid' => Str::uuid()->toString(),
            'election_id' => Election::factory(),
            'full_name' => $this->faker->name(),
            'email' => $this->faker->unique()->safeEmail(),
            'phone' => $this->faker->unique()->phoneNumber(),
            'voter_code' => strtoupper(Str::random(12)),
            'status' => 'active',
            'verification_status' => 'verified',
            'verified_at' => now(),
        ];
    }
}
<?php

namespace Database\Factories;

use App\Models\Organization;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class OrganizationFactory extends Factory
{
    protected $model = Organization::class;

    public function definition(): array
    {
        return [
            'uuid' => Str::uuid()->toString(),
            'name' => $this->faker->company(),
            'slug' => $this->faker->slug(),
            'logo' => sprintf(
            'https://picsum.photos/400/400?random=%d',
            $this->faker->unique()->numberBetween(1, 10000)
        ),
            'owner_user_id' => User::factory(),
            'email' => $this->faker->companyEmail(),
            'phone' => $this->faker->phoneNumber(),
            'status' => 'active',
            'verified_at' => now(),
        ];
    }
}

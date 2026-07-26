<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class UserFactory extends Factory
{
    protected $model = User::class;

    public function definition(): array
    {
        return [
            'uuid' => Str::uuid()->toString(),
            'first_name' => $this->faker->firstName(),
            'last_name' => $this->faker->lastName(),
            'email' => $this->faker->unique()->safeEmail(),
            'phone' => $this->faker->unique()->phoneNumber(),
            'photo' => sprintf('https://i.pravatar.cc/200?u=%s', Str::uuid()),
            'password' => Hash::make('password'),
            'gender' => $this->faker->randomElement(['male', 'female']),
            'country' => $this->faker->country(),
            'city' => $this->faker->city(),
            'status' => 'active',
            'suspended_at' => null,
            'suspension_reason' => null,
            'email_verified_at' => now(),
            'phone_verified_at' => null,
            'last_login_at' => null,
            'locale' => 'fr',
            'timezone' => 'UTC',
        ];
    }
}

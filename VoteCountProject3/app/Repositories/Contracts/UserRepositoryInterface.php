<?php

namespace App\Repositories\Contracts;

use App\Models\User;
use Illuminate\Database\Eloquent\Collection;

interface UserRepositoryInterface extends BaseRepositoryInterface
{
    public function findByEmail(string $email): ?User;

    public function findByPhone(string $phone): ?User;

    public function getByOrganization(int $organizationId, int $perPage = 15);

    public function getByRole(string $role, int $perPage = 15);

    public function getActiveUsers(): Collection;

    public function updateLastLogin(int $userId, string $ip): bool;

    public function verifyEmail(int $userId): bool;

    public function verifyPhone(int $userId): bool;

    public function assignOrganization(int $userId, int $organizationId, string $role): bool;
}

<?php

namespace App\Repositories\Eloquent;

use App\Models\User;
use App\Repositories\Contracts\UserRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;

class UserRepository extends BaseRepository implements UserRepositoryInterface
{
    public function __construct(User $model)
    {
        parent::__construct($model);
    }

    public function findByEmail(string $email): ?User
    {
        return $this->model->where('email', $email)->first();
    }

    public function findByPhone(string $phone): ?User
    {
        return $this->model->where('phone', $phone)->first();
    }

    public function getByOrganization(int $organizationId, int $perPage = 15): LengthAwarePaginator
    {
        return $this->model->whereHas('organizations', function ($query) use ($organizationId) {
            $query->where('organization_id', $organizationId);
        })->paginate($perPage);
    }

    public function getByRole(string $role, int $perPage = 15): LengthAwarePaginator
    {
        return $this->model->role($role)->paginate($perPage);
    }

    public function getActiveUsers(): Collection
    {
        return $this->model->active()->get();
    }

    public function updateLastLogin(int $userId, string $ip): bool
    {
        return $this->update($userId, [
            'last_login_at' => now(),
            'last_login_ip' => $ip,
        ]) ? true : false;
    }

    public function verifyEmail(int $userId): bool
    {
        return $this->update($userId, [
            'email_verified_at' => now(),
            'status' => 'active',
        ]) ? true : false;
    }

    public function verifyPhone(int $userId): bool
    {
        return $this->update($userId, [
            'phone_verified_at' => now(),
        ]) ? true : false;
    }

    public function assignOrganization(int $userId, int $organizationId, string $role): bool
    {
        $user = $this->findOrFail($userId);
        $user->organizations()->attach($organizationId, [
            'role_slug' => $role,
            'joined_at' => now(),
            'status' => 'active',
        ]);

        return true;
    }
}

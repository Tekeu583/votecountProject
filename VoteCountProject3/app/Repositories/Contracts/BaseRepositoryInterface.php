<?php

namespace App\Repositories\Contracts;

use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Pagination\LengthAwarePaginator;

interface BaseRepositoryInterface
{
    public function find(int $id): ?Model;

    public function findByUuid(string $uuid): ?Model;

    public function findOrFail(int $id): Model;

    public function findByUuidOrFail(string $uuid): Model;

    public function all(array $columns = ['*']): Collection;

    public function paginate(int $perPage = 15, array $columns = ['*']): LengthAwarePaginator;

    public function create(array $data): Model;

    public function update(int $id, array $data): Model;

    public function delete(int $id): bool;

    public function forceDelete(int $id): bool;

    public function restore(int $id): bool;

    public function exists(array $conditions): bool;

    public function count(array $conditions = []): int;
}

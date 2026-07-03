<?php

namespace App\Repositories\Eloquent;

use App\Repositories\Contracts\BaseRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

abstract class BaseRepository implements BaseRepositoryInterface
{
    protected Model $model;

    public function __construct(Model $model)
    {
        $this->model = $model;
    }

    public function find(int $id): ?Model
    {
        return $this->model->find($id);
    }

    public function findByUuid(string $uuid): ?Model
    {
        return $this->model->where('uuid', $uuid)->first();
    }

    public function findOrFail(int $id): Model
    {
        return $this->model->findOrFail($id);
    }

    public function findByUuidOrFail(string $uuid): Model
    {
        return $this->model->where('uuid', $uuid)->firstOrFail();
    }

    public function all(array $columns = ['*']): Collection
    {
        return $this->model->all($columns);
    }

    public function paginate(int $perPage = 15, array $columns = ['*']): LengthAwarePaginator
    {
        return $this->model->paginate($perPage, $columns);
    }

    public function create(array $data): Model
    {
        return DB::transaction(function () use ($data) {
            return $this->model->create($data);
        });
    }

    public function update(int $id, array $data): Model
    {
        return DB::transaction(function () use ($id, $data) {
            $model = $this->findOrFail($id);
            $model->update($data);

            return $model->fresh();
        });
    }

    public function delete(int $id): bool
    {
        return DB::transaction(function () use ($id) {
            $model = $this->findOrFail($id);

            return $model->delete();
        });
    }

    public function forceDelete(int $id): bool
    {
        return DB::transaction(function () use ($id) {
            $model = $this->findOrFail($id);

            return $model->forceDelete();
        });
    }

    public function restore(int $id): bool
    {
        return DB::transaction(function () use ($id) {
            $model = $this->model->withTrashed()->findOrFail($id);

            return $model->restore();
        });
    }

    public function exists(array $conditions): bool
    {
        $query = $this->model->newQuery();

        foreach ($conditions as $key => $value) {
            $query->where($key, $value);
        }

        return $query->exists();
    }

    public function count(array $conditions = []): int
    {
        $query = $this->model->newQuery();

        foreach ($conditions as $key => $value) {
            $query->where($key, $value);
        }

        return $query->count();
    }
}

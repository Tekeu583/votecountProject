<?php

namespace App\Repositories\Eloquent;

use App\Models\Organization;
use App\Repositories\Contracts\OrganizationRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;

class OrganizationRepository extends BaseRepository implements OrganizationRepositoryInterface
{
    public function __construct(Organization $model)
    {
        parent::__construct($model);
    }

    public function findBySlug(string $slug): ?Organization
    {
        return $this->model->where('slug', $slug)->first();
    }

    public function getByOwner(int $ownerId, int $perPage = 15): LengthAwarePaginator
    {
        return $this->model->where('owner_user_id', $ownerId)
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);
    }

    public function getActiveOrganizations(): Collection
    {
        return $this->model->where('status', 'active')->get();
    }
}

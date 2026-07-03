<?php

namespace App\Repositories\Contracts;

use App\Models\Organization;
use Illuminate\Database\Eloquent\Collection;

interface OrganizationRepositoryInterface extends BaseRepositoryInterface
{
    public function findBySlug(string $slug): ?Organization;

    public function getByOwner(int $ownerId, int $perPage = 15);

    public function getActiveOrganizations(): Collection;
}

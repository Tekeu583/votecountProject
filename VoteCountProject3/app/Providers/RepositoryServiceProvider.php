<?php

namespace App\Providers;

use App\Repositories\Contracts\ElectionRepositoryInterface;
use App\Repositories\Contracts\OrganizationRepositoryInterface;
use App\Repositories\Contracts\UserRepositoryInterface;
use App\Repositories\Contracts\VoteRepositoryInterface;
use App\Repositories\Eloquent\ElectionRepository;
use App\Repositories\Eloquent\OrganizationRepository;
use App\Repositories\Eloquent\UserRepository;
use App\Repositories\Eloquent\VoteRepository;
use Illuminate\Support\ServiceProvider;

class RepositoryServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->bind(UserRepositoryInterface::class, UserRepository::class);
        $this->app->bind(ElectionRepositoryInterface::class, ElectionRepository::class);
        $this->app->bind(VoteRepositoryInterface::class, VoteRepository::class);
        $this->app->bind(OrganizationRepositoryInterface::class, OrganizationRepository::class);
    }

    public function boot(): void
    {
        //
    }
}

<?php

namespace App\Jobs;

use App\Models\Election;
use App\Services\ResultService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Cache;

class CalculateElectionResults implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, SerializesModels;

    public int $timeout = 3600;

    public string $queue = 'high';

    protected Election $election;

    public function __construct(Election $election)
    {
        $this->election = $election;
    }

    public function handle(ResultService $resultService): void
    {
        Cache::lock("results_calculation_{$this->election->id}", 60)->get(function () use ($resultService) {
            $resultService->calculateResults($this->election);
        });
    }
}

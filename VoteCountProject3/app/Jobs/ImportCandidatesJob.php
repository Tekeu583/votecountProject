<?php

namespace App\Jobs;

use App\Imports\CandidatesImport;
use App\Jobs\SendImportCompletionNotification;
use App\Models\Election;
use App\Models\ImportJob;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Maatwebsite\Excel\Facades\Excel;

class ImportCandidatesJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, SerializesModels;

    public int $timeout = 3600;
    public string $queue = 'high';

    protected ImportJob $importJob;
    protected Election $election;
    protected int $userId;

    public function __construct(ImportJob $importJob, Election $election, int $userId)
    {
        $this->importJob = $importJob;
        $this->election = $election;
        $this->userId = $userId;
    }

    public function handle(): void
    {
        $this->importJob->markAsProcessing();

        try {
            $filePath = storage_path('app/public/' . $this->importJob->file_path);

            $import = new CandidatesImport($this->election, $this->importJob);
            Excel::import($import, $filePath);

            $this->importJob->markAsCompleted();

            // Notifier l'utilisateur
            dispatch(new SendImportCompletionNotification($this->importJob));
        } catch (\Exception $e) {
            Log::error('Candidates import failed', [
                'error' => $e->getMessage(),
                'import_job_id' => $this->importJob->id,
            ]);
            $this->importJob->markAsFailed();
        }
    }
}

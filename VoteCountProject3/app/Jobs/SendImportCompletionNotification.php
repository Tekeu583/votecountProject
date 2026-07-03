<?php

namespace App\Jobs;

use App\Models\ImportJob;
use App\Models\Notification;
use App\Models\User;
use App\Notifications\ImportCompletedNotification;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class SendImportCompletionNotification implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, SerializesModels;

    public ImportJob $importJob;

    public function __construct(ImportJob $importJob)
    {
        $this->importJob = $importJob;
    }

    public function handle(): void
    {
        $user = User::find($this->importJob->imported_by);

        if (! $user) {
            return;
        }
        $user->notify(new ImportCompletedNotification($this->importJob));

        $title = match ($this->importJob->status) {
            'completed' => 'Import terminé avec succès',
            'failed'    => 'Échec de l\'import',
            default     => 'Statut de l\'import',
        };

        $message = $this->importJob->status === 'completed'
            ? "{$this->importJob->success_rows}/{$this->importJob->total_rows} ligne(s) importée(s) avec succès."
            : "L'import a échoué. {$this->importJob->failed_rows} ligne(s) en erreur.";

        Notification::create([
            'user_id' => $user->id,
            'type'    => 'import_completed',
            'title'   => $title,
            'message' => $message,
            'data'    => [
                'import_job_id' => $this->importJob->uuid,
                'status'        => $this->importJob->status,
                'total_rows'    => $this->importJob->total_rows,
                'success_rows'  => $this->importJob->success_rows,
                'failed_rows'   => $this->importJob->failed_rows,
            ],
        ]);
    }
}

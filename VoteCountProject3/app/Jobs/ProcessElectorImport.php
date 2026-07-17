<?php

namespace App\Jobs;

use App\Jobs\SendImportCompletionNotification;
use App\Models\Election;
use App\Models\Elector;
use App\Models\ImportJob;
use App\Notifications\VoterCodeNotification;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;
use App\Models\Notification as NotificationModel;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Storage;
use Maatwebsite\Excel\Facades\Excel;

class ProcessElectorImport implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected ImportJob $importJob;

    protected Election $election;

    public function __construct(ImportJob $importJob, Election $election)
    {
        $this->importJob = $importJob;
        $this->election = $election;
    }

    public function handle(): void
    {
        $this->importJob->markAsProcessing();

        $voterCodesSent = 0;

        $filePath = Storage::disk('public')->path($this->importJob->file_path);

        if (! file_exists($filePath)) {
            $this->importJob->addError(0, "Fichier introuvable : {$this->importJob->file_path}", []);
            $this->importJob->markAsFailed();
            return;
        }

        $rows = Excel::toArray([], $filePath)[0];
        $this->importJob->update(['total_rows' => count($rows) - 1]);

        foreach ($rows as $index => $row) {
            if ($index === 0) {
                continue;
            }

            DB::beginTransaction();
            try {
                $this->validateRow($row);

                $elector = Elector::create([
                    'election_id' => $this->election->id,
                    'full_name' => $row[0],
                    'email' => $row[1],
                    'phone' => $row[2] ?? null,
                    'import_batch_id' => $this->importJob->uuid,
                    'imported_by' => $this->importJob->imported_by,
                ]);
                if (
                    $this->election->election_mode === 'private'
                    && $this->election->voter_code
                    && ! empty($row[1])
                ) {
                    Notification::route('mail', $row[1])
                        ->notify(new VoterCodeNotification($this->election, $elector));
                    $voterCodesSent++;
                }

                $this->importJob->addSuccess();
                DB::commit();
            } catch (\Exception $e) {
                DB::rollBack();
                $this->importJob->addError($index + 1, $e->getMessage(), $row);
            }
        }

        $this->importJob->markAsCompleted();

        if ($voterCodesSent > 0) {
            NotificationModel::create([
                'user_id' => $this->importJob->imported_by,
                'type'    => 'voter_codes_sent',
                'title'   => 'Codes électeurs envoyés',
                'message' => "{$voterCodesSent} email(s) de code d'accès envoyé(s) pour l'élection « {$this->election->title} ».",
                'data'    => [
                    'election_uuid'    => $this->election->uuid,
                    'import_job_id'    => $this->importJob->uuid,
                    'voter_codes_sent' => $voterCodesSent,
                ],
            ]);
        }
        // Notify user
        dispatch(new SendImportCompletionNotification($this->importJob));
    }

    protected function validateRow(array $row): void
    {
        if (empty($row[0]) || empty($row[1])) {
            throw new \Exception('Name and email are required');
        }

        if (! filter_var($row[1], FILTER_VALIDATE_EMAIL)) {
            throw new \Exception('Invalid email format');
        }

        // Check duplicate in election
        $exists = Elector::where('election_id', $this->election->id)
            ->where(function ($q) use ($row) {
                $q->where('email', $row[1])
                    ->orWhere('phone', $row[2] ?? null);
            })->exists();

        if ($exists) {
            throw new \Exception('Elector already exists in this election');
        }
    }
}

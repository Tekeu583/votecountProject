<?php

namespace App\Jobs;

use App\Exports\ResultsExport;
use App\Models\Election;
use App\Models\User;
use App\Notifications\ExportReadyNotification;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Storage;
use Maatwebsite\Excel\Facades\Excel;

class ExportResultsJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, SerializesModels;

    public Election $election;

    public User $user;

    public string $format;

    public function __construct(Election $election, User $user, string $format = 'excel')
    {
        $this->election = $election;
        $this->user = $user;
        $this->format = $format;
    }

    public function handle(): void
    {
        $fileName = "results_{$this->election->slug}_{$this->election->uuid}.{$this->getExtension()}";
        $filePath = "exports/{$fileName}";

        $export = new ResultsExport($this->election);

        switch ($this->format) {
            case 'csv':
                Excel::store($export, $filePath, 'public', \Maatwebsite\Excel\Excel::CSV);
                break;
            case 'pdf':
                $pdf = Pdf::loadView('exports.results', ['election' => $this->election]);
                Storage::disk('public')->put($filePath, $pdf->output());
                break;
            default:
                Excel::store($export, $filePath, 'public');
        }

        // Notifier l'utilisateur
        $this->user->notify(new ExportReadyNotification($filePath, $fileName));
    }

    private function getExtension(): string
    {
        return match ($this->format) {
            'csv' => 'csv',
            'pdf' => 'pdf',
            default => 'xlsx',
        };
    }
}

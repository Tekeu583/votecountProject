<?php

namespace App\Notifications;

use App\Models\ImportJob;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ImportCompletedNotification extends Notification
{
    use Queueable;

    protected ImportJob $importJob;

    public function __construct(ImportJob $importJob)
    {
        $this->importJob = $importJob;
    }

    public function via($notifiable): array
    {
        return ['mail'];
    }

    public function toMail($notifiable): MailMessage
    {
        $subject = match ($this->importJob->status) {
            'completed' => ' Import terminé avec succès',
            'failed' => 'Échec de l\'import',
            default => ' Statut de l\'import',
        };

        $message = (new MailMessage)
            ->subject($subject)
            ->greeting('Bonjour ' . ($notifiable->full_name ?? 'Cher utilisateur'));

        if ($this->importJob->status === 'completed') {
            $message->line('Votre fichier a été importé avec succès.')
                ->line("Total des lignes traitées : {$this->importJob->total_rows}")
                ->line("Importées avec succès : {$this->importJob->success_rows}")
                ->line("En échec : {$this->importJob->failed_rows}");
        } else {
            $message->line('Une erreur est survenue lors de l\'import de votre fichier.')
                ->line("Total des lignes traitées : {$this->importJob->total_rows}")
                ->line("Importées avec succès : {$this->importJob->success_rows}")
                ->line("En échec : {$this->importJob->failed_rows}");
        }

        return $message->action(
            'Voir les détails',
            rtrim(config('app.frontend_url'), '/') . "/org/imports/{$this->importJob->uuid}"
        );
    }
}

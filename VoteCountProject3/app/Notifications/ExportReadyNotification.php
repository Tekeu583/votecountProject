<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use App\Models\Notification as NotificationModel;
use Illuminate\Notifications\Notification;

class ExportReadyNotification extends Notification
{
    use Queueable;

    protected string $filePath;

    protected string $fileName;

    public function __construct(string $filePath, string $fileName)
    {
        $this->filePath = $filePath;
        $this->fileName = $fileName;
    }

    public function via($notifiable): array
    {
        return ['mail'];
    }

    public function toMail($notifiable): MailMessage
    {

        if ($notifiable instanceof \App\Models\User) {
            NotificationModel::create([
                'user_id' => $notifiable->id,
                'type'    => 'export_ready',
                'title'   => 'Export prêt',
                'message' => "Votre fichier d'export « {$this->fileName} » est disponible au téléchargement.",
                'data'    => [
                    'file_name' => $this->fileName,
                    'file_path' => $this->filePath,
                    'expires_at' => now()->addDays(7)->toIso8601String(),
                ],
            ]);
        }
        return (new MailMessage)
            ->subject('📊 Votre export est prêt')
            ->greeting('Bonjour ' . ($notifiable->full_name ?? 'Cher utilisateur'))
            ->line('Votre fichier d\'export est maintenant disponible au téléchargement.')
            ->line('Nom du fichier : ' . $this->fileName)
            ->action('Télécharger', url("/storage/{$this->filePath}"))
            ->line('Ce lien expirera dans 7 jours.');
    }
}

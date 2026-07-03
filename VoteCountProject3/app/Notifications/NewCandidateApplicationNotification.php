<?php

namespace App\Notifications;

use App\Models\CandidateApplication;
use Illuminate\Bus\Queueable;
use App\Models\Notification as NotificationModel;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Messages\BroadcastMessage;

class NewCandidateApplicationNotification extends Notification
{
    use Queueable;

    protected CandidateApplication $application;

    public function __construct(CandidateApplication $application)
    {
        $this->application = $application;
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
                'type'    => 'new_candidate_application',
                'title'   => 'Nouvelle candidature reçue',
                'message' => "{$this->application->full_name} a soumis une candidature.",
                'data'    => [
                    'application_uuid' => $this->application->uuid,
                    'election_id'      => $this->application->election_id,
                    'candidate_name'   => $this->application->full_name,
                ],
            ]);
        }

        return (new MailMessage)
            ->subject('Nouvelle candidature reçue')
            ->greeting('Bonjour ' . $notifiable->first_name)
            ->line('Une nouvelle candidature a été soumise pour l\'élection.')
            ->line('Candidat: ' . $this->application->full_name)
            ->line('Email: ' . $this->application->email)
            ->action('Voir la candidature', url("/admin/elections/{$this->application->election_id}/applications/{$this->application->uuid}"))
            ->line('Merci de traiter cette candidature dans les plus brefs délais.');
    }
}

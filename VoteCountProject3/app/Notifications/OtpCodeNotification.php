<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class OtpCodeNotification extends Notification
{
    use Queueable;

    protected string $otp;

    protected string $channel;

    public function __construct(string $otp, string $channel = 'email')
    {
        $this->otp = $otp;
        $this->channel = $channel;
    }

    public function via($notifiable): array
    {
        return match ($this->channel) {
            'sms' => ['nexmo'],
            'whatsapp' => ['twilio'],
            default => ['mail'],
        };
    }

    public function toMail($notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Votre code OTP')
            ->greeting('Bonjour '.($notifiable->full_name ?? 'Cher utilisateur'))
            ->line('Voici votre code de vérification à usage unique :')
            ->line('**'.$this->otp.'**')
            ->line('Ce code expirera dans 5 minutes.')
            ->line('Ne partagez jamais ce code avec personne.')
            ->salutation('Cordialement, L\'équipe VoteCount');
    }

}

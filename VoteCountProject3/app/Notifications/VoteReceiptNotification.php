<?php

namespace App\Notifications;

use App\Models\Vote;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class VoteReceiptNotification extends Notification
{
    use Queueable;

    protected Vote $vote;

    public function __construct(Vote $vote)
    {
        $this->vote = $vote;
    }

    public function via($notifiable): array
    {
        return ['mail'];
    }

    public function toMail($notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Vote Receipt - '.$this->vote->election->title)
            ->greeting('Hello '.$notifiable->full_name)
            ->line('Your vote has been successfully recorded.')
            ->line('Election: '.$this->vote->election->title)
            ->line('Vote ID: '.$this->vote->uuid)
            ->line('Date: '.$this->vote->created_at->format('Y-m-d H:i:s'))
            ->action('View Receipt', url('/receipts/'.$this->vote->receipt->receipt_code))
            ->line('Thank you for participating!');
    }

}

<?php

namespace App\Notifications;

use App\Models\Candidate;
use App\Models\Election;
use App\Models\Elector;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * Envoyée à un électeur lors de son inscription (création manuelle ou import
 * en masse) sur une élection PRIVÉE, pour lui communiquer le voter_code
 * nécessaire à l'accès au vote.
 *
 * Note : voter_code est unique par élection (pas par électeur) — tous les
 * électeurs d'une même élection privée reçoivent le même code.
 */
class VoterCodeNotification extends Notification implements ShouldQueue
{
    use Queueable;

    protected Election $election;
    protected Candidate| Elector $elector;


    public function __construct(Election $election, Candidate|Elector $elector)
    {
        $this->election = $election;
        $this->elector = $elector;
    }

    public function via($notifiable): array
    {
        return ['mail'];
    }
    public function toMail($notifiable): MailMessage
    {
        $voteUrl = rtrim(config('app.frontend_url'), '/') . '/vote';

        $formattedCode = chunk_split($this->election->voter_code, 4, ' ');
        return (new MailMessage)
            ->view('emails.voter-code', [
                'election' => $this->election,
                'electorFullName' => $this->elector->full_name,
                'voterCode' => $formattedCode,
                'voteUrl' => $voteUrl,
            ]);
    }
}

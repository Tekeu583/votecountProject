<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class EmailVerificationMail extends Mailable
{
    use Queueable, SerializesModels;

    public User $user;

    public string $verificationUrl;

    public string $otpCode;

    public function __construct(User $user, string $verificationUrl, string $otpCode)
    {
        $this->user = $user;
        $this->verificationUrl = $verificationUrl;
        $this->otpCode = $otpCode;
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Vérification de votre adresse email - VoteCount',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.email-verification',
            with: [
                'userName' => $this->user->full_name,
                'verificationUrl' => $this->verificationUrl,
                'otpCode'         => $this->otpCode,
            ]
        );
    }
}
